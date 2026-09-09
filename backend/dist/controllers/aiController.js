"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const database_1 = require("../utils/database");
// Helper to strip HTML tags for text processing
function stripHtml(html) {
    if (!html)
        return '';
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
function localSummarize(text, title) {
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
    const actionItems = sentences.filter((s) => actionKeywords.some((kw) => s.toLowerCase().includes(kw)));
    return {
        summary: summary || clean.substring(0, 150) + '...',
        bullets: bullets.length > 0 ? bullets : [clean.substring(0, 100)],
        actionItems: actionItems.length > 0 ? actionItems.slice(0, 5) : ['บันทึกนี้ไม่มีรายการสิ่งที่ต้องทำที่ระบุไว้ชัดเจน'],
    };
}
// Local Smart Tone Rewriter (100% Free)
function localRewrite(text, style) {
    const clean = stripHtml(text);
    if (!clean)
        return '';
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
        case 'casual':
            return sentences
                .map((s) => s.trim())
                .join(' ') + ' (สรุปแบบสบายๆ เป็นกันเอง)';
        case 'executive':
            return sentences
                .slice(0, Math.min(3, sentences.length))
                .map((s) => `• ${s.trim()}`)
                .join('\n') + '\n\n[ข้อสรุปเชิงกลยุทธ์: ดำเนินการตามประเด็นสำคัญข้างต้นทันที]';
        case 'academic':
            return sentences
                .map((s) => `จากการวิเคราะห์พบว่า ${s.trim()} ซึ่งสอดคล้องกับหลักการและแนวทางปฏิบัติ`)
                .join(' ');
        default:
            return clean;
    }
}
// Clean HTML output from Gemini (stripping ```html and ```)
function cleanHtmlOutput(raw) {
    let cleaned = (raw || '').trim();
    cleaned = cleaned.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return cleaned;
}
// Local Smart Note Formatter (100% Free fallback when offline or no API key)
function localFormat(text, title, template = 'beautify') {
    const clean = stripHtml(text);
    const noteTitle = title || 'บันทึกสำคัญ';
    const sentences = clean
        .split(/(?<=[.!?\n\r])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
    const points = sentences.length > 0 ? sentences : [clean || 'ไม่มีเนื้อหา'];
    switch (template) {
        case 'meeting':
            return `<h2>📅 บันทึกการประชุม: ${noteTitle}</h2>
<p><strong>ผู้เข้าร่วม:</strong> ทีมงานที่เกี่ยวข้อง &nbsp;|&nbsp; <strong>สถานะ:</strong> บันทึกเรียบร้อย</p>
<hr/>
<h3>🎯 วัตถุประสงค์การประชุม</h3>
<p>${points[0] || 'เพื่อหารือและติดตามความคืบหน้าของงาน'}</p>
<h3>💬 ประเด็นสำคัญที่พูดคุย</h3>
<ul>
  ${points.slice(0, 5).map((p) => `<li>${p}</li>`).join('')}
</ul>
<h3>⚖️ มติและข้อสรุปของที่ประชุม</h3>
<blockquote><strong>ข้อตกลง:</strong> ${points[1] || points[0]}</blockquote>
<h3>📋 รายการสิ่งที่ต้องทำต่อ (Action Items)</h3>
<ul data-type="taskList">
  ${points.slice(0, 3).map((p, i) => `<li data-type="taskItem" data-checked="false"><p><strong>งานที่ ${i + 1}:</strong> ${p}</p></li>`).join('')}
</ul>`;
        case 'project_plan':
            return `<h2>🚀 แผนงานโครงการ: ${noteTitle}</h2>
<p><strong>ภาพรวมโครงการ:</strong> ${points[0]}</p>
<h3>🎯 เป้าหมายหลัก (Objectives & Milestones)</h3>
<ul>
  ${points.slice(0, 4).map((p) => `<li><strong>เป้าหมาย:</strong> ${p}</li>`).join('')}
</ul>
<h3>🛠️ ลำดับขั้นตอนการดำเนินงาน (Phases)</h3>
<ol>
  <li><strong>ระยะที่ 1 (เตรียมการ):</strong> วางแผนและรวบรวมข้อกำหนดเบื้องต้น</li>
  <li><strong>ระยะที่ 2 (ดำเนินการ):</strong> ${points[1] || 'ลงมือปฏิบัติตามแผนงานและติดตามผล'}</li>
  <li><strong>ระยะที่ 3 (ส่งมอบและสรุปผล):</strong> ส่งมอบงานและประเมินผลลัพธ์</li>
</ol>
<h3>⚠️ การบริหารความเสี่ยง (Risk Management)</h3>
<blockquote>ติดตามความคืบหน้าเป็นประจำเพื่อป้องกันความล่าช้าและการเบี่ยงเบนของขอบเขตงาน</blockquote>`;
        case 'cornell':
            return `<h2>💡 ระบบจดบันทึกแบบคอร์เนลล์: ${noteTitle}</h2>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="border: 1px solid #cbd5e1; padding: 8px; width: 35%; text-align: left;">🔑 คำสำคัญ / คำถามนำ (Cues)</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px; width: 65%; text-align: left;">📝 รายละเอียดบันทึก (Notes)</th>
    </tr>
  </thead>
  <tbody>
    ${points.slice(0, 4).map((p, idx) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;"><strong>ประเด็นที่ ${idx + 1}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${p}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
<blockquote><strong>📌 บทสรุปท้ายบท (Summary):</strong> ${points.slice(0, 2).join(' ')}</blockquote>`;
        case 'pros_cons':
            return `<h2>⚖️ วิเคราะห์ข้อดีและข้อเสีย: ${noteTitle}</h2>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #ecfdf5; color: #065f46; width: 50%; text-align: left;">✅ ข้อดี / จุดเด่น (Pros)</th>
      <th style="border: 1px solid #cbd5e1; padding: 10px; background-color: #fef2f2; color: #991b1b; width: 50%; text-align: left;">❌ ข้อจำกัด / จุดที่ต้องระวัง (Cons)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
        <ul>
          ${points.slice(0, Math.ceil(points.length / 2)).map((p) => `<li>${p}</li>`).join('')}
        </ul>
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 10px; vertical-align: top;">
        <ul>
          <li>อาจต้องใช้เวลาและทรัพยากรในการบริหารจัดการเพิ่มเติม</li>
          <li>ควรตรวจสอบผลกระทบและข้อกำหนดอย่างรอบคอบ</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>
<h3>🎯 ข้อเสนอแนะเชิงกลยุทธ์ (Final Recommendation)</h3>
<p>${points[0] || 'ควรเริ่มทดลองใช้ในวงจำกัดก่อนขยายผลเต็มรูปแบบ'}</p>`;
        case 'faq':
            return `<h2>❓ คำถามที่พบบ่อย (FAQ): ${noteTitle}</h2>
${points.slice(0, 4).map((p, i) => `
<h3>ถามที่ ${i + 1}: สาระสำคัญเกี่ยวกับเรื่องนี้คืออะไร?</h3>
<p><strong>ตอบ:</strong> ${p}</p>
`).join('')}`;
        case 'reflection':
            return `<h2>🌱 บันทึกทบทวนและถอดบทเรียน: ${noteTitle}</h2>
<h3>🎉 สิ่งที่ทำได้ดีในครั้งนี้ (Wins)</h3>
<ul>
  <li>${points[0] || 'สามารถดำเนินงานได้ตามเป้าหมายที่วางไว้'}</li>
</ul>
<h3>💡 บทเรียนและข้อคิดสำคัญ (Key Learnings)</h3>
<ul>
  ${points.slice(1, 4).map((p) => `<li>${p}</li>`).join('')}
</ul>
<h3>🚀 สิ่งที่จะปรับปรุงและก้าวต่อไป (Next Actions)</h3>
<blockquote>ตั้งเป้าหมายติดตามและประเมินผลอย่างต่อเนื่องในสัปดาห์หน้า</blockquote>`;
        case 'executive_summary':
            return `<h2>📊 สรุปรายงานสำหรับผู้บริหาร: ${noteTitle}</h2>
<blockquote><strong>⚡ Executive Takeaway:</strong> ${points.slice(0, 2).join(' ')}</blockquote>
<h3>📌 ข้อมูลและสาระสำคัญระดับกลยุทธ์</h3>
<ul>
  ${points.map((p) => `<li>${p}</li>`).join('')}
</ul>
<h3>📈 มติการตัดสินใจและข้อเสนอแนะ</h3>
<p>แนะนำให้ทีมงานดำเนินการตามประเด็นหลักข้างต้น เพื่อให้บรรลุผลสัมฤทธิ์สูงสุดตามกรอบเวลา</p>`;
        case 'study_guide':
            return `<h2>📚 คู่มือสรุปบทเรียนและเตรียมสอบ: ${noteTitle}</h2>
<h3>🔑 นิยามและคำศัพท์สำคัญ (Key Concepts)</h3>
<ul>
  ${points.slice(0, 3).map((p) => `<li><strong>สาระสำคัญ:</strong> ${p}</li>`).join('')}
</ul>
<h3>📝 ประเด็นที่มักออกสอบหรือควรจำ</h3>
<blockquote>${points[0]}</blockquote>
<h3>💡 คำถามทบทวนความเข้าใจ</h3>
<ol>
  <li>จงอธิบายประเด็นสำคัญของ ${noteTitle}</li>
  <li>แนวทางการนำเนื้อหาดังกล่าวไปประยุกต์ใช้ในสถานการณ์จริงมีอะไรบ้าง?</li>
</ol>`;
        case 'beautify':
        default:
            return `<h2>✨ ${noteTitle}</h2>
<p>${points[0]}</p>
<blockquote>💡 <strong>ใจความสำคัญ:</strong> ${points.slice(0, 2).join(' ')}</blockquote>
<h3>📌 ประเด็นสำคัญที่บันทึกไว้</h3>
<ul>
  ${points.map((p) => `<li>${p}</li>`).join('')}
</ul>`;
    }
}
// Function to call Google Gemini Free Tier if API key is provided
async function callGeminiApi(prompt, apiKey, maxTokens = 1500) {
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
                    maxOutputTokens: maxTokens,
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
    }
    catch (error) {
        console.error('Gemini API fetch error:', error);
        return null;
    }
}
class AiController {
    // AI Summarize Note
    static async summarize(req, res) {
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
                    }
                    catch (e) {
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
        }
        catch (error) {
            console.error('AI summarize error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสรุปเนื้อหา' });
        }
    }
    // AI Rewrite Note
    static async rewrite(req, res) {
        try {
            const { content, style } = req.body;
            const apiKey = process.env.GEMINI_API_KEY || '';
            const plainContent = stripHtml(content || '');
            if (!plainContent) {
                return res.status(400).json({ error: 'ไม่พบเนื้อหาสำหรับการเรียบเรียง' });
            }
            if (apiKey) {
                const styleDescriptions = {
                    professional: 'ปรับสำนวนให้เป็นทางการ สุภาพ ถูกต้องตามหลักภาษา เหมาะสำหรับใช้ในงานราชการหรือติดต่อธุรกิจ',
                    shorten: 'ย่อข้อความให้กระชับ ได้ใจความสำคัญ ชัดเจน รวบรัด',
                    expand: 'ขยายความเพิ่มเติม อธิบายรายละเอียดให้เห็นภาพชัดเจนและครบถ้วนยิ่งขึ้น',
                    bullets: 'แปลงข้อความเป็นรายการหัวข้อย่อย (Bullet points) ที่อ่านง่าย',
                    friendly: 'ปรับน้ำเสียงให้อบอุ่น เป็นกันเอง เข้าใจง่าย และสนุกสนาน',
                    action_items: 'ดึงและเปลี่ยนเนื้อหาให้ออกมาเป็นรายการเช็คลิสต์สิ่งที่ต้องทำ (To-Do Checklist)',
                    casual: 'ปรับสำนวนให้เป็นภาษาพูดสบายๆ เป็นมิตร เข้าถึงง่าย สนุกสนาน',
                    executive: 'ปรับสำนวนให้เป็นระดับผู้บริหาร ตรงประเด็น มุ่งเน้นผลลัพธ์และการตัดสินใจ ไม่เยิ่นเย้อ',
                    academic: 'ปรับเป็นสำนวนเชิงวิชาการ ใช้คำศัพท์ทางการ มีการจัดวางเหตุผลและตรรกะที่น่าเชื่อถือ',
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
        }
        catch (error) {
            console.error('AI rewrite error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเรียบเรียง' });
        }
    }
    // AI Format Note into rich templates
    static async format(req, res) {
        try {
            const { content, title, template } = req.body; // template: 'beautify' | 'meeting' | 'project_plan' | 'cornell' | 'pros_cons' | 'faq' | 'reflection' | 'executive_summary' | 'study_guide'
            const apiKey = process.env.GEMINI_API_KEY || '';
            const plainContent = stripHtml(content || '');
            if (!plainContent) {
                return res.status(400).json({ error: 'ไม่พบเนื้อหาสำหรับการจัดรูปแบบ' });
            }
            const templateInstructions = {
                beautify: {
                    name: 'จัดระเบียบและเพิ่มความสวยงาม (Clean & Beautify)',
                    desc: 'จัดโครงสร้างเอกสารให้อ่านง่าย สบายตา โดยจัดหัวข้อ <h2>, <h3>, แบ่งย่อหน้า <p>, เน้นคำสำคัญด้วย <strong>, ใส่ <blockquote> สำหรับใจความสำคัญ และจัดรายการด้วย <ul><li>',
                },
                meeting: {
                    name: 'บันทึกการประชุม (Meeting Minutes / MOM)',
                    desc: 'จัดรูปแบบเป็นบันทึกการประชุม ประกอบด้วย: วันที่/ผู้เข้าร่วม, วัตถุประสงค์, ประเด็นหารือ <h3>, มติที่ประชุม <blockquote>, และรายการสิ่งที่ต้องทำต่อ (Action Items) ในรูปแบบ <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>...</p></li></ul>',
                },
                project_plan: {
                    name: 'แผนงานโครงการ (Project Plan / Roadmap)',
                    desc: 'จัดรูปแบบเป็นแผนโครงการ ประกอบด้วย: ภาพรวมโครงการ, เป้าหมายหลัก (Objectives), ขั้นตอนการดำเนินงานแต่ละระยะ (Phases) ด้วย <ol><li>, และการบริหารความเสี่ยง <blockquote>',
                },
                cornell: {
                    name: 'ระบบจดบันทึกแบบคอร์เนลล์ (Cornell Notes)',
                    desc: 'จัดรูปแบบสไตล์ Cornell Notes โดยสร้างตาราง <table><thead><tr><th>คำสำคัญ/คำถามนำ (Cues)</th><th>บันทึกเนื้อหา (Notes)</th></tr></thead><tbody>...</tbody></table> และมีบทสรุปภาพรวม <blockquote> สรุปท้ายบท',
                },
                pros_cons: {
                    name: 'วิเคราะห์ข้อดี - ข้อเสีย (Pros & Cons Analysis)',
                    desc: 'จัดรูปแบบเป็นการวิเคราะห์เปรียบเทียบ โดยใช้ตาราง <table> หรือหัวข้อย่อยเปรียบเทียบ ข้อดี/จุดเด่น (Pros) และ ข้อจำกัด/จุดที่ต้องระวัง (Cons) พร้อมสรุปข้อเสนอแนะเชิงกลยุทธ์',
                },
                faq: {
                    name: 'คำถามที่พบบ่อย (FAQ / Q&A)',
                    desc: 'แปลงเนื้อหาออกมาเป็นรูปแบบ ถาม-ตอบ (Q&A) โดยใช้ <h3> สำหรับคำถาม และ <p> หรือ <ul> สำหรับคำตอบที่ชัดเจน กระชับ',
                },
                reflection: {
                    name: 'บันทึกทบทวนและถอดบทเรียน (Daily Reflection / Retrospective)',
                    desc: 'จัดรูปแบบเป็นการถอดบทเรียน: สิ่งที่ทำได้ดี (Wins), ปัญหา/อุปสรรคที่พบ, บทเรียนที่ได้รับ (Key Learnings), และแนวทางปรับปรุงในครั้งต่อไป',
                },
                executive_summary: {
                    name: 'สรุปรายงานสำหรับผู้บริหาร (Executive Summary)',
                    desc: 'จัดรูปแบบเป็นรายงานสรุปย่อระดับผู้บริหาร: ไฮไลต์สาระสำคัญระดับกลยุทธ์ <blockquote>, สรุปประเด็นหลัก <ul><li>, และมติหรือข้อตัดสินใจที่ต้องการ',
                },
                study_guide: {
                    name: 'คู่มือสรุปบทเรียนและอ่านสอบ (Study Guide)',
                    desc: 'จัดรูปแบบเป็นคู่มือทบทวนความรู้: นิยามศัพท์สำคัญ, ประเด็นหลักที่ต้องจำ, จุดที่มักเข้าใจผิดหรือออกสอบบ่อย, และคำถามทบทวนความจำ',
                },
            };
            const selected = templateInstructions[template] || templateInstructions.beautify;
            if (apiKey) {
                const prompt = `คุณคือผู้เชี่ยวชาญด้านการจัดรูปแบบเอกสารและบันทึก (Note Architect) 
โจทย์: จัดโครงสร้างและรูปแบบเนื้อหาบันทึกต่อไปนี้ให้อยู่ในเทมเพลต: "${selected.name}"
คำแนะนำเฉพาะ: ${selected.desc}

หัวข้อบันทึก: ${title || 'ไม่มีชื่อหัวข้อ'}
เนื้อหาต้นฉบับ:
"${plainContent}"

กฎเหล็กในการตอบกลับ:
1. ตอบกลับเป็นโค้ด HTML เท่านั้น ห้ามใส่คำทักทายหรือคำปิดท้ายเด็ดขาด
2. ห้ามครอบด้วย Markdown code fences (ห้ามมี \`\`\`html หรือ \`\`\`) ให้ส่งแท็ก HTML เริ่มต้นตรงๆ
3. ใช้แท็ก HTML มาตรฐาน เช่น <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>, <table>, <thead>, <tbody>, <tr>, <th>, <td>
4. หากมีรายการสิ่งที่ต้องทำ ให้ใช้: <ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>...</p></li></ul>
5. ตรวจสอบให้แน่ใจว่าได้รักษาข้อมูล ข้อเท็จจริง และสาระสำคัญจากเนื้อหาต้นฉบับไว้อย่างครบถ้วน และเพิ่มความเป็นมืออาชีพ น่าอ่านสูงสุด`;
                const geminiResult = await callGeminiApi(prompt, apiKey, 2048);
                if (geminiResult) {
                    const cleanedHtml = cleanHtmlOutput(geminiResult);
                    return res.json({
                        engine: 'gemini-free',
                        formattedHtml: cleanedHtml,
                        template: template || 'beautify',
                    });
                }
            }
            // Local Fallback
            const localHtml = localFormat(plainContent, title, template);
            return res.json({
                engine: 'local-smart-nlp',
                formattedHtml: localHtml,
                template: template || 'beautify',
            });
        }
        catch (error) {
            console.error('AI format error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการจัดรูปแบบโน้ต' });
        }
    }
    // AI Smart Semantic Search across Notes
    static async search(req, res) {
        try {
            const userId = req.userId;
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ error: 'กรุณากรอกคำค้นหา' });
            }
            const q = query.trim().toLowerCase();
            const keywords = q.split(/\s+/).filter((k) => k.length > 0);
            // Fetch all non-archived notes of user
            const userNotes = await database_1.prisma.note.findMany({
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
                if (titleLower.includes(q))
                    score += 50;
                if (contentClean.includes(q))
                    score += 30;
                if (notebookName.includes(q))
                    score += 20;
                if (labelNames.includes(q))
                    score += 20;
                // Individual keyword matches
                for (const kw of keywords) {
                    if (titleLower.includes(kw))
                        score += 15;
                    if (contentClean.includes(kw))
                        score += 8;
                    if (notebookName.includes(kw))
                        score += 5;
                    if (labelNames.includes(kw))
                        score += 5;
                }
                // Pinned & Favorite bonus
                if (note.isPinned)
                    score += 3;
                if (note.isFavorite)
                    score += 2;
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
        }
        catch (error) {
            console.error('AI search error:', error);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหา' });
        }
    }
}
exports.AiController = AiController;
