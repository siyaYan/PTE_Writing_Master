# PTE Writing Master

PTE Writing Master is now structured as a Next.js App Router project so it can be deployed directly to Vercel.

## Stack

- Next.js 15
- React 19
- Tailwind CSS 4
- Gemini API via a server-side Next.js route

## Local Development

**Prerequisites**

- Node.js 20+
- A Gemini API key

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set your Gemini key:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Environment Variables

- `GEMINI_API_KEY`
  Required. Read only on the server by the `/api/gemini` proxy route.

Do not expose the Gemini key with a `NEXT_PUBLIC_` prefix. The client calls the local Next.js API route, and the route forwards requests to Gemini on the server.

## Project Structure

```text
src/
  app/
    api/gemini/route.ts   # Server-side proxy for Gemini requests
    globals.css
    layout.tsx
    page.tsx
  components/             # Client UI components
  server/gemini.ts        # Gemini SDK integration
  services/geminiService.ts
  types/gemini.ts
```

## Deploy To Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the project into Vercel.
3. Add `GEMINI_API_KEY` in the Vercel project settings:
   `Settings -> Environment Variables`
4. Deploy.

Vercel will run `npm install` and `npm run build` automatically. No extra proxy service is required because the Gemini integration is already handled through the Next.js API route.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notes

- The browser no longer receives the Gemini API key.
- Gemini requests now flow through `src/app/api/gemini/route.ts`.
- If you change Gemini models or prompt logic, update `src/server/gemini.ts`.
