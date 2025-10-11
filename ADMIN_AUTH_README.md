# 🔐 Admin Authentication System

This document explains how to use the admin authentication system for the scraping functionality.

## 🎯 Overview

The admin scraping interface now requires authentication to prevent unauthorized access. Users must log in with valid credentials before accessing:

- `/admin/scraping` - Main scraping interface
- `/admin/scraping/websites` - Website management

## 🔑 Admin Access

The admin interface uses your existing Firebase authentication system. Any user with admin privileges can access the admin panel.

### **Setting Admin Privileges**

To grant admin access to a user, add their email to the `ADMIN_USERS` array in `frontend/src/app/api/admin/check-access/route.ts`:

```typescript
const ADMIN_USERS = [
    'your-admin@example.com', // Add your admin email here
    // Add more admin emails as needed
];
```

> ⚠️ **Important:** Only users in this list will have admin access to the scraping interface.

## 🚀 How It Works

### **1. Middleware Protection**
- Next.js middleware automatically protects `/admin/*` routes
- Unauthenticated users are redirected to `/admin/login`
- The original URL is preserved for post-login redirect

### **2. Firebase Integration**
- Uses your existing Firebase Authentication system
- Admin privileges checked via API call after Firebase login
- Sessions managed by Firebase Auth (automatic and secure)

### **3. Login Flow**
1. User tries to access protected admin route
2. If not logged in, redirected to Firebase login page
3. User logs in with Firebase (email/password or Google)
4. System checks if user has admin privileges
5. If admin, access granted; otherwise, access denied
6. User redirected back to originally requested page

## 📋 Usage

### **Accessing Admin Interface**

1. **Navigate to** `http://localhost:3001/admin/scraping`
2. **You'll be redirected** to your regular login page (`/login`)
3. **Log in** with your Firebase credentials (email/password or Google)
4. **If you have admin privileges**, you'll be redirected to the admin interface
5. **If not admin**, you'll see an "Access Denied" message

### **Logging Out**

- Click the **"Logout"** button in the top-right corner of admin pages
- Firebase session is cleared
- Redirected to login page

## 🔧 Configuration

### **Adding Admin Users**

Edit `frontend/src/app/api/admin/check-access/route.ts`:

```typescript
const ADMIN_USERS = [
    'your-admin@example.com', // Add your admin email here
    'another-admin@example.com', // Add more admin emails as needed
];
```

### **Firebase Configuration**

Make sure your Firebase configuration is properly set up in `frontend/src/lib/firebase.ts` with the correct environment variables.

## 🔒 Security Features

- ✅ **Firebase Authentication** (industry-standard security)
- ✅ **Admin privilege checking** (only authorized users can access)
- ✅ **Automatic redirects** for unauthorized access
- ✅ **Session management** handled by Firebase
- ✅ **Secure token-based authentication**

## 🚨 Production Considerations

### **Important Security Updates**

1. **Firebase Security Rules** - Configure proper Firebase security rules
2. **Admin User Management** - Use a proper database to store admin users instead of hardcoded arrays
3. **Rate limiting** - Implement rate limiting for admin API endpoints
4. **Audit logging** - Log admin access attempts and actions
5. **HTTPS only** in production
6. **Environment variables** for Firebase configuration

### **Environment Variables**

Make sure your Firebase environment variables are properly configured:

```bash
# Firebase configuration (already set up)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config variables
```

## 🎯 Testing

### **Test Authentication Flow**

1. **Ensure Firebase is configured** with test credentials
2. **Visit** `http://localhost:3001/admin/scraping`
3. **Should redirect** to your regular login page (`/login`)
4. **Login with Firebase** (email/password or Google)
5. **If admin user**, should access admin interface
6. **If not admin**, should see "Access Denied" message
7. **Click logout** and verify redirect to login

### **Test Admin Access**

1. **Login with a regular user** - should be denied admin access
2. **Login with an admin user** - should have admin access
3. **Test different admin emails** in the `ADMIN_USERS` array

## 📞 Troubleshooting

### **"Access Denied" Error**
- Check if your email is in the `ADMIN_USERS` array
- Verify Firebase authentication is working
- Check browser console for Firebase errors
- Ensure Firebase configuration is correct

### **"Network Error" on Login**
- Ensure Next.js server is running
- Check Firebase configuration and API keys
- Verify internet connection for Firebase services

### **Firebase Authentication Issues**
- Check Firebase project configuration
- Verify API keys and project settings
- Check Firebase console for any restrictions

---

## 🎉 **Ready to Use!**

Your admin interface is now secured with Firebase authentication. Users must log in with their Firebase credentials and have admin privileges to access the scraping functionality.

**Setup Steps:**
1. **Add admin emails** to `ADMIN_USERS` array in `check-access/route.ts`
2. **Test with your Firebase login** - regular users will be denied access
3. **Admin users** will have full access to scraping features

**Files Modified:**
- ✅ Middleware for route protection
- ✅ Admin pages with Firebase auth checks
- ✅ API routes for admin privilege verification
- ✅ Login integration with existing Firebase system

The system now seamlessly integrates with your existing Firebase authentication while providing secure admin-only access to the scraping functionality! 🔐
