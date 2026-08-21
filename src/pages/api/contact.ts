import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  if (!body?.email || !body?.message) {
    return json({ error: 'Champs requis manquants' }, 400);
  }

  const apiKey = (env as any)?.RESEND_API_KEY as string | undefined;
  const toEmail = ((env as any)?.CONTACT_TO_EMAIL as string) || 'romain.pinsard@gmail.com';

  if (!apiKey) {
    return json({ error: 'Config manquante' }, 500);
  }

  const text = `Nouveau message depuis opsynapse.org

De: ${body.name || 'N/A'} <${body.email}>
Entreprise: ${body.company || 'N/A'}
Sujet: ${body.subject || 'Demande'}
Provenance: ${body.tool || 'Contact'}

${body.message}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [toEmail],
        reply_to: body.email,
        subject: `[Opsynapse] ${body.subject || 'Message'}${body.tool ? ' - ' + body.tool : ''}`,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: 'Resend: ' + err }, 500);
    }

    return json({ success: true }, 200);
  } catch (e: any) {
    return json({ error: 'Fetch: ' + e.message }, 500);
  }
};

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
