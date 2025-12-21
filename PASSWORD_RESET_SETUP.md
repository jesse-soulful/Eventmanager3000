# Password Reset Feature - Setup & Troubleshooting

## Understanding the Errors

### Error 1: `ERR_CONNECTION_REFUSED` on `/api/auth/get-session`
**Cause**: The backend server is not running.

**Solution**:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

   The server should start on port 3001 (or the port specified in your `.env` file).

### Error 2: `500 Internal Server Error` on `/api/password-reset/request`
**Possible Causes**:
1. **Prisma Client not regenerated**: After adding the `PasswordResetToken` model, Prisma Client needs to be regenerated.
2. **Database migration not applied**: The migration needs to be run.
3. **Email service error**: If SMTP is not configured, this should not cause a 500 error, but let's verify.

**Solutions**:

#### Step 1: Regenerate Prisma Client
```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" npx prisma generate
```

#### Step 2: Verify Migration is Applied
```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate status
```

If migrations are pending, run:
```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
```

#### Step 3: Check Backend Logs
When you make a password reset request, check the backend console for detailed error messages. The error logging has been enhanced to show:
- Error message
- Error stack trace
- Error name

## Email Configuration (Optional for Development)

The password reset feature works **without SMTP configuration** in development. The reset tokens are still created and stored in the database. You can:

1. **Check the backend console** - The reset token will be logged when SMTP is not configured
2. **Use the token directly** - Copy the token from the console and use it in the reset URL

### To Enable Email Sending (Production)

Add these environment variables to your `.env` file:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
FRONTEND_URL=https://your-frontend-url.com
```

## Testing the Password Reset Flow

### Method 1: Direct Password Reset (No Token Needed)
**Fastest method** - Directly reset the password without generating a token:

```bash
cd backend
npm run reset-password <email> <newPassword>
```

Example:
```bash
npm run reset-password jesse@soulfulsessions.be newpassword123
```

### Method 2: Generate Reset Token (Use Frontend UI)
1. Start the backend server: `cd backend && npm run dev`
2. Request password reset from the frontend (click "Forgot password?" on login page)
3. **Check backend console logs** - The reset token and URL will be displayed
4. Copy the reset URL from the console and open it in your browser
5. Or check the API response in browser DevTools (Network tab) - token is included when SMTP is not configured

### Method 3: Generate Reset Token via Script
**Create a reset token manually** using the script:

```bash
cd backend
npm run create-reset-token <email>
```

Example:
```bash
npm run create-reset-token jesse@soulfulsessions.be
```

This will output:
- The reset token
- The complete reset URL
- Instructions on how to use it

Then open the reset URL in your browser or use the token with the frontend reset page.

### With Email (Production)
1. Configure SMTP environment variables
2. Request password reset from the frontend
3. Check your email inbox for the reset link
4. Click the link to reset your password

## Common Issues

### Issue: "PasswordResetToken model not found"
**Fix**: Regenerate Prisma Client:
```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" npx prisma generate
```

### Issue: "Migration not applied"
**Fix**: Run migrations:
```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
```

### Issue: Backend server won't start
**Check**:
1. Is `DATABASE_URL` set in your environment?
2. Does the database file exist?
3. Are all dependencies installed? (`npm install`)

### Issue: Email not sending
**Note**: This is expected in development if SMTP is not configured. The feature still works - tokens are created and can be used manually.

## Quick Start Checklist

- [ ] Backend server is running (`npm run dev` in backend directory)
- [ ] Prisma Client is regenerated (`npx prisma generate`)
- [ ] Migrations are applied (`npx prisma migrate dev`)
- [ ] Frontend is running (`npm run dev` in frontend directory)
- [ ] (Optional) SMTP is configured for email sending

## Need Help?

Check the backend console logs for detailed error messages. The enhanced error logging will help identify the exact issue.

