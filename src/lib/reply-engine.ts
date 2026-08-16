export type Channel = 'email' | 'sms' | 'whatsapp';

export interface ReplyInput {
  channel: Channel;
  message: string;
  context?: string;
  mode?: ReplyMode;
  memory?: ReplyMemory;
}

export interface ReplyResult {
  kind: 'reply' | 'question';
  reply: string;
}

export interface ReplyMemory {
  preferredTone?: ReplyMode;
  preferredChannel?: Channel;
  preferredStyle?: 'casual' | 'balanced' | 'direct' | 'pro';
  learnedExamples?: Array<{
    input: string;
    output: string;
  }>;
}

type Relation = 'pro' | 'family' | 'casual';
type Theme = 'health' | 'work' | 'family' | 'food' | 'home' | 'neutral';
type ReplyMode = 'written' | 'oral';
type Intent =
  | 'checkin'
  | 'greeting'
  | 'request'
  | 'choice'
  | 'availability'
  | 'thanks'
  | 'apology'
  | 'followup'
  | 'budget'
  | 'boundary'
  | 'ack'
  | 'fallback';

interface Analysis {
  intent: Intent;
  relation: Relation;
  theme: Theme;
  isSmallTalk: boolean;
}

const healthWords = ['maladie', 'malade', 'sante', 'santé', 'hopital', 'hôpital', 'recup', 'récup', 'conval', 'fièvre', 'fievre', 'soin', 'medical', 'médical'];
const familyWords = ['tante', 'maman', 'papa', 'famille', 'amis', 'pote', 'copain', 'soeur', 'sœur', 'frere', 'frère', 'cousin', 'cousine'];
const workWords = ['client', 'cliente', 'collègue', 'collegue', 'pro', 'devis', 'facture', 'réunion', 'reunion', 'rdv', 'rendez vous', 'mail', 'projet', 'bureau'];
const foodWords = ['frites', 'pizza', 'burger', 'repas', 'manger', 'commande', 'restaurant', 'sandwich', 'sushi', 'course', 'courses', 'diner', 'déjeuner', 'dejeuner', 'cuisine'];
const homeWords = ['maison', 'retour du travail', 'travail', 'rentre', 'reviens', 'chez toi', 'ce soir', 'logistique', 'ramene', 'ramène'];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9?\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text: string, parts: string[]) {
  return parts.some((part) => text.includes(part));
}

function detectRelation(message: string, context: string): Relation {
  const text = normalize(`${message} ${context}`);
  if (includesAny(text, familyWords)) return 'family';
  if (includesAny(text, workWords)) return 'pro';
  return 'casual';
}

function detectTheme(message: string, context: string): Theme {
  const text = normalize(`${message} ${context}`);
  if (includesAny(text, healthWords)) return 'health';
  if (includesAny(text, foodWords)) return 'food';
  if (includesAny(text, homeWords)) return 'home';
  if (includesAny(text, familyWords)) return 'family';
  if (includesAny(text, workWords)) return 'work';
  return 'neutral';
}

