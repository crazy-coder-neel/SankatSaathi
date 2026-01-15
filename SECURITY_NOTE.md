# 🔐 SECURITY NOTICE

## ⚠️ IMPORTANT: API Keys Removed

All API keys and secrets have been removed from documentation files for security.

## 🔑 Required Environment Variables

You need to set these in your Vercel dashboard:

### Backend Variables:
```
GEMINI_API_KEY=<your-gemini-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_MAILTO=mailto:<your-email>
```

### Frontend Variables:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

## 📝 Where to Get Keys

1. **GEMINI_API_KEY**: Google AI Studio (https://makersuite.google.com/app/apikey)
2. **SUPABASE**: Your Supabase project settings
3. **VAPID Keys**: Generate with `python backend/generate_vapid.py`

## ⚠️ Never Commit

- `.env` files
- API keys
- Private keys
- Secrets

These should only be in:
- Local `.env` files (gitignored)
- Vercel environment variables dashboard
