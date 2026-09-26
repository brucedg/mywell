# Mywell -- Implementation Plan

**Stack:** Expo SDK 55, Expo Router v4, React Native (New Architecture), TypeScript strict
**Target:** iOS 16+ / Android 10+ (API 29+)
**Build:** EAS Build + EAS Submit

---

## Stack decision (reached before build started)

**Not a web PWA.** iOS PWA limitations make it inappropriate for a safety app:
- iOS can cold-start a PWA after backgrounding (2-3 second reload in an emergency)
- iOS can silently wipe PWA local storage when device storage is low
- `navigator.share()` does not pre-select a recipient

**Not Next.js.** SSR framework with no server = fighting the framework.

**Expo (React Native):** real native app on iOS + Android, biometric auth via a single API,
deep links to messaging apps work reliably, EAS builds an APK link for Android testers with
no accounts required, TestFlight for iOS testers ($99/yr Apple Developer account).

**Distribution:**
- Dev: Expo Go + QR code (no accounts needed, works on any phone on same wifi or tunnel)
- Android testers: EAS Build produces APK, share link, enable "install from unknown sources"
- iOS testers: EAS Build + TestFlight, invite by email

---

## 1. Dependencies

| Package | Version | Why |
|---|---|---|
| `expo` | ~55.0.0 | Latest stable; ships RN 0.78, New Architecture on by default |
| `expo-router` | ~4.0.0 | File-based routing, Stack.Protected for auth guards |
| `expo-secure-store` | ~14.x | iOS Keychain / Android Keystore -- encrypted contact storage |
| `expo-local-authentication` | ~14.x | Face ID, Touch ID, fingerprint + PIN fallback |
| `expo-linking` | bundled | openURL() for all messaging deep links |
| `expo-font` | bundled | Inter typeface |
| `@expo/vector-icons` | bundled | Icons without extra native deps |
| `react-native-reanimated` | ~3.x | Press animation on emergency button |
| `react-native-markdown-display` | latest | Render guide content -- no web view |

No network client. Zero outbound HTTP requests.

---

## 2. Navigation Structure (Expo Router file conventions)

```
app/
  _layout.tsx              # Root layout -- fonts, status bar, NavigationContainer
  index.tsx                # Home screen (NO AUTH) -- alert button + guide grid
  (protected)/
    _layout.tsx            # Stack.Protected -- biometric guard before entry
    contacts/
      index.tsx            # Contact list
      add.tsx              # Add contact
      [id].tsx             # Edit / delete contact
    settings/
      index.tsx            # Alert message text, preferred platform
  guides/
    _layout.tsx            # Stack, no auth
    [category].tsx         # Category page (driven by static content)
    [category]/
      [guide].tsx          # Individual guide
```

Key rules:
- `app/index.tsx` is outside every protected group -- always accessible
- Guides are outside `(protected)/` -- information is the safety net
- `(protected)` folder name uses parentheses so it adds no URL segment

---

## 3. Data Model (SecureStore)

SecureStore has a 2 KB per-value limit. Contacts are stored individually to stay under it.

```
mywell.contact.index     -> ["id1","id2","id3"]   (~100 bytes)
mywell.contact.<id>      -> single Contact JSON    (~300 bytes each)
mywell.settings          -> AppSettings JSON       (~150 bytes)
```

```typescript
type MessagingPlatform = 'sms' | 'whatsapp' | 'messenger' | 'instagram';

interface Contact {
  id: string;               // uuid v4
  name: string;
  phone: string;            // E.164 e.g. "+6421123456"
  instagramHandle?: string; // instagram only
  messengerUserId?: string; // Facebook numeric ID -- V1 limited, see §6
  platforms: MessagingPlatform[];
  isBuddy: boolean;         // only one contact can have isBuddy: true
  createdAt: string;        // ISO 8601
}

interface AppSettings {
  alertMessage: string;     // user-editable, default below
  preferredPlatform: MessagingPlatform;
  onboardingComplete: boolean;
}
```