function detectIntent(message: string): Intent {
  const raw = normalize(message);
  const core = raw.replace(/\s*\?\s*$/, '').trim();

  if (!raw) return 'fallback';
  if (['ca va', 'comment ca va', 'tu vas bien', 'ca roule', 'comment vas tu'].includes(core)) return 'checkin';
  if (['salut', 'bonjour', 'hello', 'hey'].includes(core)) return 'greeting';
  if (includesAny(raw, ['confirme', 'confirmer', 'ok', 'd accord', 'daccord', 'valide', 'c est bon', 'cest bon', 'c est note', 'cest note', 'noté', 'note'])) return 'ack';
  if (includesAny(raw, ['ça te dit', 'ca te dit', 'on mange quoi', 'qu est ce qu on mange', 'qu est ce qu’on mange', 'manger quoi'])) return 'choice';
  if ((includesAny(raw, [' ou ', ' ou?']) || raw.includes(' ou ')) && raw.includes('?')) return 'choice';
  if (includesAny(raw, ['dispo', 'disponible', 'disponibilite', 'disponibilites', 'quelle heure', 'quel heure', 'on se voit', 'on se parle', 'on se fait', 't es libre', 'tu es libre'])) return 'availability';
  if (includesAny(raw, ['peux tu', 'peux-tu', 'pourrais tu', 'pourrais-tu', 'est ce que tu peux', 'est-ce que tu peux', 'tu peux', 'vous pouvez', 'serait il possible', 'serait-il possible'])) return 'request';
  if (includesAny(raw, ['merci', 'thanks']) && raw.length < 90) return 'thanks';
  if (includesAny(raw, ['desole', 'désolé', 'pardon', 'je m excuse', 'je mexcuse', 'je m’excuse', 'en retard'])) return 'apology';
  if (includesAny(raw, ['relance', 'suivi', 'reviens vers toi', 'je me permets', 'vu mon message', 'tu as vu mon message', 'message'])) return 'followup';
  if (includesAny(raw, ['budget', 'tarif', 'prix', 'devis', 'fourchette'])) return 'budget';
  if (includesAny(raw, ['annuler', 'refuser', 'pas possible', 'impossible', 'ne pourrai pas', 'je ne pourrai pas', 'je ne peux pas', 'je peux pas'])) return 'boundary';
  return 'fallback';
}

function analyze(message: string, context: string): Analysis {
  const relation = detectRelation(message, context);
  const theme = detectTheme(message, context);
  const intent = detectIntent(message);
  const text = normalize(`${message} ${context}`);
  const isSmallTalk = includesAny(text, ['ca va', 'bonjour', 'salut', 'hello', 'hey', 'merci', 'ok', 'd accord', 'daccord']);

  return { intent, relation, theme, isSmallTalk };
}

function contextPreference(message: string, context: string) {
  const text = normalize(`${message} ${context}`);
  const prefersDelivery = includesAny(text, ['travail', 'boulot', 'fatigue', 'fatigu', 'tard', 'deux heures', '2 heures', 'en route', 'j arrive', 'rentre', 'rentrer', 'maison', 'flemme', 'pas envie', 'simple']);
  const prefersRestaurant = includesAny(text, ['sortir', 'dehors', 'resto', 'restaurant', 'inviter', 'date', 'anniversaire', 'fêter', 'feter', 'célébr', 'celebr']);
  if (prefersDelivery && !prefersRestaurant) return 'delivery';
  if (prefersRestaurant && !prefersDelivery) return 'restaurant';
  return 'neutral';
}

function timingHint(message: string, context: string) {
  const text = normalize(`${message} ${context}`);
  if (includesAny(text, ['ce soir'])) return 'ce soir';
  if (includesAny(text, ['demain'])) return 'demain';
  if (includesAny(text, ['cette semaine', 'semaine'])) return 'cette semaine';
  return null;
}

function choiceOptions(message: string) {
  const raw = normalize(message);
  const question = raw.replace(/\?+$/g, '');
  const parts = question.split(/\s+ou\s+/);
  if (parts.length < 2) return null;
  const left = parts[0].split(',').pop()?.trim();
  const right = parts.slice(1).join(' ou ').split(',')[0]?.trim();
  if (!left || !right) return null;
  return { left, right };
}

function isGenericReply(reply: string) {
  const text = normalize(reply);
  return includesAny(text, [
    'merci pour votre message',
    'merci pour ton message',
    'bien reçu',
    'pas de souci',
    'avec plaisir',
    'je vous fais un retour rapide',
    'je te fais un retour rapide',
  ]);
}

function needsClarification(message: string, context: string, intent: Intent) {
  const contextText = normalize(context);
  const messageText = normalize(message);
  if (contextText) return false;
  if (intent === 'request') return true;
  if (intent === 'fallback' && messageText.length < 10) return true;
  return false;
}

function proEmail(prefix: string, body: string) {
  return `${prefix}, ${body}`.replace(/\s+/g, ' ').trim();
}

function casualEmail(prefix: string, body: string) {
  return `${prefix}, ${body}`.replace(/\s+/g, ' ').trim();
}

function casualShort(body: string) {
  return body.replace(/\s+/g, ' ').trim();
}

