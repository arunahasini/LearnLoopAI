# LearnLoop AI

An AI-powered adaptive education website built with Next.js App Router,
TypeScript, Tailwind CSS, Lucide icons, Recharts, and Supabase Authentication.

The adaptive Data Structures assessment uses authored sample questions and
server-side grading. Optional AI-assisted practice, concept explanations, and
revision plans use the OpenAI SDK on the server. Uploaded PDFs/TXT files are
extracted on the server; only upload metadata is stored. With Supabase
configured, quiz attempts, mastery summaries, and revision tasks persist in
PostgreSQL. Without Supabase credentials, the app is clearly labeled as an
unauthenticated local demo and saves progress in browser storage.

## Run locally

Requirements: Node.js 22 or later and npm (the installed OpenAI SDK requires
Node.js 22+).

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Correct auth callback URLs | Public origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Auth and PostgreSQL | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase client | Publishable/anon key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Persisting server-graded quiz attempts | Server only; bypasses RLS |
| `OPENAI_API_KEY` | AI summaries, explanations, plans, and generated quizzes | Server only |
| `OPENAI_MODEL` | Optional override of the default `gpt-4o-mini` | Server only |
| `LEARNING_ASSESSMENT_SECRET` | Encrypting user-bound generated quiz answer keys | Server only; at least 32 characters |

Copy `.env.example` to `.env.local` for development. Do not commit `.env.local`
or put server-only values in `NEXT_PUBLIC_*`.

## Configure Supabase Authentication

1. Create a Supabase project and copy its **Project URL** and **publishable
   (anon) key** into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
   ```

2. In Supabase **Authentication → URL Configuration**, set the local Site URL
   to `http://localhost:3000` and allow both callback URLs used by the app:
   `http://localhost:3000/auth/callback?next=%2Fdashboard` and
   `http://localhost:3000/auth/callback?next=%2Freset-password`. Add the
   equivalent HTTPS URLs for your production site before deploying.
3. In **Authentication → Providers → Email**, enable email/password sign-in
   and configure email confirmation as desired. Password reset and signup
   confirmation links return through `/auth/callback`.
4. Apply the SQL migration in
   `supabase/migrations/202610220001_auth_profiles.sql` using the Supabase CLI
   or SQL editor. It creates `profiles`, inserts a profile for each new auth
   user, and restricts profile access with row-level security.
5. Apply `supabase/migrations/202610220002_learning_persistence.sql`. It seeds
   the Data Structures course and topics, creates user-owned attempts, mastery,
   revision task, and upload metadata tables, and enables RLS policies.
6. Keep `SUPABASE_SERVICE_ROLE_KEY` only in server environment configuration.
   It is used only by the server grading persistence helper; never prefix it
   with `NEXT_PUBLIC_`, return it to the browser, or commit it.
7. For production, set `NEXT_PUBLIC_SITE_URL` to the HTTPS origin of the
   deployed app. Configure a trusted email/SMTP provider in Supabase for
   reliable verification and password-reset delivery.

Only the Supabase URL and publishable/anon key are used in browser-safe
configuration. Never add the Supabase `service_role` key or any AI provider
secret to `NEXT_PUBLIC_*` variables or commit secrets. Environment files are
excluded by `.gitignore`.

If Supabase URL and anon key are absent, the landing page offers a clearly
labeled local demo. This is not an authenticated session and accepts no
credentials; progress remains in this browser only. When Supabase is
configured, protected learning pages require a valid session. Google OAuth is
not enabled.

## Configure AI learning tools (optional)

The authenticated AI routes use the official OpenAI TypeScript SDK and JSON
mode, then validate every model response with Zod before returning it. Add the
following values to `.env.local` on the server only:

```dotenv
OPENAI_API_KEY=your-server-side-api-key
OPENAI_MODEL=gpt-4o-mini
LEARNING_ASSESSMENT_SECRET=your-random-secret-at-least-32-characters
```

Use an OpenAI model enabled for your API key that supports JSON mode. The
default model is `gpt-4o-mini`; set `OPENAI_MODEL` to another enabled model if
needed. Generate an assessment secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Never expose these values through `NEXT_PUBLIC_*` variables, return them from
an API, or commit `.env.local`. AI-generated answer keys are encrypted in an
opaque, user-bound token and are only released after server-side submission.
The token expires after one hour. Keep the secret stable across deployments
while generated assessments may still be active; rotating it invalidates them.
If no OpenAI API key is configured, quiz generation returns clearly labeled
curated questions from the existing course bank. Provider errors are reported
as errors and do not silently fall back. AI explanations, study material
summaries/checklists, and AI study plans require a working provider and show a
helpful configuration/network error when it is unavailable.

### AI endpoints and safeguards

- `POST /api/learning/generate-quiz` accepts a topic, learner level,
  difficulty, and optional extracted study text (maximum 12,000 characters).
- `POST /api/learning/explain` accepts the question, selected answer,
  assessment answer key, topic, and optional source material (maximum 8,000
  characters).
- `POST /api/learning/study-plan` accepts topic mastery evidence, study time,
  and an optional deadline. The returned tasks cannot exceed the requested
  time budget.
- `POST /api/learning/study-material` accepts one PDF or TXT file plus a
  selected topic. Files are limited to 10 MB; PDFs to 40 pages; extracted text
  to 12,000 characters. The API previews extracted text but only saves upload
  metadata in Supabase, never the original file or extracted text.
- `POST /api/learning/material-tools` accepts bounded extracted text and
  returns a source-quote-checked summary and checklist.
- `POST /api/learning/submit-generated` grades generated or curated fallback
  questions without sending generated answer keys to the browser.
