# Form Setup Guide

## Instructor Application Form (Formspree)

### Step 1: Create Formspree Account (2 min)

1. Go to **https://formspree.io**
2. Click **Get Started** or **Sign Up**
3. Sign up with your email (free tier allows 50 submissions/month)

### Step 2: Create Your Form (1 min)

1. Once logged in, click **+ New Form**
2. Name it: `Instructor Applications`
3. Click **Create Form**
4. You'll see your form endpoint, something like:
   ```
   https://formspree.io/f/xyzabcde
   ```
5. Copy the form ID (the part after `/f/` — e.g., `xyzabcde`)

### Step 3: Update the HTML (30 sec)

Open `website/instructors.html` and find this line (around line 166):

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" class="space-y-8">
```

Replace `YOUR_FORM_ID` with your actual form ID:

```html
<form action="https://formspree.io/f/xyzabcde" method="POST" class="space-y-8">
```

### Step 4: Test It

1. Deploy the updated `instructors.html`
2. Fill out the form yourself
3. Check your email — you should receive the submission
4. Also visible in your Formspree dashboard

---

## Where Submissions Go

- **Email**: Formspree sends each submission directly to your registered email
- **Dashboard**: All submissions are also stored at formspree.io/forms
- **Export**: You can export submissions as CSV from the dashboard

---

## Optional: Email Notifications

In your Formspree dashboard, you can:
- Add additional email recipients
- Customize the email subject line
- Set up auto-responses to applicants

---

## Form Fields Being Captured

The instructor form collects:

| Field | Name Attribute | Required |
|-------|----------------|----------|
| Name | `name` | Yes |
| Email | `email` | Yes |
| Location | `location` | No |
| Website/Instagram | `website` | No |
| Discipline | `discipline` | No |
| Credentials | `credentials` | No |
| Teaching approach | `approach` | No |
| What excites them | `excitement` | No |
| Ideal students | `ideal_students` | No |
| Locations interested | `locations[]` | No |
| Availability | `availability` | No |
| Additional notes | `additional` | No |

---

## Troubleshooting

**Form not submitting?**
- Check that the form ID is correct
- Make sure you're on HTTPS (Formspree requires it)
- Check browser console for errors

**Not receiving emails?**
- Check spam folder
- Verify email in Formspree dashboard
- Free tier has 50 submissions/month limit

---

## Alternative: Link to Google Form Instead

If you prefer Google Forms (like your customer survey), you can:

1. Create a Google Form with the same questions
2. Replace the entire `<form>...</form>` section with:

```html
<div class="text-center">
    <a href="YOUR_GOOGLE_FORM_URL" target="_blank"
       class="inline-block py-4 px-8 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition-colors">
        Fill Out the Form
    </a>
    <p class="text-slate-500 text-xs mt-4">Opens in a new tab. We'll get back to you within a week.</p>
</div>
```

This matches how your customer survey works.
