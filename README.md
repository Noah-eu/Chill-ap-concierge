# CHILL Concierge (CZ)

Lehký „concierge“ chat bez parkování a check‑inu. Frontend (Vite + React), backend Netlify Functions.

## Rychlý start (lokálně)
```bash
npm i
npm run dev       # frontend na http://localhost:5173
npm run serve     # Netlify Functions na http://localhost:8888
```
Backend je plně deterministický (žádný OpenAI klíč ani jiné AI API).

## Nasazení na Netlify
1. Vytvoř nový repo na GitHubu a pushni obsah tohoto projektu.
2. V Netlify: **Add new site → Import from Git** a vyber repo.
3. Build command: `npm run build`, Publish dir: `dist`, Functions dir: `netlify/functions` (je v `netlify.toml`).
4. Deploy (žádné povinné tajné proměnné pro chat).

## Endpoint
Frontend volá `/.netlify/functions/concierge`.

## Co je záměrně vypnuté
- Parkování, check‑in/out, kódy, ceny pokojů, prodloužení pobytu atd. jsou filtrovány na úrovni funkce a pravidel odpovědí.
