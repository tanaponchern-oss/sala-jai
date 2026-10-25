# ศาลาใจ (Sala Jai)

A public website where anyone, with no account, can talk through what is troubling them with "เพื่อนธรรม", an AI companion that answers with compassion using Buddhist psychology. It is run by พระมหาธนพล กุสลฏฺฐายี of วัดสุทัศนเทพวราราม, who also takes calls for one-to-one counselling.

The owner writes in Thai. All user-facing text is Thai, plain and gentle, in the voice of a กัลยาณมิตร.

## Layout

- `app/page.tsx`: the whole UI (home, chat, monk contact, breathing practice). Client component.
- `app/api/chat/route.ts`: streams replies from the Claude API. Validates input, applies the rate limit, adds the safety note when a message looks at risk.
- `lib/prompt.ts`: the system prompt that defines how เพื่อนธรรม speaks.
- `lib/safety.ts`: self-harm keywords, shared by client and server.
- `lib/site.ts`: monk name, temple, phone, crisis hotlines.
- `lib/rateLimit.ts`: in-memory per-IP limit (30 requests per 10 minutes).

## Rules that must hold

- No accounts, and no conversation is stored or logged on the server. Log only error kinds, never message text.
- When a message looks at risk, the hotlines (1323, 1669, Samaritans 02-113-6789) show before any AI reply, and the AI puts safety first.
- เพื่อนธรรม never claims to be a monk or a person, never diagnoses or suggests medication, and never uses กรรม to blame the person.
- The API key lives only in the host's environment (`ANTHROPIC_API_KEY`), never in code or chat.

## Commands

- `npm run dev`: local server (needs `.env.local` with `ANTHROPIC_API_KEY`)
- `npm run typecheck`, `npm run build`: what CI runs

## Deploy

Vercel: import the repo, set `ANTHROPIC_API_KEY` (and optionally `CLAUDE_MODEL`, default `claude-opus-5-5`), deploy. Set a monthly spend limit in console.anthropic.com.

## Not built yet

Online booking and private chat with the monk existed in the claude.ai prototype (https://claude.ai/artifact/QW2vXqX2GpYWTerug1Uzgg) but need a database and a monk login here. For now visitors contact the monk by phone.
