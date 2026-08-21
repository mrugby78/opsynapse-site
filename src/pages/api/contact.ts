import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { request, locals } = ctx;
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

  let RESEND_API_KEY: string | undefined;
  let TO_EMAIL = 'romain.pinsard@gmail.com';
  let FROM_EMAIL = 'onboarding@resend.dev';

  try {
    const runtime = (locals as any).runtime;
    if (runtime?.env) {
      RESEND_API_KEY = runtime.env.RESEND_API_KEY;
      TO_EMAIL = runtime.env.CONTACT_TO_EMAIL || TO_EMAIL;
      FROM_EMAIL = runtime.env.CONTACT_FROM_EMAIL || FROM_EMAIL;
    }
  } catch (e) {
    console.error('Runtime access error:', e);
  }

  if (typeof process !== 'undefined' && process.env) {
    RESEND_API_KEY = RESEND_API_KEY || process.env.RESEND_API_KEY;
    TO_EMAIL = process.env.CONTACT_TO_EMAIL || TO_EMAIL;
    FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || FROM_EMAIL;
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY manquant');
    return new Response(JSON.stringify({ error: 'Service email non configuré' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emailContent = `
Nouveau message depuis opsynapse.org
-----------------------------------

De : ${body.name || 'Non précisé'} <${body.email}>
Entreprise : ${body.company || 'Non précisée'}
Sujet : ${body.subject || 'Demande depuis le site'}
Provenance : ${body.tool || 'Page contact'}

Message :
${body.message}
  `.trim();

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
        subject: `[Opsynapse] ${body.subject || 'Nouveau message'} ${body.tool ? '· ' + body.tool : ''}`,
        text: emailContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Erreur envoi email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Contact form error:', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
