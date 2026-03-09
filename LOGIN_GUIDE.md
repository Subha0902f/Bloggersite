# Login & Signup Guide

## ⚠️ Important - Read This First!

The app now has **SEPARATE and CLEAR login and signup flows**:

- **LOGIN**: For accounts you've already created
- **SIGNUP**: For brand new accounts

### Common Mistake to Avoid ❌

**DON'T:** Try to "login" the first time creating an account. You must:
1. First **CREATE** the account (Sign Up)
2. Then **LOGIN** with those credentials

---

## Test Accounts (Already Created)

You can login with these accounts right now:

### Test Account 1
- Email: `test@gmail.com`
- Password: `test123`
- Username: `testuser`

### Test Account 2
- Email: `demo@gmail.com`
- Password: `demo456`
- Username: `demouser`

---

## How to Sign Up (Creating a New Account)

1. Open the app
2. You'll see the **"Welcome Back"** login screen
3. Click **"Don't have an account? Create one"**
4. Fill in:
   - Full Name
   - Username (must be unique - no one else can have this)
   - Email (used for login)
   - Password
5. Click **"Sign Up"**
6. ✅ Account created! You should be logged in automatically

---

## How to Login (Using Existing Account)

1. Open the app
2. You'll see the **"Welcome Back"** login screen
3. Enter your:
   - Email
   - Password
4. Click **"Log In"**
5. ✅ Logged in! You'll see your dashboard

---

## If Login Fails

**Error Message**: "❌ Login Failed: Email or password is incorrect."

This means:
- ❌ The email/password combo doesn't match any account
- ✅ Solution: Create an account first using Sign Up

**Error Message**: "❌ This email is already registered!"

This means:
- ❌ You already have an account with this email
- ✅ Solution: Use the Login form with the password you created when signing up

**Error Message**: "❌ Username already taken!"

This means:
- ❌ Someone else already has this username
- ✅ Solution: Choose a different username when signing up

---

## Clear Rules

✅ **DO THIS:**
1. Create account once (Sign Up)
2. Use same email/password to Login forever after

❌ **DON'T DO THIS:**
1. Keep trying to create new accounts with the same email
2. Forget which email you used to create your account

---

## Debug: Check Browser Console

Open your browser developer tools (F12) and check the console for messages like:
- `🔐 Switching to: login` or `signup`
- `📝 LOGIN FORM SUBMITTED`
- `📝 SIGNUP FORM SUBMITTED`

These help verify forms are submitting correctly.

---

## Still Having Issues?

1. **Clear your browser cache** (Ctrl+Shift+Delete on Windows)
2. **Clear cookies** for this site
3. **Close and reopen** the browser
4. Try with a fresh browser window/incognito mode
5. Check browser console for JavaScript errors
