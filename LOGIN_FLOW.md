# 📊 LOGIN FLOW DIAGRAM

## Correct Flow Paths

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP STARTS                              │
│                   User Not Logged In                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    Display "Welcome Back" Screen
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          ┌─────────▼─────────┐     ┌──────────▼──────────┐
          │  Have an account? │     │ First time here?    │
          │   Click Log In    │     │ Click Sign Up       │
          └─────────┬─────────┘     └──────────┬──────────┘
                    │                           │
        ┌───────────▼────────────┐   ┌─────────▼─────────┐
        │  Enter Email/Password  │   │ Fill Signup Form: │
        │  Click "Log In"        │   │ - Full Name       │
        └───────────┬────────────┘   │ - Username        │
                    │                │ - Email           │
        ┌───────────▼────────────┐   │ - Password        │
        │ Is combo in database? │   │ Click "Sign Up"   │
        └───────────┬────────────┘   └─────────┬─────────┘
                    │                           │
          ┌─────────┴─────────┐       ┌─────────▼───────────┐
          │                   │       │ Email/Username      │
          │ YES               │ NO    │ already exist?      │
          │                   │       │                     │
      ┌───▼───┐           ┌───▼───┐  │  YES     │   NO     │
      │ ✅    │           │ ❌    │  │  ❌      │   ✅     │
      │LOGIN  │           │SHOW  │  │ ERROR    │ CREATE   │
      │ ✅    │           │ERROR │  │ MSG      │ ACCOUNT  │
      │       │           │      │  │          │ ✅       │
      └───┬───┘           └───┬───┘  └────┬──────┴──────────┘
          │                   │          ┌─▼─────┐
          │                   │          │ ✅    │
          │                   │          │LOGIN  │
          │                   │          │ ✅    │
          │                   │          └───┬───┘
          │                   │              │
          │    "Show me       │   "Click     │
          │    what went      │   'Already   │
          │    wrong..."      │   have an    │
          │       │           │   account'   │
          │       │           │       │      │
          │       └─────┬─────┴───────┘      │
          │             │                    │
          │          ┌──▼──────┐            │
          │          │ Show    │            │
          │          │ Error   │            │
          │          │ Message │            │
          │          │  with   │            │
          │          │ helpful │            │
          │          │ action  │            │
          │          └─────────┘            │
          │                                  │
          └──────────┬───────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   Dashboard Loaded     │
         │   User is Logged In ✅ │
         └────────────────────────┘
```

---

## Decision Points

### At Login Form
**User Asks Themselves:**
- "Do I already have an account?" 
  - ✅ YES → Stay here and Log In
  - ❌ NO → Click "Don't have an account? Create one"

### At Signup Form
**User Asks Themselves:**
- "Do I already have an account?"
  - ✅ YES → Click "Already have an account? Log in"
  - ❌ NO → Stay here and Sign Up

### When Login Fails
**The Error Message Tells You:**
```
❌ Email or password is incorrect.

If you don't have an account yet, click 
"Don't have an account? Create one"
```
**So User Should:**
1. Go back to signup
2. Create account first
3. Then come back to login

### When Email Exists
**The Error Message Tells You:**
```
❌ This email is already registered!

You already have an account with this email. 
Click "Already have an account? Log in" to sign in.
```
**So User Should:**
1. Remember their password
2. Go back to login
3. Enter their password

---

## State Machine (Technical)

```
               ┌──────────────┐
               │ NO SESSION   │
               │ (Not Logged) │
               └──────┬───────┘
                      │
        LOGIN SUCCESS  │  SIGNUP SUCCESS
              │        │        │
              │        │        │
              ▼        │        ▼
         ┌─────────────┴─────────────┐
         │     ✅ SESSION ACTIVE     │
         │        (Logged In)        │
         │   Can Access Dashboard    │
         └─────────────┬─────────────┘
                       │
                       │ LOGOUT
                       ▼
               ┌──────────────┐
               │ NO SESSION   │
               │ (Not Logged) │
               └──────────────┘
```

---

## Troubleshooting Flow

```
Issue: Login creates NEW account instead of logging in
└─ Cause: User didn't realize they need to create account first
└─ Solution: 
   1. Create new account (Sign Up)
   2. Then use same email/password to Log In
   3. Error messages should now make this clear

Issue: Keep getting "email already registered"
└─ Cause: Trying to create account with email that already exists
└─ Solution:
   1. Click "Already have an account? Log in"
   2. Enter the password you used when creating that account
   3. Should log in successfully

Issue: "Username already taken"
└─ Cause: Someone else has that username
└─ Solution:
   1. Choose a different username when signing up
   2. Each username must be unique

Issue: Can't login even with correct email/password
└─ Cause: Account not created yet, or password mistyped
└─ Solution:
   1. Double-check spelling and capitalization
   2. If sure it's correct, create new account instead
   3. Check browser console for error logs
```

---

## Simple Rule

```
┌────────────────────────────────────────┐
│  ONE ACCOUNT = ONE EMAIL/PASSWORD     │
│  CREATE ONCE → USE FOREVER           │
│  NO DUPLICATE ACCOUNTS!              │
└────────────────────────────────────────┘
```

- 🔐 Create with: Email + Password + Username
- 🔐 Login with: Email + Password (that's it!)
- ❌ Don't create new account with same email
- ❌ Don't forgot which email/password you used
