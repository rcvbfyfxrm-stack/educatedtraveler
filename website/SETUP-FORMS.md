# Form Setup Guide — Google Sheets Integration

Connect the instructor form directly to Google Sheets. Free, no third-party services.

---

## Quick Setup (10 minutes)

### Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet named **"EducatedTraveler - Instructor Applications"**
3. In Row 1, add these column headers (exact spelling matters):

```
A: Timestamp
B: Name
C: Email
D: Location
E: Website
F: Discipline
G: Credentials
H: Approach
I: Excitement
J: Ideal Students
K: Locations
L: Availability
M: Additional
```

### Step 2: Add the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any code in the editor
3. Paste this entire script:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Append a new row with the form data
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.location || '',
      data.website || '',
      data.discipline || '',
      data.credentials || '',
      data.approach || '',
      data.excitement || '',
      data.ideal_students || '',
      data.locations || '',
      data.availability || '',
      data.additional || ''
    ]);

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Required for CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (Ctrl/Cmd + S)
5. Name the project: "Instructor Form Handler"

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: "Instructor form handler"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Click **Authorize access** → Choose your Google account → Allow
6. **Copy the Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step 4: Update the Website

1. Open `website/instructors.html`
2. Find this line near the bottom:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
   ```
3. Replace with your actual URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Save and deploy

---

## Testing

1. Open your instructor page
2. Fill out the form with test data
3. Submit
4. Check your Google Sheet — new row should appear within seconds

---

## Email Notifications (Optional)

Want an email when someone submits? Add this to your Apps Script:

```javascript
function sendNotification(data) {
  const recipient = 'your-email@example.com';
  const subject = 'New Instructor Application: ' + data.name;
  const body = `
New instructor application received:

Name: ${data.name}
Email: ${data.email}
Discipline: ${data.discipline}
Location: ${data.location}

Credentials: ${data.credentials}

Teaching Approach: ${data.approach}

View all applications: [Your Sheet URL]
  `;

  MailApp.sendEmail(recipient, subject, body);
}
```

Then add this line inside the `doPost` function, after `sheet.appendRow(...)`:
```javascript
sendNotification(data);
```

---

## Troubleshooting

### Form submits but no data appears
- Check that column headers match exactly (case-sensitive)
- Make sure the script is deployed as "Anyone" can access
- Check Apps Script execution logs: Extensions → Apps Script → Executions

### "Script authorization required" error
- You need to re-authorize after making script changes
- Go to Apps Script → Deploy → Manage deployments → Edit → Deploy

### Want to update the script?
1. Make changes in Apps Script editor
2. Deploy → Manage deployments
3. Click edit (pencil icon) on your deployment
4. Change version to "New version"
5. Click Deploy

---

## Security Notes

- The form URL is public, but data goes to YOUR private sheet
- Only you can see the spreadsheet (unless you share it)
- Consider adding rate limiting if you get spam (rare for niche forms)
- The script runs under your Google account quota (generous free tier)

---

## Form Fields Reference

| Field | Column | Description |
|-------|--------|-------------|
| Timestamp | A | Auto-generated submission time |
| Name | B | Full name |
| Email | C | Contact email |
| Location | D | City, Country |
| Website | E | Portfolio or Instagram |
| Discipline | F | Teaching specialty |
| Credentials | G | Certifications and experience |
| Approach | H | Teaching philosophy |
| Excitement | I | Why they want to join |
| Ideal Students | J | Who they love teaching |
| Locations | K | Where they want to teach |
| Availability | L | 2026 availability |
| Additional | M | Other notes |

---

*Simple setup. Zero maintenance. All your data in one place.*
