# Citizen Assist — Final Language & Navigation Build

This version keeps the realistic Maharashtra government-service-center hero design and fixes the requested UX issues.

## Included fixes
- Header navigation is exactly: Home, Services, FAQ, About, Contact.
- Removed the duplicate/misleading “How to Apply” navigation item.
- English / Hindi / Marathi now translate the visible website interface, including navigation, homepage sections, services, guides, FAQ, About, Contact, Accessibility, footer, popup and account dialog.
- Service names use available English/Hindi/Marathi service fields.
- Search supports English, Hindi, Marathi keywords, aliases and tolerant matching.
- Search results are not hidden by stale category/persona filters when searching from the home page.
- My Account is clearly a Citizen Assist preferences/progress feature, not a government login.
- Government trust is supported through visible independent-platform disclosure, official-domain evidence and official-portal handoff.

Citizen Assist remains an independent guidance platform and does not claim to be a government website or process government applications.


## Service-count and search clarification (September 2026)
- The official Maharashtra Aaple Sarkar dashboard currently reports **1,212 notified services**, **1,083 services available on the portal**, and **38 departments**.
- Citizen Assist must not claim that its local JSON contains all 1,083 detailed guides. The current downloadable build contains the detailed local guides already present in `data/services.js` (including dedicated voter and pension guidance) and links users to the official live catalogue for the complete service set.
- The Services page explicitly labels the **1,083** figure as the official portal-available count and provides the official catalogue link.
- FAQ search now accepts a user's own wording and matches related phrases/keywords in English, Hindi and Marathi instead of requiring the exact FAQ question.
- My Account was removed because the downloadable build has no real account/login backend. Checklist and demo feedback remain browser-local.

Official sources:
- https://aaplesarkar.mahaonline.gov.in/en/CommonForm/DashBoard_Count
- https://aaplesarkar.mahaonline.gov.in/en/CommonForm/ViewAllServices

## Gemini AI chatbot setup (Netlify)
The chatbot now uses a server-side Netlify Function. The Gemini API key is **not** stored in `app.js` or any public HTML/JS file.

1. Deploy this folder to Netlify.
2. In Netlify: **Site configuration → Environment variables → Add a variable**.
3. Name: `GEMINI_API_KEY`.
4. Value: your private Gemini API key.
5. Optional: add `GEMINI_MODEL` with a Gemini model available to your account; otherwise the function defaults to `gemini-2.5-flash`.
6. Redeploy the site.

Do not put the API key in `index.html`, `app.js`, `data/services.js`, GitHub, or any public file.

### Important cost/safety note
The service search and chatbot both use the Gemini API through Netlify Functions. The browser never receives the private Gemini API key. Search also keeps the original local matching logic as a fallback if the AI endpoint is temporarily unavailable. Google free-tier quotas/rate limits apply; this is not an unlimited API. Do not enable paid billing unless you intentionally want paid API usage.


## Gemini chatbot setup
1. Deploy this folder to Netlify.
2. In Netlify, open **Site configuration → Environment variables**.
3. Add `GEMINI_API_KEY` with your private Gemini API key.
4. Trigger a new deploy.
5. Do not put the API key in `index.html` or `app.js`.

The chatbot uses `/.netlify/functions/chatbot` and smart search uses `/.netlify/functions/search`. Both use the `GEMINI_API_KEY` environment variable and default to `gemini-2.5-flash` (override with `GEMINI_MODEL` if needed). Free-tier quotas/rate limits apply.


## Fixes added in this build
- Added dedicated Voter & Electoral Services guides: new registration, EPIC correction, address change, e-EPIC download, application status, and electoral-roll search.
- Added dedicated Pension & Social Assistance guides, including old-age, widow, disability, Shravan Bal and Sanjay Gandhi Niradhar guidance.
- Added official ECI voter portal/search destinations and Maharashtra Social Justice & Special Assistance sources.
- Local chatbot fallback now gives distinct responses for greetings and thank-you messages instead of treating them identically.
- `GEMINI_MODEL` environment variable is now respected by the Netlify Function; `gemini-2.5-flash` remains the default.
