# HustleAI — Open-source AI side-hustle project

HustleAI helps independent sellers draft product listings, social captions, and product headlines. The frontend is plain HTML, CSS, and JavaScript. For real AI generation, a tiny Node.js server sends prompts to a locally running Ollama model.

## Features

- Product/service form with platform and tone choices
- Product listing, social caption, and headline generation
- Copy and regenerate actions
- Responsive dark SaaS-style interface
- Real local model inference through Ollama
- Demo draft fallback when the local AI server is unavailable (clearly labelled as demo)
- No external hosted AI API key required

## Requirements

- Node.js 18 or newer
- [Ollama](https://ollama.com/)
- A compatible open-weight model; default is `qwen2.5:3b`

## Run locally

1. Install Ollama from https://ollama.com/.
2. Open a terminal and download the model:

   ```bash
   ollama pull qwen2.5:3b
   ```

3. Keep Ollama running. In the project folder, start the website:

   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser.
5. Enter a product and click **Generate content**. The result panel should say `OPEN MODEL · qwen2.5:3b` when real model inference is used.

If your computer has limited RAM, try a smaller model available in Ollama and set the model name before starting the server:

**Windows PowerShell**
```powershell
$env:OLLAMA_MODEL="your-model-name"
npm start
```

**macOS/Linux**
```bash
OLLAMA_MODEL=your-model-name npm start
```

## Project structure

```text
HustleAI/
├── index.html   # page structure
├── style.css    # responsive design and visual effects
├── script.js    # form, API call, demo fallback, copy/regenerate
├── server.js    # local web server and Ollama API bridge
├── package.json
└── README.md
```

## How the AI works

The browser sends the seller's inputs to `/api/generate`. `server.js` builds an instruction prompt and sends it to Ollama at `http://127.0.0.1:11434/api/generate`. Ollama runs the selected model locally and returns generated text.

**Privacy note:** With this setup, the app sends prompts to the local Ollama service, not a hosted AI provider. Do not expose the server publicly without adding authentication, rate limits, and additional security controls. Model downloads require internet, but generation can work offline once the model is installed.

## What is and isn't included

- Included: functional local AI generation, responsive UI, basic input validation, copy/regenerate, and a clearly labelled demo fallback.
- Not included: accounts, payment processing, database, persistent history, multi-user hosting, or a production security review.
- The demo fallback is template-based and is **not AI inference**. For the real AI path, run the server and Ollama.

## Side-hustle validation plan

1. Ask one local seller, student entrepreneur, or small Instagram shop to try it.
2. Watch them create one listing without helping.
3. Ask whether it saved time and what they would change.
4. Offer a small paid pilot only after validating usefulness; do not claim paying users until someone actually pays.

## Suggested future improvements

- Save brand voice presets locally
- Generate multiple variants in one request
- Add Hindi/English output options
- Add export to `.txt` or copy-ready platform formats
- Add authentication, usage limits, and payments if you host it for customers

## License

Choose a license before publishing the repository. If you intend to accept outside contributions, MIT is a common permissive option; check that it fits your project and dependencies.