Default alert message: `"Hi, I need some help right now. Please check in on me."`

All data keyed with `keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY` --
deliberately excluded from iCloud Keychain sync.

---

## 4. Security Model

| Screen | Auth required | Rationale |
|---|---|---|
| Home (alert button) | No | Must work in under 2 seconds |
| What to Do guides | No | Information is the safety net |
| Contacts list | Yes -- biometric | Shows personal contact data |
| Add / edit contact | Yes -- biometric | Modifies contact data |
| Settings | Yes -- biometric | Modifies alert message |
| Onboarding | No | First-run before contacts exist |

**Biometric guard:** `expo-local-authentication` with `disableDeviceFallback: false` -- PIN
fallback is always available. `unlocked` lives in React state only. An `AppState` listener
resets it to `false` when the app is backgrounded -- user re-authenticates on every resume
into protected screens.

```typescript
// src/lib/useBiometricGuard.ts
export function useBiometricGuard() {
  const [unlocked, setUnlocked] = useState(false);
  async function prompt() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Identify yourself to access contacts',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    if (result.success) setUnlocked(true);
  }
  return { unlocked, prompt };
}
```

---

## 5. Content Architecture (What to Do Guides)

Static TypeScript module bundled at build time. No network fetch, no CMS.

```typescript
// src/content/guides.ts
interface Guide {
  id: string;
  title: string;
  body: string;          // Markdown string rendered by react-native-markdown-display
  emergency?: boolean;   // shows hotline callout at top if true
}
interface Category {
  id: string;
  title: string;
  icon: string;          // @expo/vector-icons name
  guides: Guide[];
}
```

Categories: `police` / `drugs` / `mental-health` / `reaching-out`

Why static JSON over MDX: content set is small, updates are infrequent, no Babel transform
needed. Plain typed module is testable and has zero runtime overhead. MDX migration is a
one-day refactor if content grows substantially.

---

## 6. Messaging Strategy

### Platform deep links

| Platform | URL scheme | Pre-fills message | Requires app | V1 |
|---|---|---|---|---|
| SMS | `sms:<number>?body=<msg>` | Partial (iOS 16+ restricts body) | No (native) | Yes |
| WhatsApp | `whatsapp://send?phone=<e164>&text=<msg>` | Yes | Yes | Yes |
| Facebook Messenger | `fb-messenger://user-thread/<user-id>` | No | Yes | Deferred |
| Instagram | `https://ig.me/m/<handle>` | No | Degrades to profile | Deferred |

**V1: SMS + WhatsApp only.** Both work reliably and pre-fill text. Messenger requires a
Facebook numeric user ID (not obtainable without login). Instagram requires a handle and
the app installed. Their marginal reach does not justify the setup friction in V1.

**iOS SMS body note:** iOS 16+ may silently drop the `?body=` parameter. Strategy: include
it, expect it to work on Android, accept that iOS opens Messages with the contact pre-filled
and the user taps send. Document this in onboarding.

**iOS `canOpenURL` requirement:** declare in `app.json`:
```json
"ios": {
  "infoPlist": {
    "LSApplicationQueriesSchemes": ["whatsapp", "sms", "fb-messenger"]
  }
}
```

### Alert dispatch

