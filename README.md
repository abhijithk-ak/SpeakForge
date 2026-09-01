# SpeakForge

**AI-powered communication and interview practice platform.**
Practice mock interviews, 2-minute speeches, and client conversations with a real-time voice AI coach — completely free, using your own API keys.

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Stack: React + Node.js](https://img.shields.io/badge/Stack-React_+_Node.js-blue.svg)]()
[![AI: Groq / Gemini / OpenAI](https://img.shields.io/badge/AI-BYOK-green.svg)]()

---

## What Is SpeakForge?

SpeakForge is an open-source, full-stack BYOK (Bring Your Own Key) platform that helps you:

- **Mock Interviews** — Behavioral, technical, HR, system design rounds
- **Speech Practice** — Structured 2-minute speeches on any topic
- **Client Communication** — Roleplay high-stakes client scenarios

**Zero hosting cost.** You configure your own Groq / Gemini / OpenAI key in the settings UI. SpeakForge never stores your key in plaintext — keys are AES-256-GCM encrypted at rest.

---

## How the Voice Loop Works

```
  Browser Mic
      ↓ (Web Speech API — free, built into Chrome/Edge)
  Transcript text
      ↓ (HTTPS to your local server)
  LLM (Groq / Gemini / OpenAI — your key)
      ↓ AI coach response text
  Browser TTS (SpeechSynthesis — free, built-in)
      ↓
  You hear the coach speak
```

**Latency:** ~1-3 seconds end-to-end on Groq free tier.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Vanilla CSS, Lucide Icons |
| Backend | Node.js + Express.js, JWT Auth, Rate Limiting |
| Database | PostgreSQL (local or Supabase free tier) |
| STT | Browser Web Speech API (free, no key needed) |
| TTS | Browser SpeechSynthesis API (free, no key needed) |
| LLM | Groq (free tier) / Google Gemini (free tier) / OpenAI |
| Security | AES-256-GCM key encryption, bcrypt passwords, Helmet.js |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Supabase account)
- Chrome or Edge browser (for Web Speech API)
- A free [Groq API key](https://console.groq.com/keys) or [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/abhijithk-ak/SpeakForge.git
cd SpeakForge
```

### 2. Server Setup

```bash
cd server
npm install
cp ../.env.example .env
```

Edit `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/speakforge
JWT_SECRET=any-long-random-string-here
ENCRYPTION_KEY=generate-a-64-char-hex-string   # see note below
CLIENT_URL=http://localhost:5173
```

> **Generating ENCRYPTION_KEY** (Node.js):
> ```js
> require('crypto').randomBytes(32).toString('hex')
> ```

### 3. Database Setup

```bash
# Create the database
createdb speakforge

# Run migrations
node database/migrate.js
```

### 4. Client Setup

```bash
cd client
npm install
```

### 5. Start Both Servers

In two separate terminals:

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Open **http://localhost:5173** in Chrome or Edge.

### 6. Configure Your AI Provider

1. Sign up / Log in to SpeakForge
2. Go to **Settings → AI Provider**
3. Paste your Groq or Gemini API key
4. Click **Test Connection** to verify
5. Start practicing!

---

## BYOK — Privacy Guarantee

- Your API key is encrypted with AES-256-GCM before being stored in the database.
- The decrypted key only exists in server memory during an active API call.
- The key is **never** returned to the client in any response.
- SpeakForge does not proxy your LLM calls through any third-party service.

---

## Project Structure

```
SpeakForge/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/             # Route pages
│       │   ├── practice/      # Setup pages (interview, speech, client)
│       │   ├── SessionPage    # Core voice loop
│       │   ├── ResultsPage    # Evaluation scores
│       │   └── ...
│       ├── services/          # API client functions
│       ├── context/           # AuthContext
│       └── layouts/           # App shell + Public layout
│
├── server/                    # Node.js + Express API
│   └── src/
│       ├── controllers/       # Request handlers
│       ├── routes/            # Express routers
│       ├── services/          # LLM service (Groq/Gemini/OpenAI)
│       ├── db/repositories/   # Database access layer
│       ├── middleware/        # Auth, rate limiting, errors
│       └── utils/             # Encryption, logger
│
└── database/
    ├── migrations/            # SQL schema files (001-010)
    └── migrate.js             # Migration runner
```

---

## Supported AI Providers

| Provider | Free Tier | Speed | Best For |
|----------|----------|-------|---------|
| **Groq** | 30 RPM, unlimited tokens | Very fast (~0.5s) | Realtime feel |
| **Google Gemini** | 15 RPM, 1M tokens/day | Fast (~1-2s) | Long sessions |
| **OpenAI** | Paid (credit required) | Medium | Maximum quality |

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Some ideas for contributions:
- Add more interview domains and question banks
- WebRTC-based audio streaming for lower latency
- Mobile app (React Native)
- Docker Compose setup for one-command startup
- Analytics dashboard improvements

---

## License

MIT © [Abhijith K](https://github.com/abhijithk-ak)
