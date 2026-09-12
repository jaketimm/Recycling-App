# Local Development

## Install Dependencies

```bash
npm install
```

Set up Python backend:

```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask backend

```bash
cd server
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

2. In a new terminal, run the dev server

```bash
npm run dev
```

## Supabase commands

```bash
npm run supabase:push
```

## Run RLS Unit tests

RLS tests must run against a **local** Supabase instance (Docker required) — they refuse to run against the remote/production database. Test users (`userA`, `userB`, `admin`) are created and torn down automatically in `globalSetup`, so no manual setup is needed beyond starting the stack.

```bash
npx supabase start
npx supabase db reset  # use if the DB/migrations have changed
npm run test:db -- src/tests/db/userProfiles.test.ts  # run a single test file
npm run test:db   # Run all tests
```

`.env.test` needs `VITE_SUPABASE_URL` set to `http://127.0.0.1:54321` along with the local `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_SERVICE_ROLE_KEY` (printed by `npx supabase status`).

### Stop the local Supabase instance

```bash
npx supabase stop
```