function formatReply(reply: string, mode: ReplyMode, channel: Channel, relation: Relation) {
  if (mode === 'written') {
    return reply.replace(/\s+/g, ' ').replace(/\s+\./g, '.').trim();
  }

  let text = reply
    .replace(/je vous fais un retour rapide dès que possible\.?/i, 'je vous redis vite')
    .replace(/je te fais un retour rapide dès que possible\.?/i, 'je te redis vite')
    .replace(/merci pour votre message\.?/i, 'merci')
    .replace(/merci pour ton message\.?/i, 'merci')
    .replace(/c’est bien noté, merci\.?/i, 'bien noté')
    .replace(/bien reçu\.?/i, 'bien reçu')
    .replace(/je me permets de revenir vers vous au sujet de mon précédent message\.?/i, 'je reviens vers vous')
    .replace(/je me permets de relancer\.?/i, 'je relance')
    .replace(/plutôt livraison ce soir, ça m’arrange\.?/i, 'plutôt livraison, ça m’arrange')
    .replace(/plutôt un resto ce soir, j’ai envie de sortir un peu\.?/i, 'plutôt un resto, j’ai envie de sortir un peu')
    .replace(/ça m’est égal, mais la livraison est plus simple ce soir\.?/i, 'la livraison est plus simple ce soir')
    .replace(/ça marche, je t’en prends\.?/i, 'ça marche, je t’en prends');

  if (channel !== 'email' || relation !== 'pro') {
    text = text.replace(/^Bonjour,\s*/i, '').replace(/^Salut,\s*/i, '');
  }

  return text.replace(/\s+/g, ' ').replace(/\s+\./g, '.').replace(/\.+$/g, '').trim();
}

function applyMemoryStyle(reply: string, memory?: ReplyMemory) {
  if (!memory?.preferredStyle) return reply;

  if (memory.preferredStyle === 'direct') {
    return reply
      .replace(/merci pour votre message, ?/i, '')
      .replace(/merci pour ton message, ?/i, '')
      .replace(/je vous fais un retour rapide dès que possible\.?/i, 'je reviens vite')
      .replace(/je te fais un retour rapide dès que possible\.?/i, 'je reviens vite')
      .replace(/je me permets de /i, '')
      .trim();
  }

  if (memory.preferredStyle === 'pro') {
    return reply
      .replace(/^Salut,\s*/i, 'Bonjour, ')
      .replace(/^oui, /i, 'Oui, ')
      .replace(/^ça va /i, 'Ça va ')
      .trim();
  }

  if (memory.preferredStyle === 'casual') {
    return reply
      .replace(/^Bonjour,\s*/i, '')
      .replace(/Je vous /g, 'Je te ')
      .replace(/Vous /g, 'Tu ')
      .trim();
  }

  return reply;
}

