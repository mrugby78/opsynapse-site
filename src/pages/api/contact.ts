import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request } = ctx;
  const body = await request.json().catch(() => null) as {
    name?: string;
    email?: string;
    company?: string;
    subject?: string;
    message?: string;
    tool?: string;
  } | null;

  if (!body || !body.email || !body.message) {
    return new Response(JSON.stringify({ error: 'Champs requis manquants' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || (ctx.locals as any)?.runtime?.env?.RESEND_API_KEY;
  const TO_EMAIL = import.meta.env.CONTACT_TO_EMAIL || (ctx.locals as any)?.runtime?.env?.CONTACT_TO_EMAIL || 'romain.pinsard@gmail.com';
  const FROM_EMAIL = import.meta.env.CONTACT_FROM_EMAIL || (ctx.locals as any)?.runtime?.env?.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({
      error: 'Service email non configuré. Ajoutez RESEND_API_KEY dans Cloudflare.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emailContent = `Nouveau message depuis opsynapse.org

De : ${body.name || 'Non précisé'} <${body.email}>
Entreprise : ${body.company || 'Non précisée'}
Sujet : ${body.subject || 'Demande depuis le site'}
Provenance : ${body.tool || 'Page contact'}

Message :
${body.message}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: body.email,
        subject: `[Opsynapse] ${body.subject || 'Nouveau message'}${body.tool ? ' · ' + body.tool : ''}`,
        text: emailContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'Erreur envoi', detail: err }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Erreur serveur', detail: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
