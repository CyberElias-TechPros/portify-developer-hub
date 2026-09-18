/**
 * Transactional email. Uses Resend when configured; otherwise logs so
 * development flows (verification, password reset) still work end-to-end.
 */
import type { Env } from '../env';

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail(env: Env, input: MailInput): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(`[mailer:dry-run] to=${input.to} subject="${input.subject}"`);
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM || 'Portify <hello@portify.dev>',
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
      }),
    });
    if (!response.ok) {
      console.warn('[mailer] provider rejected message', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[mailer] failed', error);
    return false;
  }
}

export function contactNotification(env: Env, message: { name: string; email: string; subject: string; message: string }) {
  return `<div style="font-family:Inter,system-ui,sans-serif;background:#0b0b12;color:#eee;padding:28px;border-radius:16px">
    <p style="color:#8b8ba7;margin:0 0 4px">New portfolio enquiry</p>
    <h2 style="margin:0 0 12px">${escape(message.subject)}</h2>
    <p><strong>${escape(message.name)}</strong> &lt;${escape(message.email)}&gt;</p>
    <p style="white-space:pre-wrap;line-height:1.6">${escape(message.message)}</p>
    <hr style="border-color:#26263a" />
    <p style="color:#6f6f8a;font-size:12px">Sent from the Portify contact form${env.APP_URL ? ` on ${env.APP_URL}` : ''}.</p>
  </div>`;
}

function escape(value: string) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
