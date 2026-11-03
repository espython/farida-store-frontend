# Google sign-in: setting up the OAuth client

The code is in place (A2 #243, W5 #230). Google sign-in stays **off** (no button anywhere) until the two
variables below are set. Do this once for local development, and again for production once the domain
(W1) and the privacy page (F5) exist.

## 1. Create the OAuth client (Google Cloud Console)

1. Go to <https://console.cloud.google.com/>, create a project named e.g. **Farida Stores**.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding):
   - User type **External**.
   - App name **Farida Stores**, support email, logo (optional), developer contact email.
   - Scopes: only `openid`, `email`, `profile` (the defaults; nothing sensitive, so no Google review).
   - For production: app home page, **privacy policy URL** (the F5 privacy page) and the authorised
     domain (the shop's domain). While testing, leave the app in **Testing** and add your own Google
     account(s) under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type **Web application**, name e.g. "Storefront".
   - **Authorised redirect URIs** — exactly (scheme, host, port, path):
     - local: `http://localhost:3111/api/auth/google/callback` (and `http://localhost:3000/...` if you use `npm run dev`)
     - production: `https://<shop domain>/api/auth/google/callback`
   - Authorised JavaScript origins: not needed (the browser never talks to Google's APIs directly).
4. Copy the **Client ID** and **Client secret**.

## 2. Configure the storefront

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | storefront env | Public (it is in Google's sign-in URL anyway). Read at **build** time: rebuild after setting it. |
| `GOOGLE_CLIENT_SECRET` | storefront env, **server only** | Never `NEXT_PUBLIC_`, never in the repo, chat or tickets. Keep it in the password manager. |
| `NEXT_PUBLIC_SITE_URL` | storefront env | Must match the redirect URI's origin (it builds `…/api/auth/google/callback`). |

Locally, put them in `infra/woo-staging/.env.local` (gitignored) and pass them to the dev server like
the Woo keys (see the README's "How to resume").

## 3. Check

1. Open `/en/login`: a **Continue with Google** button appears.
2. Sign in with a test user: you come back signed in; WordPress shows the customer with the
   `farida_google_sub` meta and **Email verified** set.
3. Production: publish the consent screen (Testing → In production) once the privacy page is live.

If a secret leaks: Credentials → the client → **Reset secret**, update the server env, redeploy.
