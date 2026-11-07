# «Анимо» — Каталог, трекер и гид по аниме

Кинематографичный каталог и персональный трекер аниме на русском языке без пиратства, рекламы и видеоплееров.

## Стек технологий
- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript** & **Tailwind CSS v4**
- **Supabase** (PostgreSQL 17, Row Level Security, Auth, Storage) через `@supabase/ssr`

## Переменные окружения (.env.local)
Создайте файл `.env.local` на основе `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ctpesdissrutihmgghsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_ключ
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ  # Только для локальных скриптов миграции/импорта
```

## Назначение первого администратора (SQL)
После того как вы зарегистрируетесь на сайте через страницу входа/регистрации (по email), назначьте своему аккаунту роль `admin` выполнив следующую команду в SQL Editor вашего проекта Supabase:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'ваш_email@example.com'
);
```

Проверить статус роли:
```sql
SELECT id, username, role, created_at
FROM public.profiles
WHERE role = 'admin';
```
