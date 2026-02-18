# Supabase Email Automation Setup

## Overview

When a user signs up via the quest form, this automatically:
1. Creates a profile in Supabase
2. Triggers an Edge Function
3. Sends a welcome email via Resend

## Setup (One-Time)

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com) → Create account
2. **API Keys** → Create new key
3. Copy the key (starts with `re_`)

### 2. Verify Your Domain (Required for Production)

In Resend dashboard:
1. **Domains** → Add Domain → `educatedtraveler.app`
2. Add the DNS records shown to your domain registrar
3. Wait for verification (usually instant)

Until verified, you can only send to your own email.

### 3. Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key as a secret
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Deploy the function
supabase functions deploy send-welcome-email
```

### 4. Create the Database Webhook

1. Go to **Supabase Dashboard** → **Database** → **Webhooks**
2. Click **Create Webhook**
3. Configure:
   - **Name:** `send-welcome-email`
   - **Table:** `profiles`
   - **Events:** `INSERT`
   - **Type:** Supabase Edge Functions
   - **Edge Function:** `send-welcome-email`
4. Save

### 5. Run the Migration

In Supabase SQL Editor, run:
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;
```

## Testing

1. Create a test user via your signup form
2. Check Supabase logs: **Edge Functions** → **send-welcome-email** → **Logs**
3. Check Resend dashboard for sent emails

## Email Sequence

The full sequence:
- **Immediate**: Welcome email (triggered by database webhook)
- **Day 3**: "Why we don't do resorts" (triggered by cron)
- **Day 7**: "The pattern I noticed" (triggered by cron)

### Deploy Follow-up Function

```bash
supabase functions deploy send-followup-emails
```

### Set Up Daily Cron Job

1. Go to **Supabase Dashboard** → **Edge Functions** → **send-followup-emails**
2. Click **Schedule** → **Enable**
3. Set cron expression: `0 9 * * *` (runs daily at 9 AM UTC)

Or use external cron (free options):
- [cron-job.org](https://cron-job.org) - Call your function URL daily
- GitHub Actions - Add a scheduled workflow

## Costs

- **Resend:** Free up to 3,000 emails/month
- **Supabase Edge Functions:** Included in free tier
- **Total:** $0 until you scale

## Files

```
supabase/
├── functions/
│   ├── send-welcome-email/
│   │   └── index.ts          # Immediate welcome email
│   └── send-followup-emails/
│       └── index.ts          # Day 3 & Day 7 emails (cron)
├── migrations/
│   └── 001_welcome_email_webhook.sql
└── README.md                 # This file
```
