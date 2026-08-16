import type { APIRoute } from 'astro';
import { getMemory, updateMemory } from '../../lib/memory';

export const prerender = false;

export const GET: APIRoute = async () => {
  const memory = await getMemory();
  return new Response(JSON.stringify(memory), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null) as {
    preferredTone?: 'written' | 'oral';
    preferredChannel?: 'email' | 'sms' | 'whatsapp';
    preferredStyle?: 'casual' | 'balanced' | 'direct' | 'pro';
  } | null;

  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const memory = await updateMemory({
    preferredTone: body.preferredTone,
    preferredChannel: body.preferredChannel,
    preferredStyle: body.preferredStyle,
  });

  return new Response(JSON.stringify(memory), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