- `GET /api/learning/progress` restores authenticated attempts after refresh;
  `DELETE` clears attempt and revision-task history. Revision task changes are
  stored through `GET/PUT /api/learning/revision-tasks`.

In authenticated mode, protected endpoints require a valid Supabase session.
All endpoints limit request body sizes and AI provider requests use a
20-second timeout with SDK retries disabled. Without Supabase credentials, the
clearly labeled local demo permits learning routes without authentication and
stores progress in browser storage; it does not provide cross-device
persistence. Study text is bounded and explicitly treated as untrusted
reference material; instructions inside it are not followed. When source text
is provided, returned source quotes must match it exactly to be labeled
grounded. AI explanations/plans are clearly identified as model suggestions,
not independently verified facts.
PDF extraction is text-based; scanned-image OCR is not supported.

## Authentication routes

- `/login` — email/password sign-in
- `/signup` — account creation and verification email
- `/forgot-password` — request a reset email
- `/auth/callback` — exchange a one-time Supabase auth code
- `/reset-password` — set a new password from a valid recovery session
- `/dashboard` — authenticated landing page with sign-out

## Learning workspace

- `/` — public landing page with signup and sign-in actions
- `/dashboard` — progress computed from the same attempts used by the quiz
- `/learn` — Data Structures course topic cards
- `/quiz` — one-question-at-a-time adaptive quiz with answer explanations
- `/knowledge-map` — per-topic mastery and evidence overview
- `/revision-planner` — prioritized study tasks from topic performance

Without Supabase credentials, the workspace runs as an unauthenticated local
demo and saves quiz attempts and checklist marks in browser storage. With
Supabase configured, server-graded attempts, mastery aggregates, revision
tasks, and uploaded-file metadata are stored in PostgreSQL under the
authenticated user's ID. Row-level security restricts reads and task changes
to their owner; server-side grading writes use the server-only service role
key after verifying the user's session. Raw uploads and extracted text are
not persisted. Use **Reset local demo progress** or **Reset saved progress**
in the workspace navigation to clear attempts and revision tasks for the
current mode.

The deterministic mastery estimator requires at least 3 attempts per topic.
After that it combines recent accuracy over up to the last 5 attempts (60%)
with cumulative accuracy (40%). Scores below 50% recommend a foundational
explanation and easy practice; 50–79% recommend targeted practice; 80% or
higher recommends a harder application question or, at every third attempt,
a spaced review. Before the evidence threshold, mastery is shown as
“Insufficient evidence” and practice starts at easy difficulty.

Incorrect-answer misconception labels in the curated assessment are only
shown when the selected distractor has a question-authored tag. Other wrong
answers are described as a possible misunderstanding, not a diagnosed
misconception. The optional AI practice flow is separate from adaptive
question selection; generated attempts contribute to the same demo topic
performance, but the deterministic mastery formula and recommendations
remain unchanged.

Route access is checked with Supabase `getUser()` in the Next.js proxy and
again on protected server pages when Supabase is configured. In demo mode no
account is created and no server persistence is claimed. The learning
migration includes ownership constraints and RLS; apply both SQL migrations
before using persisted learning features.

## Reproducible demo scenario

This scenario works without Supabase or an AI key:

1. Run `npm run dev`, open `http://localhost:3000`, and choose **Explore local
   demo**. Open **Practice quiz**, select **Arrays**, and start **Review
   foundations**.
2. For the first question about indexed array access, choose **B · O(log n)**
   rather than **A · O(1)**, then select **Check answer**. The feedback marks
   the answer incorrect and explains why known-index array access is O(1).
3. Select **Continue** to start the follow-up practice question. For the
   zero-based indexing question, choose **18** rather than **25**; continue
   again and choose an incorrect answer for the next Arrays question.
4. After the third submitted Arrays answer, review the updated feedback
   recommendation. The evidence status changes from insufficient evidence to
   low mastery, and the explanation now cites the submitted answers rather
   than the lack of evidence. The recommendation remains foundational practice.
5. Open **Knowledge map** and **Revision planner** to see the same attempt
   evidence and priorities. Refresh the dashboard to confirm browser-local
   progress persists; use **Reset local demo progress** to repeat the scenario.

The first incorrect-answer feedback, explanation, and immediate follow-up are
visible before completing all three answers; three attempts are needed to move
from insufficient evidence to a mastery estimate.

## Production deployment

1. Run the checks below and deploy the Next.js application to a host that
   supports the App Router and server routes (for example, Vercel).
2. Configure the environment variables above in the host. Use the production
   HTTPS origin for `NEXT_PUBLIC_SITE_URL`; keep the service-role key, AI key,
   and assessment secret server-side only.
3. Apply both SQL migrations to the target Supabase project before enabling
   authenticated learning persistence. Configure Supabase Site URL, callback
   allowlists, email provider, and SMTP for the production origin.
4. Deploy/redeploy after setting environment variables. Verify signup,
   confirmation/reset callbacks, login/logout, authenticated quiz grading,
   revision-task ownership, and upload validation in the deployed environment.
5. If `OPENAI_API_KEY` is absent, the app remains usable: generated quiz
   requests return labeled curated questions; AI explanation, summary, and
   study-plan requests report that AI is unavailable.

## Known limitations

- Demo progress is stored only in the current browser and is not an account.
- Supabase persistence and cross-user RLS isolation require applying the
  migrations and were not verified against a live project in this workspace.
- AI responses require a valid provider key/model and are educational
  suggestions, not independently verified facts. Missing provider
  configuration does not enable AI summaries, explanations, or plans.
- PDF extraction supports selectable text only; scanned-image OCR is not
  available. Uploads and extracted text are transient; only file metadata is
  saved for authenticated users.
- Google OAuth, persistent uploaded-file storage, and course authoring tools
  are not enabled.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```
#   L e a r n L o o p A I  
 