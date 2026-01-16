# 🚀 SankatSaathi Deployment Guide

## ✅ Current Status
- All code pushed to GitHub
- API keys removed from public files
- Ready for Vercel deployment

## 📦 Deploy to Vercel

### Step 1: Deploy
```bash
vercel --prod
```

### Step 2: Add Environment Variables in Vercel Dashboard

Go to: **Project Settings → Environment Variables**

Add these variables (use your actual keys from local `.env` files):

**Backend:**
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_MAILTO`

**Frontend:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` = `/api`
- `VITE_VAPID_PUBLIC_KEY`

### Step 3: Redeploy
```bash
vercel --prod
```

## 🔍 Troubleshooting

### Location Not Working
- Check browser permissions (click lock icon in address bar)
- Allow location access
- Refresh page

### Data Not Displaying
- Open browser console (F12)
- Check for API errors
- Verify environment variables in Vercel

### Deployment Fails
- Check Vercel build logs
- Verify all environment variables are set
- Ensure no syntax errors

## 📱 Test After Deployment

1. Visit your Vercel URL
2. Check `/intelligence` for crisis dashboard
3. Check `/news` for news feed
4. Test incident reporting
5. Verify location permissions

## 🎯 Features to Test

- ✅ 3D Globe rendering
- ✅ Crisis markers displaying
- ✅ Incident reporting
- ✅ News feed loading
- ✅ Location access
- ✅ Real-time updates
- ✅ Push notifications (HTTPS only)

---

**Need help?** Check browser console for errors and Vercel logs for deployment issues.
