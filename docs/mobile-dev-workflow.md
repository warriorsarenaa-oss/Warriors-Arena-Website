# Mobile Development Workflow — Mac + iPhone + Antigravity

> How to see your Next.js app on your iPhone while vibe-coding on your MacBook with Antigravity.

---

## The Setup You Have

- **MacBook** — Running Antigravity, VS Code, terminal
- **iPhone** — Your test device for booking flow, mobile UX
- **Network** — Both devices on the same Wi-Fi (critical)

**Goal:** Type URL on iPhone → see live dev server from Mac, with hot reload.

---

## Method 1: Local Network Access (Simplest, Free)

### How It Works
Your Mac runs `npm run dev` on `localhost:3000`. Your iPhone accesses it via your Mac's local IP address on the same Wi-Fi network.

### Step-by-Step

#### 1. Find Your Mac's Local IP Address

```bash
# On Mac terminal:
ipconfig getifaddr en0
# Output example: 192.168.1.45
```

**Alternative (if en0 doesn't work):**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for the 192.168.x.x address
```

#### 2. Configure Next.js to Accept External Connections

By default, Next.js dev server only listens on `localhost`. We need to bind to `0.0.0.0`.

**Edit `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

Or run directly:
```bash
npm run dev -- -H 0.0.0.0
```

#### 3. Start the Dev Server

```bash
npm run dev
```

You'll see:
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Network:      http://192.168.1.45:3000
```

#### 4. Open on iPhone

On your iPhone (connected to **same Wi-Fi**):
1. Open Safari
2. Type: `http://192.168.1.45:3000` (use your actual IP)
3. Bookmark it or add to Home Screen for quick access

**Done.** Changes you make in Antigravity/code → save → auto-reload on iPhone.

---

### Troubleshooting

**Problem: "Can't connect" or timeout on iPhone**

Check:
1. Both devices on same Wi-Fi? (not iPhone on cellular + Mac on Wi-Fi)
2. Mac firewall blocking? 
   - System Settings → Network → Firewall → Off (temporarily for testing)
   - Or: Add firewall rule allowing port 3000
3. Try pinging Mac from iPhone:
   - Install Network Analyzer app on iPhone
   - Ping 192.168.1.45 → should respond

**Problem: Hot reload not working on iPhone**

Next.js uses WebSocket for hot reload. Some routers block it.
- Try adding `?no-ws=1` to URL: `http://192.168.1.45:3000?no-ws=1`
- Manual refresh after changes if hot reload fails

**Problem: HTTPS required (e.g., for camera, geolocation APIs)**

Local network is HTTP. For HTTPS, jump to Method 2 (Ngrok) below.

---

## Method 2: Ngrok Tunnel (For HTTPS or Remote Testing)

### When You Need This
- Testing HTTPS-required features (camera, WebRTC, PWA)
- Showing client a preview from their phone (not on your Wi-Fi)
- Turnstile/reCAPTCHA testing (some require real domains)

### How It Works
Ngrok creates a public HTTPS URL that tunnels to your `localhost:3000`. Works from anywhere.

### Step-by-Step

#### 1. Install Ngrok

```bash
brew install ngrok
```

Or download from: https://ngrok.com/download

#### 2. Sign Up for Free Account

https://dashboard.ngrok.com/signup

Free tier: 1 online tunnel, 40 connections/min (plenty for dev).

#### 3. Connect Your Account

```bash
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
# Get token from: https://dashboard.ngrok.com/get-started/your-authtoken
```

#### 4. Start Next.js Dev Server (Normal)

```bash
npm run dev
# Runs on localhost:3000
```

#### 5. Start Ngrok Tunnel

**In a separate terminal tab:**
```bash
ngrok http 3000
```

Output:
```
Session Status   online
Forwarding       https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

#### 6. Open on iPhone

Copy the `https://abc123xyz.ngrok-free.app` URL. Open in Safari on iPhone.

**First visit:** Ngrok shows an interstitial "Are you sure?" page (anti-abuse). Click "Visit Site." Only happens once per session.

**Done.** Now you have a real HTTPS URL accessible from anywhere.

---

### Ngrok Tips

**Custom subdomain (paid, $8/mo):**
```bash
ngrok http 3000 --subdomain warriors-arena
# URL: https://warriors-arena.ngrok.io
```

**Keep URL stable across restarts:**
Free tier changes URL every time you restart ngrok. Paid tier lets you reserve subdomains.

**Sharing with client:**
Send them the ngrok URL. They can test the live booking flow on their device from anywhere.

**Disable interstitial:**
Can't disable on free tier. Upgrade to Basic ($8/mo) to remove.

---

## Method 3: Vercel Preview Deploys (Best for Client Testing)

### When You Need This
- Client wants to test on their phone without downloading anything
- You want a stable URL that doesn't change every session
- Testing on production-like environment (not just `localhost`)

### How It Works
Every git push to a feature branch auto-deploys to Vercel Preview. Gets a unique URL like:
`https://warriors-arena-git-feature-branch-yourusername.vercel.app`

### Step-by-Step

#### 1. Commit Your Code

```bash
git add .
git commit -m "Add booking wizard step 4"
git push origin feature/booking-wizard
```

#### 2. Wait 2-3 Minutes

Vercel detects the push, builds, deploys. Check:
- Vercel Dashboard → Deployments
- Or GitHub PR comment (if you opened a PR)

#### 3. Get the URL

Vercel dashboard shows: `https://warriors-arena-git-feature-booking-wizard-yourusername.vercel.app`

#### 4. Open on iPhone

Send URL via iMessage/WhatsApp to yourself. Open in Safari.

**Bonus:** Link persists until you delete the branch. Share with client for testing.

---

### Preview Deploy Tips

**Environment variables:**
Preview deploys use the "Preview" scope env vars you set in Vercel settings. Make sure they're set (usually staging Supabase, test Meta Pixel).

**Auto-updates:**
Every new push to the same branch updates the same preview URL. Client can refresh to see latest.

**HTTPS by default:**
Vercel always serves HTTPS. No ngrok needed.

**Cost:**
Free tier: 100GB bandwidth. Unlimited preview deploys.

---

## Method 4: Xcode Simulator (If You Don't Have iPhone Handy)

### When You Need This
- Testing iOS Safari behavior
- No physical iPhone available
- Testing different screen sizes (iPhone SE, Pro Max, etc.)

### Step-by-Step

#### 1. Install Xcode (Free, 12GB download)

App Store → Xcode → Install

Or download from: https://developer.apple.com/xcode/

#### 2. Launch Simulator

```bash
open -a Simulator
```

Or: Xcode → Xcode → Open Developer Tool → Simulator

#### 3. Choose Device

File → Open Simulator → iPhone 15 Pro (or any model)

#### 4. Open Safari in Simulator

Tap Safari icon → address bar → type `http://localhost:3000`

**Done.** Behaves like real iPhone Safari.

---

### Simulator Tips

**Paste URL:**
Edit → Paste (or Cmd+V) works to paste `localhost:3000` from Mac clipboard.

**Screenshot:**
Cmd+S or File → Screenshot

**Rotate:**
Cmd+Left/Right arrow to test landscape

**Different devices:**
File → Open Simulator → iPad, iPhone SE, etc.

**Network conditions:**
Debug → Network Link Conditioner → 3G, 4G, Wi-Fi

**Limitations:**
- No camera (shows black screen)
- No Face ID (falls back to passcode)
- Performance faster than real devices (don't trust animation smoothness)

---

## Recommended Workflow for Warriors Arena

### During Sprint 3-4 (Landing + Booking Wizard)

**Primary:** Method 1 (Local Network)
- Mac IP + iPhone Safari
- Hot reload works
- Fast, zero config

**Test key paths:**
- Open `/en/book` on iPhone
- Complete full booking flow tapping on glass
- Check RTL on `/ar`
- Verify animations perform well on real device

### During Sprint 8 (Launch Prep)

**Primary:** Method 3 (Vercel Preview)
- Push `feature/final-polish` branch
- Send preview URL to Youssef's iPhone
- He tests booking flow on his actual device with his actual WhatsApp
- You fix bugs → push → he refreshes

**Fallback:** Method 2 (Ngrok) if you need to test Meta Pixel live events or Turnstile.

---

## iPhone Safari DevTools (Inspect Element on Mobile)

### Setup

#### 1. Enable Web Inspector on iPhone

Settings → Safari → Advanced → Web Inspector → On

#### 2. Connect iPhone to Mac via USB

Use Lightning or USB-C cable.

#### 3. Trust This Computer

iPhone shows prompt → Trust → enter passcode

#### 4. Open Site on iPhone

Safari → `http://192.168.1.45:3000` (or ngrok URL)

#### 5. Open Safari DevTools on Mac

Safari (on Mac) → Develop → [Your iPhone Name] → [Page Title]

**Done.** Full DevTools: Console, Elements, Network, like Chrome but for iPhone Safari.

---

### DevTools Tips

**View console errors:**
Console tab shows all JavaScript errors from iPhone.

**Inspect element:**
Hover in Elements panel → highlights on iPhone screen.

**Network waterfall:**
Network tab shows requests, timing (critical for performance debugging).

**Responsive mode is NOT the same:**
Safari's responsive design mode (Cmd+Opt+R) on Mac is an approximation. Real device testing catches more bugs (especially touch events, scroll behavior).

---

## Testing Checklist (Mobile-Specific)

Before declaring a sprint done, test these on real iPhone:

- [ ] Booking flow works from start to finish (no tap misses, no scroll jank)
- [ ] Form inputs auto-capitalize correctly (name field)
- [ ] Phone number keyboard shows (type="tel" attribute)
- [ ] Buttons are thumb-sized (44×44px minimum)
- [ ] No horizontal scroll on 375px width (iPhone SE)
- [ ] Cards/images load fast on 4G (use throttling in DevTools)
- [ ] Arabic RTL layout correct (text aligns right, buttons flip)
- [ ] Long press doesn't show "Copy Link" on non-link elements
- [ ] Date picker is native iOS picker (better UX than custom)
- [ ] WhatsApp deep link opens WhatsApp app (not web version)
- [ ] PDF download works (receipt)
- [ ] Animations don't stutter (60fps or disable on low-end)

---

## Common Mobile Gotchas

**Viewport height (vh) issues:**
```css
/* Don't use 100vh — mobile browsers' address bar changes height */
min-height: 100vh; /* Bad on mobile */

/* Use instead: */
min-height: 100dvh; /* Dynamic viewport height, adjusts for address bar */
```

**Touch targets too small:**
```css
/* Minimum 44×44px per Apple guidelines */
.button {
  min-width: 44px;
  min-height: 44px;
  /* Or use padding to expand hit area */
  padding: 12px 24px;
}
```

**Zoom on input focus:**
```html
<!-- If font-size < 16px, iOS zooms in on focus -->
<input type="text" style="font-size: 16px;" /> <!-- Prevents zoom -->
```

**Scroll momentum:**
```css
/* Enable smooth inertia scrolling */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

**Active states don't work:**
```css
/* Use :active pseudo-class, but also add explicit 'ontouchstart' */
.button:active {
  background: var(--warriors-green);
}
```

**Fixed positioning + keyboard:**
When iPhone keyboard opens, `position: fixed` elements can behave weirdly. Test the booking wizard's sticky price summary when keyboard is open.

---

## Quick Reference

| Method | URL | HTTPS | Hot Reload | Best For |
|--------|-----|-------|------------|----------|
| Local Network | `http://192.168.1.x:3000` | ❌ | ✅ | Daily dev |
| Ngrok | `https://abc.ngrok-free.app` | ✅ | ✅ | Secure APIs |
| Vercel Preview | `https://warriors-arena-git-x.vercel.app` | ✅ | ❌ (push to update) | Client testing |
| Xcode Simulator | `http://localhost:3000` | ❌ | ✅ | No iPhone handy |

---

*End of Mobile Dev Workflow Guide*
