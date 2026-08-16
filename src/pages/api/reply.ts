import type { APIRoute } from 'astro';
import { getMemory } from '../../lib/memory';
import { generateReply } from '../../lib/reply-engine';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null) as {
    channel?: 'email' | 'sms' | 'whatsapp';
    message?: string;
    context?: string;
    mode?: 'written' | 'oral';
  } | null;

  if (!body || !body.channel || !body.message) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const memory = await getMemory();

  const result = await generateReply({
    channel: body.channel,
    message: body.message,
    context: body.context ?? '',
    mode: body.mode ?? memory.preferredTone ?? 'written',
    memory,
  });
  const enrichedResult = {
    ...result,
    memory,
  };

  return new Response(JSON.stringify(enrichedResult), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
