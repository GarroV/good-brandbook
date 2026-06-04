# Design Terminal — Architecture

## Структура проекта

```
/app
  /api
    /batches
      route.ts          -- GET (список), POST (создать батч)
    /batches/[id]
      route.ts          -- GET (батч с items и assets)
    /batches/[id]/publish
      route.ts          -- POST (опубликовать в галерею)
    /generate
      route.ts          -- POST (запустить генерацию)
    /brandbook
      route.ts          -- GET, PUT (только admin)
    /invites
      route.ts          -- POST (создать инвайт, только admin)
    /invites/[token]
      route.ts          -- GET (принять инвайт)
    /admin
      /workspaces       -- superadmin: список workspace
      /workspaces/[id]  -- superadmin: управление workspace
      /limits/[id]      -- superadmin: лимиты workspace

  /(auth)
    /login/page.tsx
    /invite/[token]/page.tsx

  /(app)                -- защищённые роуты (требуют auth)
    /page.tsx           -- галерея (главная)
    /new/page.tsx       -- новый макет
    /my/page.tsx        -- мои макеты
    /admin
      /page.tsx         -- управление командой (только admin)
      /brandbook
        /page.tsx       -- настройка брендбука (только admin)

  /(superadmin)         -- только is_superadmin = true
    /superadmin/page.tsx

/lib
  /claude
    client.ts           -- инициализация Anthropic SDK
    generate.ts         -- сборка промпта, вызов API
    prompts.ts          -- системные промпты по форматам
    validate.ts         -- валидация HTML от Claude
  /puppeteer
    render.ts           -- HTML → JPEG превью
    export.ts           -- HTML → PDF / PNG финал
    fonts.ts            -- загрузка и кеш шрифтов
  /supabase
    server.ts           -- серверный клиент
    client.ts           -- браузерный клиент
    types.ts            -- типы из схемы БД
  /formats
    index.ts            -- константа всех форматов с размерами
  /limits
    check.ts            -- проверка лимитов (атомарно)

/components
  /ui                   -- shadcn компоненты
  /gallery
    Grid.tsx            -- сетка карточек макетов
    Card.tsx            -- карточка одного макета
    Filters.tsx         -- фильтры по стране и формату
  /generator
    Form.tsx            -- форма запроса
    FormatPicker.tsx    -- чекбоксы форматов
    Progress.tsx        -- прогресс генерации
  /activity
    Feed.tsx            -- лента активности realtime
  /admin
    InviteForm.tsx
    UserTable.tsx
    LimitsPanel.tsx     -- только superadmin

/messages
  en.json
  ru.json

/middleware.ts           -- защита роутов, superadmin check
```

---

## Флоу генерации

### 1. Запрос от маркетолога

```
POST /api/generate
{
  prompt: "акция -20% на пиццу, Словения, до 30 июня",
  formats: ["a4", "instagram_post", "tv_board"],
  reference_batch_id: "uuid" | null
}
```

### 2. Бэкенд — подготовка

```typescript
// проверка брендбука
const brandbook = await getBrandbook(workspace_id)
if (!brandbook?.tokens || isEmpty(brandbook.tokens)) {
  return { error: 'brandbook_not_configured' }
}

// проверка лимитов (атомарно в Postgres)
await checkAndIncrementLimit(workspace_id, user_id)

// создаём batch и batch_items
const batch = await createBatch({ workspace_id, user_id, prompt, reference_batch_id })
const items = await createBatchItems(batch.id, formats, workspace_id)
```

### 3. Параллельная генерация

```typescript
const TIMEOUT = 5 * 60 * 1000 // 5 минут

const results = await Promise.allSettled(
  items.map(item =>
    Promise.race([
      generateFormat(item, prompt, brandbook, referenceJpegUrl),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT)
      )
    ])
  )
)

// fulfilled → статус preview_ready
// rejected  → статус failed
```

### 4. Генерация одного формата

```typescript
async function generateFormat(item, prompt, brandbook, referenceJpegUrl) {
  await updateStatus(item.id, 'generating')

  // собираем сообщения для Claude
  const messages = buildMessages(prompt, brandbook, item.format, referenceJpegUrl)

  // вызов Claude API
  const html = await callClaude(messages)

  // валидация HTML
  validateHtml(html, item.format)

  // сохраняем HTML в Storage
  const htmlUrl = await uploadHtml(html, item.id)

  // рендерим JPEG превью через Puppeteer
  const jpegUrl = await renderPreview(html, item.format)

  // сохраняем assets
  await saveAsset(item.id, 'jpeg_preview', jpegUrl)
  await updateItem(item.id, { html_url: htmlUrl, status: 'preview_ready' })
}
```

### 5. После одобрения пользователем

```typescript
// POST /api/batches/[id]/publish
async function publishBatch(batchId) {
  const items = await getReadyItems(batchId)

  await Promise.all(items.map(async item => {
    await updateStatus(item.id, 'exporting')
    const html = await downloadHtml(item.html_url)
    const format = FORMATS[item.format]

    if (format.output === 'pdf') {
      const pdfUrl = await exportPdf(html, format)
      await saveAsset(item.id, 'pdf', pdfUrl)
    } else {
      const pngUrl = await exportPng(html, format)
      await saveAsset(item.id, 'png_final', pngUrl)
    }

    await updateStatus(item.id, 'done')
  }))

  await updateBatch(batchId, { status: 'published' })
  await writeActivityFeed(batchId)
}
```

---

## Сборка промпта для Claude

