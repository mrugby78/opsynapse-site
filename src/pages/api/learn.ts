import type { APIRoute } from 'astro';
import { recordExample } from '../../lib/memory';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null) as {
    input?: string;
    output?: string;
  } | null;

  if (!body?.input || !body?.output) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  await recordExample(body.input, body.output);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