```typescript
// src/lib/messaging.ts
async function sendAlert(contact: Contact, message: string) {
  const encoded = encodeURIComponent(message);
  for (const platform of contact.platforms) {
    let url = '';
    if (platform === 'sms') {
      url = `sms:${contact.phone}?body=${encoded}`;
    } else if (platform === 'whatsapp') {
      url = `whatsapp://send?phone=${contact.phone.replace('+', '')}&text=${encoded}`;
    }
    if (url && await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }
  }
  // Fallback: SMS always available
  await Linking.openURL(`sms:${contact.phone}`);
}
```

---

## 7. Home Screen UX

No hamburger menu, no navigation drawer. Three elements only:

1. **"I'm in Trouble" button** -- full-width, ~120dp tall, high contrast. Sends alert to all
   contacts. If no contacts saved, routes to onboarding.
2. **"Message [Buddy name]" button** -- visible only when a Buddy is designated. Sends
   immediately to Buddy via their preferred platform.
3. **What to Do grid** -- four category cards.

Settings are only reachable via a gear icon inside the Contacts screen (behind biometric auth).
Touch targets: minimum 48dp per HIG/Material. Emergency button: 80-120dp.

---

## 8. V1 Scope

### Ships
- Home screen: alert button, Buddy button, guide grid
- Send alert via SMS and WhatsApp
- All four guide categories with full content
- Add / edit / delete contacts with biometric protection
- Designate #1 Buddy
- Editable alert message text
- Preferred platform setting per contact
- Onboarding (3 screens: welcome, add first contact, set message)
- EAS Build: Android APK + iOS TestFlight

### Deferred
- Facebook Messenger compose (no viable path without Facebook Login)
- Instagram DM (requires handle + IG app installed)
- Push notifications / scheduled check-ins
- Multiple language support
- App Store / Play Store submission
- Any server-side component of any kind

---

## 9. File Structure

```
mywell/
  app/                      # Expo Router routes
  src/
    components/
      AlertButton.tsx
      BuddyButton.tsx
      GuideCard.tsx
      ContactRow.tsx
    lib/
      contacts.ts            # SecureStore read/write (per-key pattern)
      settings.ts            # SecureStore read/write
      messaging.ts           # sendAlert(), buildDeepLink()
      useBiometricGuard.ts
    content/
      guides.ts              # All static guide content
    hooks/
      useContacts.ts
      useSettings.ts
  assets/
    fonts/
    images/
  app.json
  eas.json
  tsconfig.json
  docs/
    PLAN.md                  # this file
    CLAUDE.md
```

---

## 10. EAS Build Config

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": {}
    }
  }
}
```

Use Expo Go during UI iteration. Switch to a development build the moment
`expo-local-authentication` or `expo-secure-store` needs testing -- neither works in Expo Go.

---

## 11. app.json Key Config

```json
{
  "expo": {
    "name": "Mywell",
    "slug": "mywell",
    "scheme": "mywell",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.mywell.app",
      "infoPlist": {
        "LSApplicationQueriesSchemes": ["whatsapp", "sms", "fb-messenger"],
        "NSFaceIDUsageDescription": "Mywell uses Face ID to protect your saved contacts."
      }
    },
    "android": {
      "package": "com.mywell.app",
      "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-local-authentication", {
        "faceIDPermission": "Mywell uses Face ID to protect your saved contacts."
      }]
    ]
  }
}
```

---

## 12. Open Questions (Decide Before Build)

1. **SMS body on iOS** -- iOS 16+ may not honour `?body=`. Is "opens Messages with contact
   pre-filled, user taps send" acceptable? Or does this break the 2-second promise badly
   enough that SMS is secondary on iOS?

2. **Alert to all vs alert to one** -- Does "I'm in Trouble" send to every contact
   (opening one deep link per contact sequentially) or to Buddy only, with a secondary
   "send to all" step? Opening 5 WhatsApp windows in sequence is disorienting.
   Recommendation: send to Buddy by default, add "Also message everyone" confirmation.

3. **Zero contacts saved UX** -- Three options: (a) onboarding immediately, (b) disabled
   button with explanatory text, (c) button press routes to contacts setup. Decision affects
   onboarding flow design.

4. **Content ownership** -- Who writes and maintains the guide content? Static JSON is fine
   for quarterly updates; if content changes weekly, a lightweight CMS warrants evaluation.

5. **App icon sensitivity** -- A young person in an unsafe home may not want the app
   identifiable on their phone. Consider a "disguise mode" (neutral icon + name) as a V1.5
   feature. Decide whether the default icon will be obviously safety-related.

6. **Android back-navigation** -- After opening WhatsApp, Android back returns to Mywell.
   Consider a brief confirmation screen before handing off: "We're opening WhatsApp. Your
   message is pre-written -- just hit send."
