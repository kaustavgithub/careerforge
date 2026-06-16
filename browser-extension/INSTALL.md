# CareerForge Browser Extension

Adds a **⚡ Save to CareerForge** button on LinkedIn job pages. One click extracts the job details and sends them to your CareerForge portal — cover letter and CV tweaks are generated instantly.

## Install

1. Clone or download the repo so you have the `browser-extension/` folder locally.
2. Open Chrome (or Edge) and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle, top-right).
4. Click **Load unpacked** and select the `browser-extension/` folder.

The CareerForge icon will appear in your browser toolbar.

## Configure

1. Open your CareerForge portal and log in.
2. Go to **Dashboard** → scroll to **LinkedIn Browser Extension** → click **Copy API Token**.
3. Click the CareerForge extension icon in the toolbar.
4. Fill in:
   - **CareerForge URL** — e.g. `https://careerforge.yourdomain.com` (no trailing slash)
   - **API Token** — paste what you copied in step 2
5. Click **Save**. The extension will verify it can reach your portal before saving.

## Use

1. Go to [linkedin.com/jobs](https://www.linkedin.com/jobs) and log in with your LinkedIn account.
2. Open any job listing.
3. An **⚡ Save to CareerForge** button appears near the top of the job detail panel.
4. Click it — the extension reads the job title, company, location, and full description from the page and sends them to CareerForge.
5. CareerForge scores the match against your profile, generates a cover letter, and suggests CV tweaks — all in one call.
6. Open the **Jobs** page in CareerForge to review the result, copy the cover letter, and update the application status.

## Notes

- Your LinkedIn login stays entirely in your browser — the extension never touches your LinkedIn credentials.
- The extension only reads content that is already visible on the page (title, company, description). It does not store or transmit anything to LinkedIn.
- If the **⚡ Save to CareerForge** button does not appear, scroll down slightly to let LinkedIn finish rendering the job panel, then try again.
- Tokens expire after 7 days by default (configurable via `JWT_EXPIRE_MINUTES` in your `.env`). Return to the Dashboard to copy a fresh token when needed.
- Works on Chrome and any Chromium-based browser (Edge, Brave, Arc).
