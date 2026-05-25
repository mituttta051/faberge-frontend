# Museum AI Guide — Frontend

Мобильный web-app (PWA) — AI-гид по экспозиции Музея Фаберже.

## Стек

- **Next.js 15** (App Router) + TypeScript + React 19
- **TailwindCSS v4** (CSS-конфиг через `@theme`)
- **Zustand** — клиентский стейт
- **TanStack Query** — кеш и ретраи API
- **MSW** — моки бэкенда на время разработки
- **lucide-react** — иконки
- **react-zoom-pan-pinch** — зум/pan для интерактивной карты

Деплой: статика (`output: "export"`) → Yandex Object Storage + CDN.

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # уже есть, отредактировать при подключении бэка
npm run dev
```

Открыть http://localhost:3000

## Скрипты

- `npm run dev` — dev-сервер (Turbopack)
- `npm run build` — production-билд статики в `out/`
- `npm run lint` — ESLint
- `npm run format` — Prettier (запись)
- `npm run format:check` — Prettier (проверка)

## Структура

```
app/                — маршруты Next.js (App Router)
components/         — UI-компоненты
lib/
  api/              — клиент API и эндпоинты
  types/            — TS-типы (Hall, Exhibit, ChatMessage, …)
  hooks/            — React-хуки
  store/            — Zustand-сторы
  utils.ts          — cn() и др. хелперы
mocks/              — MSW handlers и фикстуры
public/             — статика (иконки, manifest, картинки)
```

## ENV

- `NEXT_PUBLIC_API_URL` — базовый URL бэкенда
- `NEXT_PUBLIC_USE_MOCKS` — `true`, чтобы поднять MSW и работать без бэкенда
