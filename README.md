# WordPress Plugin Generator

A tiny Node + Express web app that proxies the [OpenRouter](https://openrouter.ai) chat completions API to turn natural language prompts into installable WordPress plugins. Keep everything local, drop in any OpenRouter model, and grab the generated PHP instantly.

## Features

- **Single endpoint** – `/api/generate` accepts an API key, OpenRouter model name, and plugin description.
- **Static UI** – vanilla HTML + CSS + JS (no build step) with copy + download helpers.
- **Prompt template** – edit `templates/prompt-template.txt` to tweak the system instructions.
- **Preset library** – curated beginner-to-expert prompt presets surfaced directly in the UI.
- **Minimal dependencies** – just Express and node-fetch.

## Prerequisites

- Node.js 18+ (for native `fetch`, AbortController, and modern JS features)
- An OpenRouter API key: <https://openrouter.ai/keys>

## Configuration

The UI lets you paste a key per request, but the server also checks `OPENROUTER_API_KEY` if you prefer to keep the key on the backend:

```cmd
set OPENROUTER_API_KEY=sk-or-v1-your-key
```

(Use `export` on macOS/Linux shells.)

You can optionally change the default model by editing `public/index.html` (the input pre-fills `openrouter/auto`).

## Run locally

```cmd
npm install
npm start
```

Navigate to <http://localhost:3000> and open the UI.

## Publish to GitHub

1. Create (or confirm) an empty repository named `wp-plugin-generator` under <https://github.com/chchchadzilla>.
2. The project is already initialized with Git metadata, MIT license, and a remote pointing to `https://github.com/chchchadzilla/wp-plugin-generator.git`.
3. Push the code:

```cmd
git push -u origin master
```

1. Tag releases whenever you cut new preset bundles:

```cmd
git tag v1.0.0
git push origin v1.0.0
```

## Usage

1. Paste your OpenRouter API key (or leave blank if the server already has `OPENROUTER_API_KEY`).
2. Choose any model ID available to your account.
3. Optionally pick a preset scenario from the dropdown to auto-fill the description with a vetted, elegant brief.
4. Describe (or refine) the WordPress plugin you want in plain English.
5. Hit **Generate**. The result pane will show the PHP code; you can copy or download it.
6. Place the downloaded file inside `wp-content/plugins/<your-plugin>` and activate it from the WP admin dashboard.

### Preset library

- Definitions live in `public/data/prompt-presets.json`. Each entry includes an ID, title, level, summary, and thoughtfully worded prompt.
- Add or edit entries to tailor the generator toward your team’s workflows—just keep the JSON array sorted and the prose actionable.
- The bundled set now spans beginner helpers through suite-wide expert briefs (licensing hubs, conflict radar, observability buses, etc.) and is grouped into labeled optgroups inside the dropdown for quick scanning.
- The frontend fetches this file at runtime; no rebuild required. If you remove the file, the UI falls back to manual descriptions.

## Safety checks

- Requests >512 KB are rejected by Express.
- Each OpenRouter call times out after 60 seconds to avoid hanging connections.
- Errors from OpenRouter are surfaced directly so you can adjust your prompt or quota.

## Next steps

- Harden validation for user-supplied prompts.
- Add optional zipping of the plugin file with additional assets.
- Introduce lightweight caching for repeated prompts.
