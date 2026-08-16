# Assistant réponse

Assistant mobile pour écrire des réponses courtes et naturelles à partir d'un message et d'un contexte.

## Démarrage local

```sh
npm install
npm run dev
```

## Déploiement VPS

```sh
cp .env.example .env
docker compose up -d --build
```

Le service écoute sur `http://localhost:4321`.

## Variables

- `OPENAI_API_KEY` active le mode IA hybride.
- `OPENAI_MODEL` permet de changer de modèle.
- `REPLY_AI_MODE=hybrid` garde les règles locales pour les cas simples.
- `REPLY_AI_MODE=off` force le mode local uniquement.

## API

- `POST /api/reply`

Payload:

```json
{
  "channel": "sms",
  "message": "Ca va ?",
  "context": "Tante qui me demande après ma maladie"
}
```

Réponse:

```json
{ "kind": "reply", "reply": "Oui, ça va mieux merci. Je récupère encore un peu. Et toi ?" }
```
