import { env } from 'cloudflare:workers';

export type Channel = 'email' | 'chat' | 'sms';

export interface ReplyInput {
  channel: Channel;
  message: string;
  context?: string;
  mode?: 'written' | 'oral';
}

export interface ReplyResult {
  kind: 'reply';
  reply: string;
}

function buildPrompt(input: ReplyInput): string {
  const toneMap: Record<string, string> = {
    empathique: 'Empathique : reconnaissez la frustration du client, montrez que vous comprenez, puis proposez une solution claire.',
    professionnel: 'Professionnel : factuel, direct, précis. Pas de blabla, aller à l\'essentiel.',
    chaleureux: 'Chaleureux : proche, humain, comme un ami qui aide. Mais reste professionnel.',
    ferme: 'Ferme : refus ou polémique. Restez factuel, citez les règles, proposez une alternative si possible.',
  };

  const tone = toneMap[input.context || 'empathique'] || toneMap.empathique;

  const channelRules: Record<string, string> = {
    email: 'Format email : salutation, corps du message, formule de politesse. 3 à 6 phrases maximum.',
    chat: 'Format chat : direct, sans salutation longue. 2 à 4 phrases. Pas de formule de politesse finale.',
    sms: 'Format SMS : très court, 1 à 2 phrases. Pas de salutation.',
  };

  return `Tu es un expert en Customer Success avec 15 ans d'expérience en service client. Tu génères des réponses client professionnelles, prêtes à envoyer.

RÈGLES :
- Ton : ${tone}
- Canal : ${channelRules[input.channel] || channelRules.email}
- Jamais de promesses sur des délais que tu ne peux pas vérifier. Utilise "sous 24-48h" ou "dans les meilleurs délais".
- Ne jamais inventer de remboursement, de compensation ou de solution spécifique. Reste sur "je vérifie" ou "je transmets".
- Toujours reconnaître le problème avant de proposer une action.
- Terminer par une next step claire ou une question ouverte.
- Langue : français.
- Pas de jargon interne. Le client ne connait pas tes outils ni tes process internes.

Réponds uniquement avec le texte de la réponse, sans guillemets, sans JSON, sans préfixe.`;
}

export async function generateReply(input: ReplyInput): Promise<ReplyResult> {
  const apiKey = (env as any)?.OPENAI_API_KEY as string | undefined;

  if (!apiKey) {
    return {
      kind: 'reply',
      reply: 'Configuration manquante. Cet outil nécessite une clé API pour fonctionner. Contactez l\'administrateur.',
    };
  }

  const prompt = buildPrompt(input);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_completion_tokens: 300,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Message du client :\n\n${input.message}` },
        ],
      }),
    });

    if (!res.ok) {
      return { kind: 'reply', reply: 'Erreur de génération. Réessayez dans un instant.' };
    }

    const data = await res.json() as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      return { kind: 'reply', reply: 'Génération impossible. Reformulez le message du client.' };
    }

    return { kind: 'reply', reply: content.trim() };
  } catch (e) {
    return { kind: 'reply', reply: 'Erreur de connexion. Réessayez.' };
  }
}
