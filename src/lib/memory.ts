export interface ReplyMemory {
  preferredTone?: 'written' | 'oral';
  preferredChannel?: 'email' | 'sms' | 'whatsapp';
  preferredStyle?: 'casual' | 'balanced' | 'direct' | 'pro';
  learnedExamples?: Array<{
    input: string;
    output: string;
  }>;
}

// Store en mémoire de session (compatible déploiement sans disque persisté,
// type Cloudflare Pages). La persistance disque n'est pas garantie dans ce contexte.
const store: ReplyMemory = {
  preferredTone: 'written',
  preferredStyle: 'balanced',
  learnedExamples: [],
};

function inferStyle(output: string): ReplyMemory['preferredStyle'] {
  const text = output.toLowerCase();
  const hasBonjour = text.includes('bonjour');
  const hasTu = text.includes(' tu ') || text.includes(' toi ') || text.includes('t\'en') || text.includes('t’en');
  const hasVous = text.includes(' vous ') || text.includes('vous');

  if (text.length < 40 && !hasBonjour && !hasVous) return 'direct';
  if (hasBonjour && hasVous) return 'pro';
  if (hasTu) return 'casual';
  return 'balanced';
}

export async function loadMemory(): Promise<ReplyMemory> {
  return {
    ...store,
    learnedExamples: store.learnedExamples ?? [],
  };
}

export async function saveMemory(memory: ReplyMemory): Promise<void> {
  store.preferredTone = memory.preferredTone ?? store.preferredTone;
  store.preferredChannel = memory.preferredChannel ?? store.preferredChannel;
  store.preferredStyle = memory.preferredStyle ?? store.preferredStyle;
  store.learnedExamples = memory.learnedExamples ?? store.learnedExamples ?? [];
}

export async function recordExample(input: string, output: string): Promise<void> {
  const memory = await loadMemory();

  let parsedInput: { mode?: 'written' | 'oral'; channel?: 'email' | 'sms' | 'whatsapp' } | null = null;

  try {
    parsedInput = JSON.parse(input) as { mode?: 'written' | 'oral'; channel?: 'email' | 'sms' | 'whatsapp' };
  } catch {
    parsedInput = null;
  }

  const next: ReplyMemory = {
    ...memory,
    preferredTone: parsedInput?.mode ?? memory.preferredTone,
    preferredChannel: parsedInput?.channel ?? memory.preferredChannel,
    preferredStyle: inferStyle(output),
    learnedExamples: [...(memory.learnedExamples ?? []), { input, output }].slice(-50),
  };

  await saveMemory(next);
}

export async function updateMemory(patch: Partial<ReplyMemory>): Promise<ReplyMemory> {
  const memory = await loadMemory();
  const next: ReplyMemory = {
    ...memory,
    ...patch,
    learnedExamples: patch.learnedExamples ?? (memory.learnedExamples ?? []),
  };

  await saveMemory(next);
  return next;
}

export async function getMemory(): Promise<ReplyMemory> {
  return loadMemory();
}