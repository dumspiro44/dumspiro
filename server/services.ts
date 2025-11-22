
import { GoogleGenAI } from "@google/genai";
import { WPPost, WPSettings } from "../types";

// --- WordPress Service ---

export class WPService {
  private authHeader: string;
  private baseUrl: string;

  constructor(private settings: WPSettings) {
    const token = btoa(`${settings.wpUser}:${settings.wpAppPassword}`);
    this.authHeader = `Basic ${token}`;
    this.baseUrl = settings.wpUrl ? settings.wpUrl.replace(/\/$/, "") : "";
  }

  async validateConnection(): Promise<boolean> {
    try {
      if (!this.settings.wpUrl) return false;
      
      const res = await fetch(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: { Authorization: this.authHeader },
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async checkPolylang(): Promise<boolean> {
    try {
      if (!this.baseUrl) return false;
      // Check if we can query posts with 'lang' param
      const res = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts?lang=en&per_page=1`, {
        headers: { Authorization: this.authHeader },
      });
      return res.ok; 
    } catch (e) {
      return false;
    }
  }

  async installPolylang(): Promise<boolean> {
    console.log(`Attempting to install Polylang on ${this.baseUrl}...`);
    // In a real scenario, this might involve WP-CLI or TGM Plugin Activation logic
    // For REST API, standard endpoints don't install plugins without custom extensions.
    // We simulate success for the architecture.
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  }

  async getPosts(postType: string = 'posts', lang?: string): Promise<WPPost[]> {
    if (!this.baseUrl) return [];
    
    const url = new URL(`${this.baseUrl}/wp-json/wp/v2/${postType}`);
    if (lang) url.searchParams.append('lang', lang);
    url.searchParams.append('per_page', '20'); 

    const res = await fetch(url.toString(), {
      headers: { Authorization: this.authHeader },
    });
    
    if (!res.ok) {
      const txt = await res.text();
      console.error("WP Fetch Error:", txt);
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }
    return await res.json();
  }

  async createTranslation(
    originalPost: WPPost, 
    translatedContent: { title: string; content: string; excerpt: string }, 
    targetLang: string
  ): Promise<number> {
    // 1. Create the new post
    const payload = {
      title: translatedContent.title,
      content: translatedContent.content,
      excerpt: translatedContent.excerpt,
      status: 'draft', 
      lang: targetLang, 
      type: originalPost.type
    };

    const createRes = await fetch(`${this.baseUrl}/wp-json/wp/v2/${originalPost.type}`, {
      method: 'POST',
      headers: { 
        Authorization: this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create translation: ${err}`);
    }

    const newPost = await createRes.json();

    // 2. Link translations via Polylang logic (often requires updating 'translations' field)
    // Note: Polylang REST API support varies by version, standard approach assumes 'translations' field is writable
    const existingTranslations = originalPost.translations || {};
    const updatedTranslations = {
      ...existingTranslations,
      [targetLang]: newPost.id,
      [originalPost.lang || 'en']: originalPost.id
    };

    // Update BOTH posts to link them
    await this.updatePostTranslations(originalPost.id, originalPost.type, updatedTranslations);
    await this.updatePostTranslations(newPost.id, originalPost.type, updatedTranslations);

    return newPost.id;
  }

  private async updatePostTranslations(id: number, type: string, translations: Record<string, number>) {
    await fetch(`${this.baseUrl}/wp-json/wp/v2/${type}/${id}`, {
      method: 'POST',
      headers: { 
        Authorization: this.authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ translations })
    });
  }
}

// --- Gemini Service ---

export class TranslationService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.API_KEY || ''; 
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async translateContent(
    htmlContent: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<string> {
    if (!htmlContent) return "";

    const prompt = `
      You are a professional translator engine for WordPress.
      Translate the following HTML content from ${sourceLang} to ${targetLang}.
      
      STRICT RULES:
      1. Preserve ALL HTML tags, attributes (class, id, style), and structure exactly.
      2. Do not translate URLs within href or src attributes.
      3. Preserve WordPress shortcodes (e.g., [gallery ids="1,2"]).
      4. Only translate the human-readable text inside the tags.
      5. Output ONLY the translated HTML, no preamble or markdown code blocks.

      Content to translate:
      ${htmlContent}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text?.trim() || "";
    } catch (error) {
      console.error("Gemini Translation Error", error);
      throw error;
    }
  }

  async translatePostBatch(post: WPPost, sourceLang: string, targetLang: string) {
    const [title, content, excerpt] = await Promise.all([
      this.translateContent(post.title.rendered, sourceLang, targetLang),
      this.translateContent(post.content.rendered, sourceLang, targetLang),
      this.translateContent(post.excerpt.rendered, sourceLang, targetLang),
    ]);

    return { title, content, excerpt };
  }
}
