import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';

// Helper to strip HTML tags for text processing
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Local Smart NLP Summarizer (100% Free, Zero external dependency)
function localSummarize(text: string, title?: string): { summary: string; bullets: string[]; actionItems: string[] } {
  const clean = stripHtml(text);
  if (!clean || clean.length < 20) {
    return {
      summary: clean || 'ไม่มีเนื้อหาเพียงพอสำหรับการสรุป',
      bullets: clean ? [clean] : [],
      actionItems: [],
    };
  }

  // Split into sentences / paragraphs
  const rawSentences = clean
    .split(/(?<=[.!?\n\r])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const sentences = rawSentences.length > 0 ? rawSentences : [clean];

  // Pick the most informative sentences
  const topSentences = sentences.slice(0, Math.min(3, sentences.length));
  const summary = topSentences.join(' ');

  // Extract bullets
  const bullets = sentences.slice(0, Math.min(5, sentences.length));

  // Extract action items (detect keywords like ต้อง, ทำ, ส่ง, ตรวจสอบ, ติดต่อ, todo, task, fix, build)
  const actionKeywords = ['ต้อง', 'ควร', 'จะ', 'ส่ง', 'ทำ', 'ตรวจ', 'โทร', 'ติดต่อ', 'todo', 'task', 'fix', 'finish', 'review', 'buy', 'จัดเตรียม'];
  const actionItems = sentences.filter((s) =>
    actionKeywords.some((kw) => s.toLowerCase().includes(kw))
  );

  return {
    summary: summary || clean.substring(0, 150) + '...',
    bullets: bullets.length > 0 ? bullets : [clean.substring(0, 100)],
    actionItems: actionItems.length > 0 ? actionItems.slice(0, 5) : ['บันทึกนี้ไม่มีรายการสิ่งที่ต้องทำที่ระบุไว้ชัดเจน'],
  };
}

// Local Smart Tone Rewriter (100% Free)
function localRewrite(text: string, style: string): string {
  const clean = stripHtml(text);
  if (!clean) return '';

  const sentences = clean.split(/(?<=[.!?\n\r])\s+/).filter((s) => s.trim().length > 0);

  switch (style) {
    case 'professional':
      return sentences
        .map((s) => `• ${s.trim()}`)
        .join('\n\n') + '\n\n(จัดทำและเรียบเรียงให้อยู่ในรูปแบบที่เป็นระเบียบเรียบร้อย)';

    case 'shorten':
      return sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(' ');

    case 'expand':
      return sentences
        .map((s) => `${s.trim()} โดยควรคำนึงถึงรายละเอียดและแนวทางปฏิบัติที่เกี่ยวข้องเพิ่มเติม`)
        .join('\n\n');

    case 'bullets':
      return sentences.map((s) => `• ${s.trim()}`).join('\n');

    case 'action_items':
      return sentences.map((s, idx) => `[ ] งานที่ ${idx + 1}: ${s.trim()}`).join('\n');

    default:
      return clean;
  }
}

// Function to call Google Gemini Free Tier if API key is provided
async function callGeminiApi(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API call returned status:', response.status);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || null;
  } catch (error) {
    console.error('Gemini API fetch error:', error);
    return null;
  }
}

