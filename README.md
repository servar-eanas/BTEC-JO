# BTEC JO — Full Stack AI

## Local
1. Install Node.js.
2. Copy `.env.example` to `.env`.
3. Put your OpenAI API key in `.env`.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:10000`.

## AI flow
Internal 100-question database -> if no match -> Backend -> OpenAI Responses API + web search -> answer.
The API key is never placed in frontend JavaScript.

## Render
Create a Web Service from this repo. Build: `npm install`; Start: `npm start`; add `OPENAI_API_KEY` in Environment Variables.


## Production notes
- Do not commit `.env` or an OpenAI API key.
- On Render set `OPENAI_API_KEY` to a real ASCII OpenAI API key and keep `OPENAI_MODEL=gpt-5-mini`.
- The backend validates the key before constructing the OpenAI client, preventing Unicode placeholder values from causing the Undici ByteString error.
- Web search is performed server-side so the API key is never exposed to visitors.
- PWA files, sitemap and robots.txt are served from `BTEC JO/`.
