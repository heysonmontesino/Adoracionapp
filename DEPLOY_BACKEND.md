# Deploy Backend — AdoracionApp

## Quick Start

```bash
npm install
npm run server:start
```

Server listens on `PORT` (default: `3000`).

## Scripts

| Command | Env | Use |
|---|---|---|
| `npm run server:start` | `NODE_ENV=production` | Production deploy |
| `npm run server:dev` | `NODE_ENV=development` | Local development |

## Variables de Entorno

### Bible AI (producción)
| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `BIBLE_AI_PROVIDER` | No | `gemini` | Proveedor: `gemini`, `openrouter`, `mock` |
| `GEMINI_API_KEY` | Sí (si provider=gemini) | — | API key de Google Gemini |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Modelo de Gemini a usar |
| `OPENROUTER_API_KEY` | Sí (si provider=openrouter) | — | API key de OpenRouter |
| `ALLOW_PRODUCTION_MOCK` | No | `false` | Solo para emergencias. Permite mock en producción. |

### YouTube feed (opcional)
| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del servidor |
| `YOUTUBE_API_KEY` | `""` | API key de YouTube |
| `YOUTUBE_CHANNEL_ID` | `""` | Channel ID de YouTube |
| `YOUTUBE_MOCK_MODE` | `false` | Solo en desarrollo |

### Comportamiento por defecto en producción
- `BIBLE_AI_PROVIDER=gemini` → Usa Gemini 2.0 Flash
- Si falta `GEMINI_API_KEY` → Devuelve 503 con error controlado
- `BIBLE_AI_PROVIDER=mock` → **Bloqueado** en producción (devuelve 503)
- `ALLOW_PRODUCTION_MOCK=true` → Permite mock en producción (emergencias)

### Comportamiento en desarrollo
- `BIBLE_AI_PROVIDER=mock` → Usa mockProvider (default si no hay API key)
- `BIBLE_AI_PROVIDER=gemini` → Usa Gemini si `GEMINI_API_KEY` está configurada
- Sin API key configurada → Usa mock automáticamente

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/v1/content/feed` | YouTube content feed |
| `POST` | `/v1/bible-ai/insight` | Bible AI insights |

## Deploy en Render

1. Crear **Web Service** en [render.com](https://render.com)
2. Conectar repositorio GitHub
3. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server:start`
   - **Environment:** `NODE_ENV=production`
4. Agregar variables de entorno:
   ```
   NODE_ENV=production
   BIBLE_AI_PROVIDER=gemini
   GEMINI_API_KEY=tu-api-key-aqui
   GEMINI_MODEL=gemini-2.5-flash-lite
   ```
5. Deploy automático en cada push

## Deploy en Railway

1. Crear proyecto en [railway.app](https://railway.app)
2. Conectar repositorio GitHub
3. **Start Command:** `npm run server:start`
4. Variables en pestaña Variables:
   ```
   NODE_ENV=production
   BIBLE_AI_PROVIDER=gemini
   GEMINI_API_KEY=tu-api-key-aqui
   GEMINI_MODEL=gemini-2.5-flash-lite
   ```

## Probar después del deploy

```bash
BASE_URL="https://tu-app.onrender.com"

# 1. Health check
curl -s $BASE_URL/health

# 2. Request válido (debe devolver 200 con IA real)
curl -s -X POST $BASE_URL/v1/bible-ai/insight \
  -H "Content-Type: application/json" \
  -d '{
    "book": "Juan",
    "chapter": 3,
    "verseStart": 16,
    "verseText": "Porque de tal manera amó Dios al mundo",
    "insightType": "context",
    "language": "es"
  }'

# 3. Sin API key (debe devolver 503 controlado)
# Configurar BIBLE_AI_PROVIDER=gemini sin GEMINI_API_KEY

# 4. Payload grande (debe devolver 413)
curl -s -X POST $BASE_URL/v1/bible-ai/insight \
  -H "Content-Type: application/json" \
  -d '{"book":"Juan","chapter":3,"verseStart":16,"verseText":"'"$(python3 -c "print('A'*40000)")"'","insightType":"context","language":"es"}'
```

## Conectar frontend después del deploy

1. Obtener URL pública del backend
2. En `.env` de Expo:
   ```
   EXPO_PUBLIC_USE_BACKEND_BIBLE_AI=true
   EXPO_PUBLIC_BACKEND_URL=https://tu-backend-url.com
   ```
3. Rebuild: `npx expo start`

## Proveedor elegido: Gemini 2.5 Flash Lite

**Modelo:** `gemini-2.5-flash-lite` (configurable via `GEMINI_MODEL`)

**Justificación:**
- Optimizado para velocidad y costo reducido
- Excelente soporte para español
- `responseMimeType: 'application/json'` nativo
- Safety settings integrados
- Temperatura 0.4 para respuestas consistentes y prudentes

**Alternativa:** OpenRouter con `google/gemini-2.0-flash-exp:free` — mismo modelo, diferente gateway. Útil si necesitas fallback o múltiples modelos.
