import process from 'node:process';

const baseUrl = process.env.REPLY_BASE_URL || 'http://localhost:4321';

const scenarios = [
  { name: 'checkin-health-sms', channel: 'sms', message: 'Ca va ?', context: 'Tante qui me demande après ma maladie', kind: 'reply', includes: ['va mieux', 'récupère'] },
  { name: 'checkin-health-email', channel: 'email', message: 'Bonjour', context: 'Tante qui me demande après ma maladie', kind: 'reply', includes: ['prendre des nouvelles', 'va mieux'] },
  { name: 'checkin-casual', channel: 'sms', message: 'Tu vas bien ?', context: '', kind: 'reply', includes: ['ça va', 'toi'] },
  { name: 'greeting-casual', channel: 'whatsapp', message: 'Salut', context: '', kind: 'reply', includes: ['salut'] },
  { name: 'thanks-short', channel: 'sms', message: 'Merci !', context: '', kind: 'reply', includes: ['plaisir'] },
  { name: 'apology-short', channel: 'sms', message: 'Désolé pour le retard', context: '', kind: 'reply', includes: ['pas de souci'] },
  { name: 'followup-pro', channel: 'email', message: 'Je me permets de relancer', context: 'client pro', kind: 'reply', includes: ['reve|revi'] },
  { name: 'budget-pro', channel: 'email', message: 'C est quoi ton budget ?', context: 'client', kind: 'reply', includes: ['budget'] },
  { name: 'boundary-casual', channel: 'sms', message: 'Je ne pourrai pas venir', context: '', kind: 'reply', includes: ['donner suite'] },
  { name: 'availability-email', channel: 'email', message: 'Tu es dispo demain ?', context: 'rdv pro', kind: 'reply', includes: ['dispo', 'demain'] },
  { name: 'availability-sms', channel: 'sms', message: 'On se voit à quelle heure ?', context: '', kind: 'reply', includes: ['heure'] },
  { name: 'request-doc', channel: 'email', message: 'Tu peux m envoyer le doc ?', context: 'client', kind: 'reply', includes: ['regarde'] },
  { name: 'request-call', channel: 'sms', message: 'Tu peux m appeler ?', context: '', kind: 'reply', includes: ['appelle'] },
  { name: 'request-confirm', channel: 'email', message: 'Peux-tu confirmer ?', context: 'projet', kind: 'reply', includes: ['bien noté'] },
  { name: 'choice-resto-work', channel: 'sms', message: 'on se fait un resto ce soir, ou livraison ?', context: 'Romain au boulot', kind: 'reply', includes: ['livraison'] },
  { name: 'choice-resto-home', channel: 'sms', message: 'on se fait un resto ce soir, ou livraison ?', context: 'on est à la maison', kind: 'reply', includes: ['resto'] },
  { name: 'choice-food', channel: 'sms', message: 'pizza ou sushi ?', context: 'on a faim', kind: 'reply', includes: ['pizza'] },
  { name: 'choice-coffee', channel: 'whatsapp', message: 'café ou thé ?', context: '', kind: 'reply', includes: ['cafe'] },
  { name: 'choice-movie', channel: 'sms', message: 'film ou série ?', context: 'soir tranquille', kind: 'reply', includes: ['film'] },
  { name: 'home-ok', channel: 'whatsapp', message: 'Ok', context: 'On se voit ce soir à la maison', kind: 'reply', includes: ['ça marche'] },
  { name: 'home-logistics', channel: 'sms', message: 'Tu rentres ?', context: 'retour du travail', kind: 'reply', includes: ['ça marche'] },
  { name: 'health-rebound', channel: 'sms', message: 'Bonjour', context: 'Tante qui me demande après ma maladie', kind: 'reply', includes: ['prendre des nouvelles', 'va mieux'] },
  { name: 'family-health', channel: 'sms', message: 'Salut', context: 'famille et maladie', kind: 'reply', includes: ['va mieux'] },
  { name: 'work-dispo', channel: 'email', message: 'Tu peux caler un point ?', context: 'collègue', kind: 'reply', includes: ['point'] },
  { name: 'work-follow', channel: 'email', message: 'Tu as vu mon message ?', context: 'pro', kind: 'reply', includes: ['reve|revi'] },
  { name: 'work-thanks', channel: 'email', message: 'Merci beaucoup', context: 'client', kind: 'reply', includes: ['plaisir'] },
  { name: 'work-ack', channel: 'email', message: 'C est noté', context: 'projet', kind: 'reply', includes: ['bien noté'] },
  { name: 'work-boundary', channel: 'email', message: 'Je ne peux pas', context: 'client', kind: 'reply', includes: ['donner suite'] },
  { name: 'social-invite', channel: 'sms', message: 'Ça te dit un café ?', context: 'après le boulot', kind: 'reply', includes: ['avec plaisir'] },
  { name: 'social-hello', channel: 'sms', message: 'Hello', context: '', kind: 'reply', includes: ['salut'] },
  { name: 'social-hi-pro', channel: 'email', message: 'Bonjour', context: 'client pro', kind: 'reply', includes: ['bonjour'] },
  { name: 'time-arrange', channel: 'sms', message: 'On se parle ce soir ?', context: '', kind: 'reply', includes: ['ce soir'] },
  { name: 'time-delay', channel: 'sms', message: 'Je suis en retard', context: '', kind: 'reply', includes: ['pas de souci'] },
  { name: 'food-order', channel: 'sms', message: 'Tu peux prendre les courses ?', context: 'je rentre', kind: 'reply', includes: ['courses'] },
  { name: 'food-lunch', channel: 'sms', message: 'on mange quoi ?', context: 'faim', kind: 'reply', includes: ['simple'] },
  { name: 'short-yes', channel: 'sms', message: 'Oui', context: '', kind: 'question', includes: ['préciser'] },
  { name: 'short-no', channel: 'sms', message: 'Non', context: '', kind: 'question', includes: ['préciser'] },
  { name: 'clarify-plain', channel: 'sms', message: 'Tu peux me répondre ?', context: '', kind: 'question', includes: ['préciser'] },
  { name: 'clarify-missing', channel: 'email', message: 'Peux-tu', context: '', kind: 'question', includes: ['préciser'] },
  { name: 'choice-family', channel: 'sms', message: 'On prend quoi à manger ?', context: 'famille', kind: 'reply', includes: ['simple'] },
  { name: 'choice-romain', channel: 'sms', message: 'resto ou livraison ?', context: 'Romain fatigué', kind: 'reply', includes: ['livraison'] },
  { name: 'request-fast', channel: 'whatsapp', message: 'Tu peux me dire oui ou non ?', context: '', kind: 'question', includes: ['préciser'] },
  { name: 'budget-small', channel: 'sms', message: 'Tu as quel budget ?', context: 'projet', kind: 'reply', includes: ['budget'] },
  { name: 'apology-late', channel: 'whatsapp', message: 'Pardon, j ai oublié', context: '', kind: 'reply', includes: ['pas de souci'] },
  { name: 'followup-check', channel: 'sms', message: 'Je reviens vers toi', context: '', kind: 'reply', includes: ['relance'] },
  { name: 'thanks-super', channel: 'whatsapp', message: 'Merci beaucoup', context: '', kind: 'reply', includes: ['plaisir'] },
  { name: 'health-more', channel: 'whatsapp', message: 'ca va ?', context: 'je sors de maladie', kind: 'reply', includes: ['va mieux'] },
  { name: 'family-more', channel: 'sms', message: 'Bonjour', context: 'ma tante', kind: 'reply', includes: ['merci de prendre des nouvelles', 'va mieux'] },
  { name: 'work-more', channel: 'email', message: 'Tu peux me renvoyer le doc ?', context: 'collègue pro', kind: 'reply', includes: ['regarde'] },
  { name: 'choice-more', channel: 'sms', message: 'resto ou livraison ?', context: 'soirée calme', kind: 'reply', includes: ['resto'] },
  { name: 'tiny-ok', channel: 'sms', message: 'Ok', context: '', kind: 'reply', includes: ['bien noté'] },
];

function assertCase(result, test) {
  const failures = [];
  if (result.kind !== test.kind) failures.push(`kind=${result.kind} attendu=${test.kind}`);
  for (const needle of test.includes) {
    const options = needle.split('|').map((part) => part.trim().toLowerCase()).filter(Boolean);
    const matched = options.some((option) => result.reply.toLowerCase().includes(option));
    if (!matched) {
      failures.push(`manque "${needle}"`);
    }
  }
  return failures;
}

async function run() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const scenario of scenarios) {
    for (const mode of ['written', 'oral']) {
      const response = await fetch(`${baseUrl}/api/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: scenario.channel,
          message: scenario.message,
          context: scenario.context,
          mode,
        }),
      });

      const json = await response.json();
      const label = `${scenario.name} [${mode}]`;
      const issues = assertCase(json, scenario);

      if (issues.length === 0) {
        passed += 1;
      } else {
        failed += 1;
        failures.push({ label, reply: json.reply, issues });
      }
    }
  }

  console.log(`passed=${passed} failed=${failed}`);
  if (failures.length) {
    console.log(JSON.stringify(failures.slice(0, 20), null, 2));
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
