# AcademicLink - Deployment Guide

## 🚀 Production URLs

- **Frontend**: https://academic-link-henna.vercel.app
- **Backend API**: https://academiclink-backend.onrender.com
- **GitHub Repo**: https://github.com/gyashri/AcademicLink

## 📦 Tech Stack

### Backend
- **Hosting**: Render (Free tier)
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary
- **Payment**: Razorpay (Test mode)
- **AI**: Google Gemini

### Frontend
- **Hosting**: Vercel
- **Framework**: Next.js 15
- **Styling**: Tailwind CSS v4

## 🔧 Environment Variables

### Backend (Render)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
GEMINI_API_KEY=<your-gemini-key>
CLIENT_URL=https://academic-link-henna.vercel.app
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://academiclink-backend.onrender.com/api
```

## 🔄 Deployment Process

### Backend (Render)
1. Push changes to GitHub `main` branch
2. Render auto-deploys from GitHub
3. Build command: `npm install --include=dev && npm run build`
4. Start command: `npm start`

### Frontend (Vercel)
1. Push changes to GitHub `main` branch
2. Vercel auto-deploys from GitHub
3. Root directory: `frontend`
4. Framework: Next.js

## 📝 Important Notes

1. **Free Tier Limitations**:
   - Render free tier: Backend sleeps after 15 min of inactivity (first request may be slow)
   - MongoDB Atlas free tier: 512MB storage
   - Cloudinary free tier: 25GB storage, 25GB bandwidth/month

2. **Security**:
   - All secrets are stored as environment variables
   - `.env` files are gitignored
   - JWT secrets should be rotated for production

3. **CORS**:
   - Backend accepts requests only from the frontend URL
   - Update `CLIENT_URL` if frontend URL changes

4. **File Uploads**:
   - Uses Cloudinary in production
   - Falls back to local storage in development

## 🐛 Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify MongoDB Atlas connection string
- Ensure all environment variables are set

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` includes `/api` path
- Check CORS settings on backend
- Verify backend is running (not sleeping)

### File uploads failing
- Verify Cloudinary credentials
- Check Cloudinary dashboard for quota limits

## 📞 Support

For issues, check:
- Render logs: Dashboard → Logs
- Vercel logs: Deployment → View Function Logs
- MongoDB Atlas: Database Access & Network Access
