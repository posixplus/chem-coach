# Chem Coach

Practice, quizzing and tutoring for Sachin's IB MYP Chemistry (Mr. Knapik's class). Next.js 16 on Vercel, Supabase Postgres, Claude for tutoring and question generation, built-in macOS voices for read-aloud and voice answers.

## What it does

- **Passcode login.** Student and parent passcodes (env vars `STUDENT_PASSCODE`, `PARENT_PASSCODE`). Signed cookie, 30 days, 5 bad tries locks an IP for a minute.
- **Study page.** "Study tonight" pulls the next quiz/test from Mr. Knapik's agenda spreadsheet; topic cards show mastery; Quick 10 mixes topics weighted toward weak spots.
- **Quiz engine.** Multiple choice, numeric (with sig-fig checking and tolerance), short answer (graded by Claude), flashcards. Two tries per question. First miss: Claude names the likely slip and asks one guiding question (no answer given). Second miss: full worked explanation in the teacher's style, then a fresh variant of that problem is generated and scheduled for review in 10 minutes and again over the following week (Leitner boxes).
- **Ask the tutor.** Free-form question about the current problem, answered from the teacher's notes and textbook excerpts.
- **Audio.** Read-aloud toggle uses the browser's speech synthesis (macOS voices such as Samantha in Safari/Chrome). "Speak answer" uses browser speech recognition (Chrome and Safari), with "three point five times ten to the negative four" normalized to `3.5e-4`.
- **Parent dashboard** (`/parent`). Time on task per day (heartbeats count only while the tab is visible and he interacted in the last 2 minutes), sessions, accuracy by topic, recent misses with the tutor's explanation, tutor conversations, upcoming agenda. All times in America/New_York.
- **Question bank** (`/parent/bank`). Review, enable/disable, and generate more questions per topic with Claude (grounded in the notes).
- **Weekly email digest.** Vercel cron hits `/api/cron/digest` Sunday 7 pm Eastern (23:00 UTC; adjust `vercel.json` when DST ends) and emails via Resend if `RESEND_API_KEY` and `DIGEST_EMAIL_TO` are set.

## One-time setup

1. **Supabase.** Tables already exist in the `ap-precalc-coach` project (prefixed `chem_`). Copy the **service role** key from Supabase → Project Settings → API keys.
2. **Env.** `cp .env.example .env.local` and fill in `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `AUTH_SECRET` (`openssl rand -hex 32`), optionally Resend + `CRON_SECRET` (`openssl rand -hex 16`).
3. **Install and seed.**
   ```bash
   npm install
   npm run ingest      # topics, question bank, notes chunks, textbook excerpts, agenda
   npm run dev         # http://localhost:3000
   ```
4. **Deploy.** Push to GitHub, import the repo in Vercel, add the same env vars (plus `APP_URL=https://<your-app>.vercel.app`). Vercel picks up `vercel.json` for the cron.

## Adding new material as the course goes on

Drop files in `content/` and re-run `npm run ingest` (idempotent):

- `content/notes/*.docx|*.pdf|*.md` — teacher notes, labs, practice sheets. Chunked and auto-tagged to topics by keyword (see `keywords` in `content/topics.json`).
- `content/agenda/*.xlsx` — Mr. Knapik's weekly agenda in his layout. Only periods listed in `MYP_PERIODS` (default `2nd,6th,8th`) are read.
- `content/questions/*.json` — hand-written question bank (see `unit1.json` for the schema). Re-ingesting updates existing prompts in place.
- `content/topics.json` — add topics for new units first, then notes and questions that reference them.
- `content/textbook/*.txt` — textbook excerpts (Zumdahl chapters 1 and 2 are included). Extract more with `pdftotext -f <first> -l <last> book.pdf out.txt`.

Questions Claude generates (parent "Generate" button, and automatic variants of missed questions) are stored in the database with `source = generated | variant`, so they survive re-ingests.

## Notes

- The 20-element list defaults to elements 1 to 20. Edit `content/questions/elements.json` if Mr. Knapik hands out a different list.
- Questions that need a picture (ruler readings, graduated cylinders, block density diagrams) are not in v1.
- `CLAUDE_MODEL` defaults to `claude-sonnet-4-5`; change it in env when a newer model is preferred.
- Cost: a 30-minute session is typically 5 to 20 cents of API usage (explanations and short-answer grading only; bank questions are free to serve).
- `npm test` runs the grading unit tests.