```typescript
function buildMessages(prompt, brandbook, format, referenceJpegUrl) {
  const { width, height } = FORMATS[format]

  const systemPrompt = `
Ты верстальщик маркетинговых макетов. Генерируешь самодостаточный HTML с inline CSS.

БРЕНДБУК:
Цвета: ${JSON.stringify(brandbook.tokens.colors)}
Шрифты: ${JSON.stringify(brandbook.tokens.typography)}
Отступы: ${JSON.stringify(brandbook.tokens.spacing)}
Логотип: ${brandbook.tokens.logo.light}
Правила: ${brandbook.context}

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Размер: ${width}px × ${height}px
- Шрифты через @font-face с локальных путей /fonts/
- Никаких внешних запросов
- Только inline CSS, никаких внешних таблиц стилей
- Верни ТОЛЬКО HTML, без markdown, без объяснений
`

  const content = []

  if (referenceJpegUrl) {
    content.push({
      type: 'image',
      source: { type: 'url', url: referenceJpegUrl }
    })
    content.push({
      type: 'text',
      text: `Используй этот макет как референс по композиции и стилю. Создай новый макет: ${prompt}`
    })
  } else {
    content.push({ type: 'text', text: prompt })
  }

  return { system: systemPrompt, messages: [{ role: 'user', content }] }
}
```

---

## Валидация HTML

```typescript
function validateHtml(html: string, format: string): void {
  const { width, height } = FORMATS[format]

  if (!html || html.length < 200) {
    throw new Error('empty_response')
  }

  if (!html.includes(`${width}px`) || !html.includes(`${height}px`)) {
    throw new Error('wrong_dimensions')
  }

  const openTags = (html.match(/<[^/][^>]*[^/]>/g) || []).length
  const closeTags = (html.match(/<\/[^>]+>/g) || []).length
  if (Math.abs(openTags - closeTags) > 10) {
    throw new Error('broken_html')
  }
}
```

---

## Форматы (константа)

```typescript
// /lib/formats/index.ts
export const FORMATS = {
  a4: {
    label: 'A4',
    width: 794, height: 1123,
    output: 'pdf', category: 'print'
  },
  a5: {
    label: 'A5',
    width: 559, height: 794,
    output: 'pdf', category: 'print'
  },
  instagram_post: {
    label: 'Instagram пост',
    width: 1080, height: 1080,
    output: 'png', category: 'digital'
  },
  instagram_story: {
    label: 'Instagram сторис',
    width: 1080, height: 1920,
    output: 'png', category: 'digital'
  },
  tv_board: {
    label: 'TV-борд',
    width: 1920, height: 1080,
    output: 'png', category: 'digital'
  },
  youtube_preview: {
    label: 'YouTube превью',
    width: 1280, height: 720,
    output: 'png', category: 'digital'
  },
  twitter_post: {
    label: 'Twitter/X',
    width: 1200, height: 675,
    output: 'png', category: 'digital'
  }
} as const
```

---

## Проверка лимитов (атомарно)

```sql
create or replace function check_and_increment_limit(
  p_workspace_id uuid,
  p_user_id uuid
) returns void as $$
declare
  v_limits workspace_limits;
  v_monthly_used int;
  v_daily_used int;
begin
  select * into v_limits from workspace_limits
  where workspace_id = p_workspace_id
  for update;

  select count(*) into v_monthly_used
  from generation_log
  where workspace_id = p_workspace_id
  and created_at > date_trunc('month', now());

  select count(*) into v_daily_used
  from generation_log
  where user_id = p_user_id
  and created_at > date_trunc('day', now());

  if v_monthly_used >= (v_limits.monthly_batches + v_limits.bonus_batches) then
    raise exception 'monthly_limit_exceeded';
  end if;

  if v_daily_used >= v_limits.daily_per_user then
    raise exception 'daily_limit_exceeded';
  end if;

  insert into generation_log (workspace_id, user_id, format)
  values (p_workspace_id, p_user_id, 'batch');
end;
$$ language plpgsql;
```

---

## Шрифты

При сохранении брендбука — скачиваем шрифты один раз:

```typescript
// /lib/puppeteer/fonts.ts
export async function downloadBrandFonts(tokens: BrandbookTokens) {
  const fonts = [
    tokens.typography.heading_font,
    tokens.typography.body_font
  ]
  for (const fontName of fonts) {
    const dest = path.join(process.cwd(), 'public/fonts', `${fontName}.woff2`)
    if (!fs.existsSync(dest)) {
      await downloadGoogleFont(fontName, dest)
    }
  }
}
```

В генерируемом HTML — всегда локальный путь:

```css
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/Montserrat.woff2') format('woff2');
}
```

---

## Realtime — лента активности

```typescript
// /components/activity/Feed.tsx
const supabase = createClient()

useEffect(() => {
  const channel = supabase
    .channel('activity')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_feed',
      filter: `workspace_id=eq.${workspaceId}`
    }, (payload) => {
      setFeed(prev => [payload.new, ...prev].slice(0, 20))
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [workspaceId])
```

---

## Middleware — защита роутов

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession(request)

  // неавторизован — на логин
  if (!session && pathname.startsWith('/(app)')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // суперадмин роут
  if (pathname.startsWith('/superadmin')) {
    if (!session?.user?.is_superadmin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // admin роут
  if (pathname.startsWith('/admin')) {
    if (!['admin', 'superadmin'].includes(session?.user?.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
}
```

---

## Dockerfile (Railway)

```dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  fonts-noto \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

CMD ["npm", "start"]
```

---

## Переменные окружения

```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
SUPERADMIN_EMAIL
```