function capitalizeReply(reply: string) {
  return reply.replace(/(^\s*["'«(\[]?)([a-zà-ÿ])/, (match, prefix, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function buildLocalReply(input: ReplyInput): ReplyResult {
  const message = input.message.trim();
  const context = (input.context ?? '').trim();
  const { relation, theme, intent } = analyze(message, context);
  const preference = contextPreference(message, context);

  const dailyText = normalize(`${message} ${context}`);
  const msgNoApost = normalize(message).replace(/['’]/g, ' ');

  if (/^je t ?aime\b/i.test(msgNoApost)) {
    return { kind: 'reply', reply: casualShort('Je t’aime aussi.') };
  }

  if (/^tu me manques\b/i.test(msgNoApost)) {
    return { kind: 'reply', reply: casualShort('Toi aussi tu me manques.') };
  }

  if (/^(bonne nuit)\b/i.test(msgNoApost) && msgNoApost.length <= 40) {
    return { kind: 'reply', reply: input.channel === 'email' ? casualEmail('Bonjour', 'bonne nuit, à demain.') : casualShort('Bonne nuit, gros bisous.') };
  }

  if (/^(gros )?bisous\b|^bises\b|^biz\b/i.test(msgNoApost) && msgNoApost.length <= 40) {
    return { kind: 'reply', reply: casualShort('Gros bisous.') };
  }

  if (includesAny(normalize(message), ['en retard'])) {
    return { kind: 'reply', reply: input.channel === 'email' ? casualEmail('Bonjour', 'pas de souci, prenez votre temps.') : casualShort('Pas de souci, prends ton temps.') };
  }

  if (includesAny(normalize(message), ['appelle-moi', 'appelle moi', 'm appelle', 'm appeler', 'mappeler', 'appelle nous', 'telephone-moi', 'téléphone-moi'])) {
    return { kind: 'reply', reply: casualShort('Oui, je t’appelle dans 5 minutes.') };
  }

  if (includesAny(normalize(message), ['appeler'])) {
    return { kind: 'reply', reply: casualShort('Oui, je m’en occupe.') };
  }

  if (includesAny(dailyText, ['tu es ou', 'tu es où', 't es ou', 't es où', 'ou es-tu', 'où es-tu'])) {
    return { kind: 'reply', reply: casualShort('Je suis sur le chemin, j’arrive bientôt.') };
  }

  if (includesAny(normalize(message), ['tu rentres', 'tu rentre', 'rentres']) && /([aà] quelle heure|quand)\b/.test(dailyText)) {
    return { kind: 'reply', reply: casualShort('Je pense être là vers 19h, je t’envoie un mot si ça bouge.') };
  }

  if (includesAny(normalize(message), ['prends le pain', 'prends du pain', 'prends le lait', 'prends du lait', 'prends de l eau'])) {
    return { kind: 'reply', reply: casualShort('Oui, je le prends en rentrant.') };
  }

  if (includesAny(normalize(message), ['tu fais quoi', 'tu fait quoi', 'qu est ce que tu fais', 'tu bosses sur quoi'])) {
    return { kind: 'reply', reply: casualShort('Pas grand-chose, j’avance sur des trucs. Et toi ?') };
  }

  if (needsClarification(message, context, intent)) {
    return {
      kind: 'question',
      reply:
        relation === 'pro' && input.channel === 'email'
          ? 'Bonjour, vous pouvez me préciser le sujet exact ?'
          : 'Tu peux me préciser ce que tu veux dire ?',
    };
  }

  const emailPro = relation === 'pro' && input.channel === 'email';
  const greeting = input.channel === 'email' ? 'Bonjour' : '';

  if (theme === 'health' && (intent === 'checkin' || intent === 'greeting' || intent === 'fallback')) {
    return {
      kind: 'reply',
      reply: intent === 'checkin'
        ? (input.channel === 'email'
          ? proEmail(greeting, 'ça va mieux merci. Je récupère encore un peu. Et vous ?')
          : casualShort('Oui, ça va mieux merci. Je récupère encore un peu. Et toi ?'))
        : (input.channel === 'email'
          ? proEmail(greeting, 'merci de prendre des nouvelles. Ça va mieux, je récupère encore un peu.')
          : casualShort('Merci de prendre des nouvelles. Ça va mieux, je récupère encore un peu.')),
    };
  }

  if (theme === 'family' && (intent === 'checkin' || intent === 'greeting' || intent === 'fallback')) {
    return {
      kind: 'reply',
      reply: input.channel === 'email'
        ? casualEmail(greeting, 'merci de prendre des nouvelles. Ça va mieux, je récupère encore un peu.')
        : casualShort('Merci de prendre des nouvelles, ça va mieux. Je récupère encore un peu.'),
    };
  }

  if ((theme === 'food' || theme === 'home') && (intent === 'fallback' || intent === 'request' || intent === 'ack')) {
    const text = normalize(`${message} ${context}`);

    if (includesAny(text, ['coupe', 'cuit', 'cuire', 'prepare', 'prépare', 'fais-moi', 'fais moi', 'fais les', 'fais des'])) {
      return {
        kind: 'question',
        reply: input.channel === 'email'
          ? casualEmail('Bonjour', 'tu les veux pour quand et en quelle quantité ?')
          : casualShort('Tu les veux pour quand et en quelle quantité ?'),
      };
    }

    if (includesAny(normalize(message), ['course', 'courses', 'faire les courses'])) {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail(greeting, 'ça marche, je prends les courses.')
          : casualShort('Ça marche, je prends les courses.'),
      };
    }

    if (includesAny(normalize(message), ['on prend quoi', 'on mange quoi', 'manger quoi', 'à manger', 'a manger'])) {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail(greeting, 'on peut partir sur un truc simple.')
          : casualShort('On peut partir sur un truc simple.'),
      };
    }

    if (theme === 'home') {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail(greeting, 'ça marche.')
          : casualShort('Ça marche.'),
      };
    }

    return {
      kind: 'reply',
      reply: input.channel === 'email'
        ? casualEmail(greeting, 'ça marche, je t’en prends.')
        : casualShort('Ça marche, je t’en prends.'),
    };
  }

  if (intent === 'choice') {
    if (includesAny(normalize(message), ['oui ou non', 'non ou oui'])) {
      return {
        kind: 'question',
        reply: input.channel === 'email'
          ? proEmail('Bonjour', 'tu peux me préciser ce que tu veux dire ?')
          : 'Tu peux me préciser ce que tu veux dire ?',
      };
    }

    if (includesAny(normalize(message), ['ça te dit', 'ca te dit', 'ça te dirait', 'ca te dirait'])) {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail('Bonjour', 'oui, avec plaisir.')
          : casualShort('Oui, avec plaisir.'),
      };
    }

    if (includesAny(normalize(message), ['on mange quoi', 'qu est ce qu on mange', 'qu est ce qu’on mange', 'manger quoi'])) {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail('Bonjour', 'on peut partir sur un truc simple.')
          : casualShort('On peut partir sur un truc simple.'),
      };
    }

    if (includesAny(normalize(message), ['resto', 'restaurant', 'livraison'])) {
      const contextText = normalize(context);
      const workContext = includesAny(contextText, ['boulot', 'travail', 'fatigue', 'fatig', 'rentre', 'retour du travail', 'au boulot']);
      const homeContext = includesAny(contextText, ['maison', 'chez toi', 'chez nous']);

      if (preference === 'delivery' || workContext) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail('Bonjour', 'plutôt livraison ce soir, ça m’arrange.')
            : casualShort('Plutôt livraison ce soir, ça m’arrange.'),
        };
      }

      if (preference === 'restaurant' || (homeContext && !workContext)) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail('Bonjour', 'plutôt un resto ce soir, j’ai envie de sortir un peu.')
            : casualShort('Plutôt un resto ce soir, j’ai envie de sortir un peu.'),
        };
      }

      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail('Bonjour', 'ça m’est égal, mais la livraison est plus simple ce soir.')
          : casualShort('Ça m’est égal, mais la livraison est plus simple ce soir.'),
      };
    }

    const options = choiceOptions(message);
    if (options) {
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? casualEmail('Bonjour', `plutôt ${options.left}.`)
          : casualShort(`Plutôt ${options.left}.`),
      };
    }

    return {
      kind: 'reply',
      reply: input.channel === 'email'
        ? casualEmail('Bonjour', 'je dirais que le plus simple, c’est ça.')
        : casualShort('Je dirais que le plus simple, c’est ça.'),
    };
  }

  switch (intent) {
    case 'checkin':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'oui ça va merci. Et vous ?')
          : casualShort('Oui ça va, et toi ?'),
      };
    case 'greeting':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'bien reçu.')
          : casualShort('Salut !'),
      };
    case 'availability':
      {
        const hint = timingHint(message, context);
        const text = normalize(`${message} ${context}`);
        const reply = includesAny(text, ['quelle heure', 'quel heure', 'à quelle heure', 'heure']) && !context
          ? (input.channel === 'email'
            ? proEmail(greeting, 'vous avez une heure en tête ?')
            : casualShort('Tu as une heure en tête ?'))
          : includesAny(text, ['point', 'caler un point'])
            ? (input.channel === 'email'
              ? proEmail(greeting, 'oui, on peut caler un point. Je suis dispo.')
              : casualShort('Oui, on peut caler un point. Je suis dispo.'))
            : hint === 'demain'
              ? (input.channel === 'email'
                ? proEmail(greeting, 'oui, demain je suis dispo. Quel créneau vous arrange ?')
                : casualShort('Oui, demain je suis dispo. Tu veux quel créneau ?'))
              : hint === 'ce soir'
                ? (input.channel === 'email'
                  ? proEmail(greeting, 'oui, ce soir je suis dispo. Quel créneau vous arrange ?')
                  : casualShort('Oui, ce soir je suis dispo. Tu veux quelle heure ?'))
                : (input.channel === 'email'
                  ? proEmail(greeting, 'oui, je suis dispo. Dites-moi quel créneau vous arrange.')
                  : casualShort('Oui, je suis dispo. Tu préfères quel créneau ?'));

        return {
          kind: 'reply',
          reply,
        };
      }
    case 'request':
      if (includesAny(normalize(`${message} ${context}`), ['point', 'point rapide', 'caler un point'])) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? proEmail(greeting, 'oui, on peut caler un point. Je suis dispo.')
            : casualShort('Oui, on peut caler un point. Je suis dispo.'),
        };
      }

      if (includesAny(normalize(`${message} ${context}`), ['cafe', 'café', 'ça te dit', 'ca te dit', 'tu veux un cafe', 'tu veux un café'])) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail(greeting, 'oui, avec plaisir.')
            : casualShort('Oui, avec plaisir.'),
        };
      }

      if (includesAny(normalize(`${message} ${context}`), ['course', 'courses', 'faire les courses'])) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail(greeting, 'ça marche, je prends les courses.')
            : casualShort('Ça marche, je prends les courses.'),
        };
      }

      if (includesAny(normalize(`${message} ${context}`), ['on mange quoi', 'qu est ce qu on mange', 'qu est ce qu’on mange', 'manger quoi'])) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail(greeting, 'on peut partir sur un truc simple.')
            : casualShort('On peut partir sur un truc simple.'),
        };
      }

      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'bien sûr. Je regarde ça et je reviens vers vous.')
          : casualShort('Oui, bien sûr. Je regarde ça et je te redis.'),
      };
    case 'thanks':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'avec plaisir.')
          : casualShort('Avec plaisir.'),
      };
    case 'apology':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'pas de souci.')
          : casualShort('Pas de souci.'),
      };
    case 'followup':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'je me permets de revenir vers vous au sujet de mon précédent message.')
          : casualShort('Je me permets de relancer.'),
      };
    case 'budget':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'oui. Vous avez une fourchette de budget en tête ?')
          : casualShort('Oui, tu as une fourchette de budget en tête ?'),
      };
    case 'boundary':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'merci pour votre message. Je ne pourrai pas donner suite à cette demande.')
          : casualShort('Je ne pourrai pas donner suite à cette demande.'),
      };
    case 'ack':
      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'c’est bien noté, merci.')
          : casualShort('C’est bien noté, merci.'),
      };
    case 'fallback':
    default: {
      if (theme === 'work') {
        if (includesAny(normalize(message), ['point', 'point rapide', 'caler un point'])) {
          return {
            kind: 'reply',
            reply: input.channel === 'email'
              ? proEmail(greeting, 'oui, on peut caler un point. Dites-moi quand ça vous arrange.')
              : casualShort('Oui, on peut caler un point. Tu préfères quand ?'),
          };
        }

        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? proEmail(greeting, 'bien reçu. Je reviens vers vous rapidement.')
            : casualShort('Bien reçu, je te reviens vite.'),
        };
      }

      if (theme === 'family') {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? casualEmail(greeting, 'merci pour ton message. Je te réponds vite.')
            : casualShort('Merci pour ton message. Je te réponds vite.'),
        };
      }

      if (includesAny(normalize(message), ['ok', 'd accord', 'daccord', 'c est note', 'cest note', 'c est noté', 'cest noté'])) {
        return {
          kind: 'reply',
          reply: input.channel === 'email'
            ? proEmail(greeting, 'c’est bien noté, merci.')
            : casualShort('C’est bien noté, merci.'),
        };
      }

      return {
        kind: 'reply',
        reply: input.channel === 'email'
          ? proEmail(greeting, 'merci pour votre message. Je vous fais un retour rapide dès que possible.')
          : casualShort('Merci pour ton message. Je te fais un retour rapide dès que possible.'),
      };
    }
  }
}

