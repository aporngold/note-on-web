"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class EmailService {
    static transporter = null;
    static getTransporter() {
        dotenv_1.default.config(); // Reload env variables if updated
        if (this.transporter) {
            return this.transporter;
        }
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (host && user && pass) {
            this.transporter = nodemailer_1.default.createTransport({
                host,
                port,
                secure: port === 465,
                auth: {
                    user,
                    pass,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
        }
        else {
            // In development mode without SMTP credentials, create a stream/json or fallback transporter
            this.transporter = nodemailer_1.default.createTransport({
                jsonTransport: true,
            });
        }
        return this.transporter;
    }
    /**
     * ส่งอีเมลรีเซ็ตรหัสผ่าน พร้อมข้อความและลิงก์ความปลอดภัย
     */
    static async sendPasswordResetEmail({ to, username, resetUrl, }) {
        dotenv_1.default.config();
        const fromAddress = process.env.EMAIL_FROM || '"NoteAll Security" <no-reply@noteonweb.com>';
        const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รีเซ็ตรหัสผ่าน NoteAll</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 30px 15px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" style="max-width: 520px; background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0284c7); padding: 12px 24px; border-radius: 14px; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                NoteAll
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 15px;">
              <h2 style="margin: 0; color: #f8fafc; font-size: 22px; font-weight: 700; text-align: center;">
                คำขอตั้งรหัสผ่านใหม่
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 20px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              สวัสดีคุณ <strong>${username}</strong>,<br><br>
              ระบบ NoteAll ได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ กรุณากดที่ปุ่มด้านล่างเพื่อดำเนินการตั้งรหัสผ่านใหม่:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0284c7); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4);">
                ตั้งรหัสผ่านใหม่
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 20px; color: #94a3b8; font-size: 13px; line-height: 1.5; border-top: 1px solid #334155; padding-top: 20px;">
              <strong style="color: #f1f5f9;">หมายเหตุความปลอดภัย:</strong>
              <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>ลิงก์นี้มีอายุการใช้งาน <strong>15 นาที</strong> และใช้ได้เพียงครั้งเดียว</li>
                <li>หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถละเว้นอีเมลนี้ได้อย่างปลอดภัย รหัสผ่านของคุณจะไม่ถูกเปลี่ยนแปลง</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 15px; color: #64748b; font-size: 12px; word-break: break-all;">
              หากปุ่มด้านบนใช้งานไม่ได้ ให้คัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br>
              <a href="${resetUrl}" style="color: #38bdf8; text-decoration: underline;">${resetUrl}</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="color: #475569; font-size: 11px; padding-top: 15px;">
              © 2026 NoteAll (SecureNote). All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
        // 1. Priority 1: Resend HTTPS API (Port 443 - Bypasses Render SMTP Blocking)
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && resendApiKey.trim().length > 0) {
            try {
                const fromEmail = process.env.RESEND_FROM || 'NoteAll Security <onboarding@resend.dev>';
                const resendRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${resendApiKey.trim()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: fromEmail,
                        to: [to],
                        subject: '[NoteAll] คำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ',
                        html: htmlContent,
                        text: `สวัสดีคุณ ${username},\n\nระบบ NoteAll ได้รับคำขอตั้งรหัสผ่านใหม่ กรุณากดลิงก์ต่อไปนี้เพื่อดำเนินการ (มีอายุ 15 นาที):\n${resetUrl}\n\nหากคุณไม่ได้เป็นผู้ขอ สามารถละเว้นข้อความนี้ได้อย่างปลอดภัย`,
                    }),
                });
                const resData = await resendRes.json();
                if (resendRes.ok) {
                    const detail = `Sent successfully via Resend HTTPS API (id: ${resData.id})`;
                    console.log(`✅ [EmailService] ${detail}`);
                    return { success: true, details: detail };
                }
                else {
                    console.warn('⚠️ [EmailService] Resend API error:', resData);
                    // If Resend returns error, capture it and try SMTP fallback
                    const resendErrorMsg = resData?.message || resData?.name || 'Resend API failed';
                    // If no SMTP configured, return the Resend error directly
                    if (!isConfigured) {
                        return { success: false, details: `Resend Error: ${resendErrorMsg}` };
                    }
                }
            }
            catch (resendErr) {
                console.error('⚠️ [EmailService] Resend network error:', resendErr);
                if (!isConfigured) {
                    return { success: false, details: `Resend Network Error: ${resendErr.message}` };
                }
            }
        }
        // 2. Priority 2: Brevo HTTPS API (Port 443 - No domain verification required)
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (brevoApiKey && brevoApiKey.trim().length > 0) {
            try {
                const brevoSenderEmail = process.env.BREVO_SENDER || process.env.SMTP_USER || 'aporngold@gmail.com';
                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': brevoApiKey.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        sender: {
                            name: 'NoteAll Security',
                            email: brevoSenderEmail,
                        },
                        to: [{ email: to, name: username }],
                        subject: '[NoteAll] คำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ',
                        htmlContent: htmlContent,
                    }),
                });
                const brevoData = await brevoRes.json();
                if (brevoRes.ok) {
                    const detail = `Sent successfully via Brevo HTTPS API (id: ${brevoData.messageId})`;
                    console.log(`✅ [EmailService] ${detail}`);
                    return { success: true, details: detail };
                }
                else {
                    console.warn('⚠️ [EmailService] Brevo API error:', brevoData);
                    if (!isConfigured) {
                        return { success: false, details: `Brevo Error: ${brevoData.message || JSON.stringify(brevoData)}` };
                    }
                }
            }
            catch (brevoErr) {
                console.error('⚠️ [EmailService] Brevo network error:', brevoErr);
                if (!isConfigured) {
                    return { success: false, details: `Brevo Network Error: ${brevoErr.message}` };
                }
            }
        }
        // 3. Priority 3: Standard SMTP (Nodemailer)
        try {
            const transporter = this.getTransporter();
            const mailOptions = {
                from: fromAddress,
                to,
                subject: '[NoteAll] คำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ',
                text: `สวัสดีคุณ ${username},\n\nระบบ NoteAll ได้รับคำขอตั้งรหัสผ่านใหม่ กรุณากดลิงก์ต่อไปนี้เพื่อดำเนินการ (มีอายุ 15 นาที):\n${resetUrl}\n\nหากคุณไม่ได้เป็นผู้ขอ สามารถละเว้นข้อความนี้ได้อย่างปลอดภัย`,
                html: htmlContent,
            };
            if (!isConfigured) {
                const missing = [
                    !process.env.SMTP_HOST && 'SMTP_HOST',
                    !process.env.SMTP_USER && 'SMTP_USER',
                    !process.env.SMTP_PASS && 'SMTP_PASS',
                ].filter(Boolean).join(', ');
                const devDetail = `Development Mode: Missing ${missing}. Simulated reset URL.`;
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`📧 [EmailService: ${devDetail}]`);
                console.log(`To: ${to}`);
                console.log(`Username: ${username}`);
                console.log(`Reset URL: ${resetUrl}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                return { success: false, details: devDetail };
            }
            const sendResult = await transporter.sendMail(mailOptions);
            const successDetail = `Sent successfully via SMTP: ${sendResult.response || sendResult.messageId}`;
            console.log(`✅ [EmailService] ${successDetail}`);
            return { success: true, details: successDetail };
        }
        catch (err) {
            const errMessage = err?.message || String(err);
            console.error('EmailService error:', err);
            return { success: false, details: `SMTP Error: ${errMessage}` };
        }
    }
}
exports.EmailService = EmailService;
