
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { WPService, TranslationService } from './services';
import { WPSettings, TranslationStatus } from '../types';

// --- Setup & Config ---
const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// --- Auth Middleware ---
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ error: 'Unauthorized' });
     return;
  }
  // Simple token verification (In real prod use JWT.verify)
  // For this microservice, we check if the token string matches a session or simple secret
  const token = authHeader.split(' ')[1];
  if (token !== 'admin-session-token') { // Simplified for example
     res.status(403).json({ error: 'Forbidden' });
     return;
  }
  next();
};

// --- Queue Setup ---
const translationQueue = new Queue('wp-translation-queue', { connection: REDIS_CONNECTION });

// Helper to get settings or defaults
async function getSettings(): Promise<WPSettings> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return {
      wpUrl: '',
      wpUser: '',
      wpAppPassword: '',
      sourceLang: 'en',
      targetLangs: [],
      postTypes: ['post'],
      geminiApiKey: '',
      systemInstruction: ''
    };
  }
  return settings as WPSettings;
}

// --- Worker Logic ---
const worker = new Worker('wp-translation-queue', async job => {
  const { postId, postType, sourceLang, targetLang } = job.data;
  const jobId = job.id!;

  await prisma.translationJob.update({
    where: { id: jobId },
    data: { status: TranslationStatus.PROCESSING, progress: 10 }
  });

  try {
    const settings = await getSettings();

    if (!settings.wpUrl || !settings.geminiApiKey) {
      throw new Error("Missing WP URL or Gemini API Key in settings");
    }

    const wp = new WPService(settings);
    const translator = new TranslationService(settings.geminiApiKey);

    // Fetch original post
    const posts = await wp.getPosts(postType, sourceLang); 
    const post = posts.find(p => p.id === postId);

    if (!post) throw new Error(`Post #${postId} not found`);

    await prisma.log.create({
      data: { jobId, message: `Fetched Post #${postId}. Starting translation...` }
    });

    // Translate
    const translatedData = await translator.translatePostBatch(post, sourceLang, targetLang);

    // Create in WP
    const newId = await wp.createTranslation(post, translatedData, targetLang);

    // Success
    await prisma.translationJob.update({
      where: { id: jobId },
      data: { 
        status: TranslationStatus.COMPLETED, 
        progress: 100, 
        completedAt: new Date() 
      }
    });
    
    await prisma.log.create({
      data: { jobId, message: `Success! Created Post #${newId} (${targetLang})` }
    });

  } catch (error: any) {
    console.error("Worker Error:", error);
    await prisma.translationJob.update({
      where: { id: jobId },
      data: { 
        status: TranslationStatus.FAILED, 
        error: error.message 
      }
    });
    await prisma.log.create({
      data: { jobId, message: `Error: ${error.message}` }
    });
  }

}, { connection: REDIS_CONNECTION });


// --- API Routes ---

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { username } });
  
  // In prod use bcrypt.compare
  if (admin && admin.passwordHash === password) {
    res.json({ token: 'admin-session-token' }); // Return a simplified token
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected Routes
app.use('/api/settings', authMiddleware);
app.use('/api/posts', authMiddleware);
app.use('/api/jobs', authMiddleware);
app.use('/api/translate', authMiddleware);
app.use('/api/connect', authMiddleware);
app.use('/api/wp', authMiddleware);

// Get Settings
app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

// Save Settings (Upsert ID=1)
app.post('/api/settings', async (req, res) => {
  const data = req.body;
  const updated = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      wpUrl: data.wpUrl,
      wpUser: data.wpUser,
      wpAppPassword: data.wpAppPassword,
      sourceLang: data.sourceLang,
      targetLangs: data.targetLangs,
      postTypes: data.postTypes,
      geminiApiKey: data.geminiApiKey,
      systemInstruction: data.systemInstruction
    },
    create: {
      id: 1,
      ...data
    }
  });
  res.json({ success: true, settings: updated });
});

// WP Connection Test
app.post('/api/connect', async (req, res) => {
  const tempSettings = req.body as WPSettings;
  const wp = new WPService(tempSettings);
  const valid = await wp.validateConnection();
  res.json({ valid });
});

// Check Polylang
app.post('/api/wp/check-polylang', async (req, res) => {
  let settings = await getSettings();
  if (req.body.wpUrl) settings = req.body;
  
  const wp = new WPService(settings);
  const installed = await wp.checkPolylang();
  res.json({ installed }); 
});

// Install Polylang
app.post('/api/wp/install-polylang', async (req, res) => {
  const settings = await getSettings();
  const wp = new WPService(settings);
  const success = await wp.installPolylang();
  res.json({ success });
});

// Get Posts
app.get('/api/posts', async (req, res) => {
  const settings = await getSettings();
  if (!settings.wpUrl) return res.status(400).json({ error: "Configure settings first" });
  
  try {
    const wp = new WPService(settings);
    const posts = await wp.getPosts('posts', settings.sourceLang);
    res.json(posts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Trigger Translation
app.post('/api/translate', async (req, res) => {
  const { postId, postType, targetLangs } = req.body;
  const settings = await getSettings();
  
  const postIds = Array.isArray(postId) ? postId : [postId];
  const createdJobIds: string[] = [];

  for (const pid of postIds) {
    for (const lang of targetLangs) {
      const job = await translationQueue.add('translate-post', {
        postId: pid,
        postType: postType || 'post', 
        sourceLang: settings.sourceLang,
        targetLang: lang
      });
      
      if (job.id) {
        await prisma.translationJob.create({
          data: {
            id: job.id,
            postId: pid,
            sourceLang: settings.sourceLang,
            targetLang: lang,
            status: TranslationStatus.PENDING,
            title: `Post #${pid} -> ${lang.toUpperCase()}`
          }
        });
        createdJobIds.push(job.id);
      }
    }
  }

  res.json({ jobs: createdJobIds });
});

// Get Jobs
app.get('/api/jobs', async (req, res) => {
  const jobs = await prisma.translationJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50 
  });
  res.json(jobs);
});

const PORT = process.env.PORT || 3001;

// Startup Logic: Ensure Admin exists
prisma.admin.findFirst().then(async (admin) => {
    if (!admin) {
        console.log("Creating default admin...");
        await prisma.admin.create({
            data: {
                username: 'admin',
                passwordHash: process.env.ADMIN_PASSWORD || 'admin' 
            }
        });
    }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