function shouldUseAI(input: ReplyInput, analysis: Analysis, local: ReplyResult) {
  if (!process.env.OPENAI_API_KEY) return false;
  if ((process.env.REPLY_AI_MODE ?? 'hybrid') === 'off') return false;
  if (local.kind === 'question') return false;

  const messageLength = input.message.trim().length;
  const contextLength = (input.context ?? '').trim().length;

  if (messageLength < 8) return false;
  if (analysis.intent === 'fallback' && contextLength > 0) return true;
  if (analysis.intent === 'fallback' && analysis.theme === 'neutral' && messageLength > 20) return true;
  if (analysis.intent === 'greeting' && contextLength > 24 && isGenericReply(local.reply)) return true;
  if (analysis.intent === 'checkin' && contextLength > 24 && isGenericReply(local.reply)) return true;
  return false;
}

async function buildOpenAIReply(input: ReplyInput, analysis: Analysis): Promise<ReplyResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const compactInput = {
    channel: input.channel,
    mode: input.mode ?? 'written',
    analysis,
    message: input.message.trim().slice(0, 160),
    context: (input.context ?? '').trim().slice(0, 160),
    memory: input.memory
      ? {
        preferredTone: input.memory.preferredTone,
        preferredStyle: input.memory.preferredStyle,
        preferredChannel: input.memory.preferredChannel,
        learnedExamples: (input.memory.learnedExamples ?? []).slice(-3).map((entry) => ({
          input: entry.input.slice(0, 80),
          output: entry.output.slice(0, 80),
        })),
      }
      : undefined,
  };
  const prompt = [
    'Tu es Assistant réponse.',
    'Écris une seule réponse naturelle, humaine, courte, adaptée au canal.',
    'Le mode est written ou oral. En oral, sois plus parlé et un peu plus court.',
    'Si une mémoire utilisateur existe, respecte ses préférences de ton et de style.',
    'Le contexte doit enrichir la réponse, pas la rendre plus formelle.',
    'Si le contexte manque vraiment, pose une question courte. Sinon réponds directement.',
    'Réponds en JSON strict: {"kind":"reply"|"question","reply":"..."}',
    'Exemples:',
    '- {"channel":"sms","analysis":{"intent":"checkin","relation":"casual","theme":"health","isSmallTalk":true},"message":"Ca va ?","context":"Tante qui me demande après ma maladie"} => {"kind":"reply","reply":"Oui, ça va mieux merci. Je récupère encore un peu. Et toi ?"}',
    '- {"channel":"sms","analysis":{"intent":"choice","relation":"casual","theme":"food","isSmallTalk":false},"message":"on se fait un resto ce soir, ou livraison ?","context":"Romain au boulot"} => {"kind":"reply","reply":"Plutôt livraison ce soir, ça m’arrange."}',
    '- {"channel":"sms","analysis":{"intent":"fallback","relation":"casual","theme":"neutral","isSmallTalk":false},"message":"Tu peux me répondre ?","context":""} => {"kind":"question","reply":"Tu peux me préciser ce que tu attends exactement ?"}',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_completion_tokens: 64,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: JSON.stringify(compactInput),
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ReplyResult;
    if ((parsed.kind === 'reply' || parsed.kind === 'question') && typeof parsed.reply === 'string' && parsed.reply.trim()) {
      return { kind: parsed.kind, reply: parsed.reply.trim() };
    }
  } catch {
    return null;
  }

  return null;
}

export async function generateReply(input: ReplyInput): Promise<ReplyResult> {
  const analysis = analyze(input.message, input.context ?? '');
  const localReply = buildLocalReply(input);
  const mode = input.mode ?? input.memory?.preferredTone ?? 'written';

  if (shouldUseAI(input, analysis, localReply)) {
    const aiReply = await buildOpenAIReply(input, analysis);
    if (aiReply) {
      return {
        ...aiReply,
        reply: capitalizeReply(applyMemoryStyle(formatReply(aiReply.reply, mode, input.channel, analysis.relation), input.memory)),
      };
    }
  }

  return {
    ...localReply,
    reply: capitalizeReply(applyMemoryStyle(formatReply(localReply.reply, mode, input.channel, analysis.relation), input.memory)),
  };
}
