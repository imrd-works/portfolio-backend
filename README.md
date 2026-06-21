# portfolio-backend

Бэкенд формы контактов для [портфолио](https://github.com/imrd-works/portfolio). Один эндпоинт: принимает заявку, валидирует её и отправляет тебе в Telegram. Написан на **Hono**, деплоится как **Yandex Cloud Function**.

```bash
npm install
cp .env.example .env   # заполни токены
npm run dev            # http://localhost:3000
```

---

## Как работает

```
Браузер (форма портфолио)  ──POST /contact──▶  Yandex Cloud Function (Hono)  ──▶  Telegram Bot API  ──▶  твой чат
```

- `POST /contact` (или `POST /` при прямом вызове функции) — принимает `{ name, contact, message }`.
- Валидация повторяет правила фронта (имя — только буквы, контакт — email или Telegram, нельзя прислать твои собственные контакты).
- При успехе шлёт сообщение в Telegram и возвращает `{ ok: true }`.
- CORS ограничен origin'ом сайта; есть honeypot-поле против ботов.

---

## 1. Создать Telegram-бота

1. Напиши [@BotFather](https://t.me/BotFather) → `/newbot` → получи **токен** вида `123456789:AA...`.
2. Узнай свой **chat_id**: напиши боту любое сообщение, затем открой
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` — `chat.id` будет в ответе.
   (Или используй [@userinfobot](https://t.me/userinfobot).)

Важно: чтобы бот мог тебе писать, ты должен сам первым нажать **Start** у своего бота.

---

## 2. Переменные окружения

Скопируй `.env.example` → `.env` и заполни:

| Переменная           | Назначение                                                            |
| -------------------- | --------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Токен от BotFather                                                    |
| `TELEGRAM_CHAT_ID`   | Твой chat_id, куда летят заявки                                       |
| `ALLOWED_ORIGIN`     | Origin сайта (напр. `https://daniel.ru`); список через запятую или `*` |
| `OWNER_EMAIL`        | Твоя почта — её запрещено вводить в форму                             |
| `OWNER_TELEGRAM`     | Твой Telegram (`@IIMRD`) — тоже запрещён к вводу                      |
| `PORT`               | Только для локального `npm run dev`                                  |

В Yandex Cloud эти значения задаются в настройках функции (см. ниже), а не в `.env`.

---

## 3. Локальная проверка

```bash
npm run dev
```

```bash
curl -X POST http://localhost:3000/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Иван","contact":"ivan@mail.ru","message":"Хочу обсудить проект"}'
# -> {"ok":true}  и сообщение прилетает в Telegram
```

---

## 4. Сборка и деплой в Yandex Cloud Functions

Код собирается в один файл `dist/index.js` (через esbuild) — без `node_modules` на рантайме, быстрый холодный старт.

```bash
npm run build      # dist/index.js
npm run package    # + function.zip
```

### Вариант A — через `yc` CLI (автоматизировано)

Установи [`yc`](https://yandex.cloud/ru/docs/cli/quickstart) и авторизуйся, затем:

```bash
FUNCTION_NAME=portfolio-contact bash scripts/deploy.sh
# один раз — разрешить публичные вызовы:
yc serverless function allow-unauthenticated-invoke portfolio-contact
```

### Вариант B — через консоль

1. Cloud Functions → **Создать функцию** → runtime **Node.js 18**.
2. Загрузи `function.zip`, точка входа — `index.handler`.
3. Memory 128 МБ, таймаут 10 с.
4. Во вкладке **Переменные окружения** добавь `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ALLOWED_ORIGIN`, `OWNER_EMAIL`, `OWNER_TELEGRAM`.
5. Сделай функцию **публичной** (разрешить вызов без авторизации) и скопируй её URL.

> Оплата Yandex Cloud — в рублях, картой РФ. Для одной формы расход около нуля (есть бесплатный грант).

---

## 5. Подключить фронтенд

В репозитории портфолио укажи URL функции в `.env`:

```
VITE_CONTACT_API_URL=https://functions.yandexcloud.net/<function-id>
```

`sendContactRequest` шлёт `POST` на `${VITE_CONTACT_API_URL}/contact`. Если переменная не задана — форма работает в демо-режиме (как раньше, без реальной отправки).

---

## Структура

```
src/
├── app.ts          # Hono-приложение: маршруты, CORS, honeypot
├── config.ts       # чтение env
├── validation.ts   # серверная валидация (зеркало фронта)
├── telegram.ts     # формат сообщения + отправка в Telegram
├── yandex.ts       # адаптер событий Yandex Cloud Functions ⇄ Fetch API
├── index.ts        # точка входа функции (handler)
└── dev.ts          # локальный Node-сервер
scripts/deploy.sh   # деплой через yc CLI
```

## Скрипты

| Команда             | Описание                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Локальный сервер с hot-reload             |
| `npm run typecheck` | Проверка типов                            |
| `npm run build`     | Сборка `dist/index.js`                    |
| `npm run package`   | Сборка + `function.zip`                   |
| `npm run deploy`    | Сборка + деплой через `scripts/deploy.sh` |