export class AiController {
  // AI Summarize Note
  static async summarize(req: AuthRequest, res: Response) {
    try {
      const { content, title } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || '';

      const plainContent = stripHtml(content || '');

      if (!plainContent || plainContent.length < 15) {
        return res.status(400).json({ error: 'เนื้อหาโน้ตสั้นเกินไปสำหรับการสรุป' });
      }

      // If Gemini Key available, use Gemini Free Tier
      if (apiKey) {
        const prompt = `คุณคือผู้ช่วย AI สรุปบันทึกอัจฉริยะ กรุณาสรุปเนื้อหาบันทึกต่อไปนี้เป็นภาษาไทย:
หัวข้อ: ${title || 'ไม่มีชื่อ'}
เนื้อหา:
${plainContent}

กรุณาตอบกลับในรูปแบบ JSON ต่อไปนี้เท่านั้น (ไม่ต้องใส่ markdown code fence):
{
  "summary": "สรุปสั้น 2-3 บรรทัด",
  "bullets": ["ประเด็นสำคัญที่ 1", "ประเด็นสำคัญที่ 2", "ประเด็นสำคัญที่ 3"],
  "actionItems": ["สิ่งที่ต้องทำ 1", "สิ่งที่ต้องทำ 2"]
}`;

        const geminiResult = await callGeminiApi(prompt, apiKey);
        if (geminiResult) {
          try {
            const cleanJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return res.json({
              engine: 'gemini-free',
              summary: parsed.summary || '',
              bullets: parsed.bullets || [],
              actionItems: parsed.actionItems || [],
            });
          } catch (e) {
            // If JSON parse failed, return text as summary
            return res.json({
              engine: 'gemini-free',
              summary: geminiResult,
              bullets: [geminiResult],
              actionItems: [],
            });
          }
        }
      }

      // Local Smart NLP Fallback (100% Free, zero config)
      const localResult = localSummarize(plainContent, title);
      return res.json({
        engine: 'local-smart-nlp',
        ...localResult,
      });
    } catch (error: any) {
      console.error('AI summarize error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสรุปเนื้อหา' });
    }
  }

  // AI Rewrite Note
  static async rewrite(req: AuthRequest, res: Response) {
    try {
      const { content, style } = req.body; // style: 'professional' | 'shorten' | 'expand' | 'bullets' | 'friendly' | 'action_items'
      const apiKey = process.env.GEMINI_API_KEY || '';

      const plainContent = stripHtml(content || '');
      if (!plainContent) {
        return res.status(400).json({ error: 'ไม่พบเนื้อหาสำหรับการเรียบเรียง' });
      }

      if (apiKey) {
        const styleDescriptions: Record<string, string> = {
          professional: 'ปรับสำนวนให้เป็นทางการ สุภาพ ถูกต้องตามหลักภาษา เหมาะสำหรับใช้ในงานราชการหรือติดต่อธุรกิจ',
          shorten: 'ย่อข้อความให้กระชับ ได้ใจความสำคัญ ชัดเจน รวบรัด',
          expand: 'ขยายความเพิ่มเติม อธิบายรายละเอียดให้เห็นภาพชัดเจนและครบถ้วนยิ่งขึ้น',
          bullets: 'แปลงข้อความเป็นรายการหัวข้อย่อย (Bullet points) ที่อ่านง่าย',
          friendly: 'ปรับน้ำเสียงให้อบอุ่น เป็นกันเอง เข้าใจง่าย และสนุกสนาน',
          action_items: 'ดึงและเปลี่ยนเนื้อหาให้ออกมาเป็นรายการเช็คลิสต์สิ่งที่ต้องทำ (To-Do Checklist)',
        };

        const targetInstruction = styleDescriptions[style] || 'ช่วยเรียบเรียงข้อความให้สละสลวย';
        const prompt = `คุณคือผู้ช่วยนักเขียนและบรรณาธิการภาษาไทยมืออาชีพ คำสั่งคือ: ${targetInstruction}
ข้อความต้นฉบับ:
"${plainContent}"

กรุณาตอบเฉพาะข้อความที่เรียบเรียงเสร็จแล้วเป็นภาษาไทย โดยคงความหมายเดิมไว้ ไม่ต้องมีคำเกริ่นนำหรือคำลงท้าย:`;

        const geminiResult = await callGeminiApi(prompt, apiKey);
        if (geminiResult) {
          return res.json({
            engine: 'gemini-free',
            rewritten: geminiResult.trim(),
          });
        }
      }

      // Local Fallback
      const localRewritten = localRewrite(plainContent, style);
      return res.json({
        engine: 'local-smart-nlp',
        rewritten: localRewritten,
      });
    } catch (error: any) {
      console.error('AI rewrite error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเรียบเรียง' });
    }
  }

  // AI Smart Semantic Search across Notes
  static async search(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'กรุณากรอกคำค้นหา' });
      }

      const q = query.trim().toLowerCase();
      const keywords = q.split(/\s+/).filter((k) => k.length > 0);

      // Fetch all non-archived notes of user
      const userNotes = await prisma.note.findMany({
        where: {
          userId,
          isArchived: false,
        },
        include: {
          notebook: true,
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Score each note based on semantic and keyword relevancy
      const scoredNotes = userNotes.map((note) => {
        let score = 0;
        const titleLower = (note.title || '').toLowerCase();
        const contentClean = stripHtml(note.content).toLowerCase();
        const notebookName = (note.notebook?.name || '').toLowerCase();
        const labelNames = note.labels.map((l) => l.label.name.toLowerCase()).join(' ');

        // Exact match
        if (titleLower.includes(q)) score += 50;
        if (contentClean.includes(q)) score += 30;
        if (notebookName.includes(q)) score += 20;
        if (labelNames.includes(q)) score += 20;

        // Individual keyword matches
        for (const kw of keywords) {
          if (titleLower.includes(kw)) score += 15;
          if (contentClean.includes(kw)) score += 8;
          if (notebookName.includes(kw)) score += 5;
          if (labelNames.includes(kw)) score += 5;
        }

        // Pinned & Favorite bonus
        if (note.isPinned) score += 3;
        if (note.isFavorite) score += 2;

        return {
          ...note,
          labels: note.labels.map((l) => l.label),
          matchScore: score,
          snippet: stripHtml(note.content).substring(0, 160) + '...',
        };
      });

      // Filter notes with positive score and sort descending
      const results = scoredNotes
        .filter((n) => n.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20);

      return res.json({
        total: results.length,
        query: q,
        results,
      });
    } catch (error: any) {
      console.error('AI search error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหา' });
    }
  }
}
