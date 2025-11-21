import express from 'express';
import cors from 'cors';
import { Queue, Worker } from 'bullmq';
import { WPService, TranslationService } from './services';
import { WPSettings, TranslationJob, TranslationStatus } from '../types';

// --- Setup & Config ---
const app = express();
app.use(cors());
app.use(express.json());

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// --- Queue Setup ---
const translationQueue = new Queue('wp-translation-queue', { connection: REDIS_CONNECTION });

// In-memory DB (Replace with Postgres in production)
let wpSettings: WPSettings = {
  wpUrl: '',
  wpUser: '',
  wpAppPassword: '',
  sourceLang: 'en',
  targetLangs: ['sk', 'kk', 'cs', 'mo'],
  postTypes: ['posts', 'pages'],
  geminiApiKey: ''
};

const jobs: Record<string, TranslationJob> = {};
const logs: { id: number; message: string; timestamp: string }[] = [];

// --- Worker Logic ---
const worker = new Worker('wp-translation-queue', async job => {
  const { postId, postType, sourceLang, targetLang } = job.data;
  
  const jobId = job.id!;
  if (jobs[jobId]) {
    jobs[jobId].status = TranslationStatus.PROCESSING;
  }
  
  try {
    const wp = new WPService(wpSettings);
    // Pass the API Key from settings to the Service
    const translator = new TranslationService(wpSettings.geminiApiKey);

    // 1. Fetch original post
    const posts = await wp.getPosts(postType, sourceLang); 
    const post = posts.find(p => p.id === postId);

    if (!post) throw new Error(`Post #${postId} not found`);

    // 2. Translate
    const translatedData = await translator.translatePostBatch(post, sourceLang, targetLang);

    // 3. Create in WP
    const newId = await wp.createTranslation(post, translatedData, targetLang);

    if (jobs[jobId]) {
      jobs[jobId].status = TranslationStatus.COMPLETED;
      jobs[jobId].completedAt = new Date().toISOString();
      jobs[jobId].progress = 100;
    }
    
    logs.unshift({
      id: Date.now(),
      message: `Translated Post #${postId} to ${targetLang} (New ID: ${newId})`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    if (jobs[jobId]) {
      jobs[jobId].status = TranslationStatus.FAILED;
      jobs[jobId].error = error.message;
    }
    console.error("Worker Error:", error);
  }

}, { connection: REDIS_CONNECTION });


// --- API Routes ---

// Settings
app.get('/api/settings', (req, res) => res.json(wpSettings));
app.post('/api/settings', (req, res) => {
  wpSettings = { ...wpSettings, ...req.body };
  console.log("Settings updated:", wpSettings.wpUrl);
  res.json({ success: true });
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
  const tempSettings = wpSettings.wpUrl ? wpSettings : (req.body as WPSettings);
  const wp = new WPService(tempSettings);
  const installed = await wp.checkPolylang();
  res.json({ installed }); 
});

// Install Polylang
app.post('/api/wp/install-polylang', async (req, res) => {
  const wp = new WPService(wpSettings);
  const success = await wp.installPolylang();
  res.json({ success });
});

// Get Posts
app.get('/api/posts', async (req, res) => {
  if (!wpSettings.wpUrl) return res.status(400).json({ error: "Configure settings first" });
  try {
    const wp = new WPService(wpSettings);
    const posts = await wp.getPosts('posts', wpSettings.sourceLang);
    res.json(posts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Trigger Translation
app.post('/api/translate', async (req, res) => {
  const { postId, postType, targetLangs } = req.body;
  
  // Handle bulk or single
  const postIds = Array.isArray(postId) ? postId : [postId];
  const createdJobs: string[] = [];

  for (const pid of postIds) {
    for (const lang of targetLangs) {
      const job = await translationQueue.add('translate-post', {
        postId: pid,
        postType,
        sourceLang: wpSettings.sourceLang,
        targetLang: lang
      });
      
      if (job.id) {
        jobs[job.id] = {
          id: job.id,
          postId: pid,
          sourceLang: wpSettings.sourceLang,
          targetLang: lang,
          status: TranslationStatus.PENDING,
          progress: 0,
          createdAt: new Date().toISOString(),
          title: `Post #${pid} -> ${lang}`
        };
        createdJobs.push(job.id);
      }
    }
  }

  res.json({ jobs: createdJobs });
});

// Get Jobs
app.get('/api/jobs', (req, res) => {
  res.json(Object.values(jobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});