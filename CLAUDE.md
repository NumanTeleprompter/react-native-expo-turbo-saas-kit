# CLAUDE.md

## Ways of working

How Claude should approach every task here. These govern the whole workflow — read them before starting work.

1. **Less is more.** Favour concise, clean, elegant solutions over complex, comprehensive ones — simplicity over cleverness, to avoid over-engineering. On finishing a piece of work, pause and critically review it: if complexity has crept in, address it and suggest a small workflow change to help avoid it next time.

2. **Work the queue in order.** Treat all work as a queue of todos. When I propose tweaks, changes, or corrections, append them to the queue — don't break the queue to suddenly prioritise a correction. Only stop when 100% of the queue is truly clear.

3. **No apologies — fix the instructions.** Mistakes are not your fault; you're an LLM. A mistake means a gap or issue in the instruction files instead. Don't apologise — describe what problem in the instruction files caused the mistake, and suggest the fix. Be solution-oriented.

4. **YAGNI — You Aren't Gonna Need It.** Don't over-engineer, and never expand scope without permission. All work must be justifiable. Assess where the work sits on the "quick and dirty" → "production grade" scale and engineer to match. Always suggest possible scope improvements when they make sense.

5. **Review with fresh eyes.** After making changes, spin up a sub-agent with minimal context on a cheap model whose sole job is to review your changes and sus out possible problems with fresh eyes.

---

## Platform standards

Follow React Native and Android best practices closely, and treat accessibility as a requirement, not polish. When unsure, check the official React Native, Expo and Android docs instead of guessing.

- **React Native:** animate on the UI thread (Reanimated), never with per-frame `setState`. Keep lists virtualised and renders cheap (stable callbacks, no inline object churn in hot paths). Handle safe-area insets, the keyboard, and cleanup on unmount. Test on a real device, not only the emulator.
- **Android:** follow Material 3 (shape, tonal colour, motion) and edge-to-edge. Use the system back button and gesture, ripple press feedback, and native controls (Switch, Slider, haptics) where they exist. Respect dark mode, system font scale and display cutouts. Touch targets are at least 48dp.
- **Accessibility:** every control has an `accessibilityRole`, a label, and its state or value, and works with TalkBack and at large font scale. Text contrast is at least 4.5:1 (3:1 for large text and icons), including over blurred or translucent surfaces. Honour reduce motion (`useReducedMotion`), never rely on colour alone, keep focus order logical, and hide offscreen content from the accessibility tree.

## Performance goals

Scrolling is the product, so protect it. Target 120 fps on phones that support it, and keep tablets in mind (cap content width, centre the controls). The app should later let the user record video with the front or back camera while the script scrolls, automatically or by hand, so keep the scroll path light and leave headroom for a camera preview and encoder.

- Keep the scroll loop on the UI thread with no JavaScript per frame. Anything that polls (like the time left) must be slow and isolated to its own component.
- Don't add blur, shadows or layout work to the scroll path. If a camera preview goes behind the script, drop blur while recording and use opaque or translucent controls.
- Measure on a real phone with a release build before and after a change that could affect scrolling. Debug builds and the emulator are only a rough guide.
- Adaptive refresh rate (Android 15 and later) gives an auto-scrolling animation only about 60 Hz by default. Reaching 120 Hz needs the app to request it (`View.setRequestedFrameRate`), which React Native doesn't do, so it will need a small native module.

---

## Project

Expo + Supabase starter kit (MakerKit), a pnpm + Turborepo monorepo. It targets iOS, Android and web. It ships email/password auth, a profile and account settings area, and protected routes. On top of it sits the product: a device-only teleprompter. Scripts and prompter settings live in AsyncStorage, with no account or network. It is the home screen at `/`; the template's auth and settings screens still exist but aren't linked from it.

- **App:** `apps/expo-app` — Expo Router (file-based), NativeWind, React Query, React Hook Form + Zod.
- **Packages:** `packages/features/{auth,account,teleprompter}`, `packages/supabase` (client, auth hooks), `packages/ui` (`@kit/ui` components), `tooling/*` (shared configs).
- **Teleprompter:** the scroll loop is `lib/use-auto-scroll.ts` (Reanimated frame callback, UI thread). Scroll speed in px/s scales with font size, so a speed level keeps the same reading pace. Routes are in `app/(app)/(teleprompter)`. Scripts render a markdown subset (`lib/markdown.ts`: headings, bold, italic, lists, quotes, rules; no nesting). Display settings live in a bottom sheet (`components/settings-sheet.tsx`) that doesn't dim the prompter, which slides up so changes show live.
- **Backend:** local Supabase (Docker) in `apps/expo-app/supabase`. The only table is `public.accounts`, with RLS and a signup trigger.
- **Conventions:** `.cursorrules` has the full code standards. The key ones are kebab-case files, types over interfaces, features in `packages/features`, RLS on every new table, and explicit `public.` schemas.

## Commands

Run from the repo root. `pnpm` is pinned by `packageManager`, so run it from inside the repo, where corepack resolves it.

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server (Metro) | `pnpm dev` |
| Start / stop Supabase | `pnpm supabase:web:start` / `pnpm supabase:web:stop` |
| Reset DB / regenerate types | `pnpm supabase:web:reset` / `pnpm supabase:web:typegen` |
| Typecheck / lint / format | `pnpm typecheck` / `pnpm lint` / `pnpm format` |
| Test | `pnpm test` runs jest in watch mode and no tests exist yet, so don't run it unattended |
| Android | From `apps/expo-app`: `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME="$HOME/Library/Android/sdk" pnpm exec expo run:android` (needs a running emulator or device) |

Setup: if `apps/expo-app/.env` is missing, copy it from `.env.template`, and have Docker (or OrbStack) running. Confirmation and recovery emails land in Mailpit at `http://127.0.0.1:54324`. Studio is at `http://127.0.0.1:54323`.

## Gotchas

- **Port 54321:** the Supabase API port can clash with other local apps, e.g. a CleanMyMac helper. Check with `lsof -iTCP:54321 -sTCP:LISTEN`. If you move it, change both `supabase/config.toml` and `EXPO_PUBLIC_SUPABASE_API_URL` in `.env`. Keep the port change out of commits, and restart Metro afterwards, since `EXPO_PUBLIC_*` values are inlined at start.
- **Auth links on web:** `Linking.useURL()` drops the `#access_token=…` fragment, so `/auth/callback` reads `window.location.href`. The callback route lives in the `(public)` group, outside the signed-out-only auth layout. An inline script in `app/+html.tsx` forwards links that land on `/` to `/auth/callback`.
- **Password recovery:** `/auth/password-reset` only requests the email. The recovery link then lands on `/settings/account`, where the password form lives.
- **Text:** string children must be wrapped in `<Text>`; a raw string inside a `<View>` throws on every platform.
- **Android Gradle:** React Native 0.83.6's Gradle plugin pins `foojay-resolver` 0.5.0, which fails on the Gradle 9.0.0 wrapper that prebuild generates (`JvmVendorSpec ... IBM_SEMERU`). After the first `expo run:android`, set `distributionUrl` in `android/gradle/wrapper/gradle-wrapper.properties` to `gradle-8.14.3-bin.zip`. `android/` is gitignored, so redo this whenever it is regenerated. JDK 24 is too new; use Android Studio's JDK as above.
- **NativeWind `Pressable`:** function-style props (`style={({ pressed }) => ...}`) are ignored. Use a static style plus `android_ripple`.
- **Metro crashes:** after file saves, NativeWind's Tailwind watcher can kill Metro (`TypeError ... reading 'addedFiles'`). Dev-only; restart `pnpm exec expo start --dev-client`. The app then runs stale JS until you force-stop and relaunch it.
- **Native modules:** new ones (slider, haptics) need a native rebuild. `expo run:android` refuses to run while any attached device is `unauthorized`; use `ANDROID_SERIAL=<serial> ./gradlew app:installDebug` in `android/` (flags as in the Android row) to target one device.
- **Reanimated Babel plugin:** warns on any `.value` inside an inline `style`, even a plain object's; read it into a variable first. Two `transform` styles on one view replace each other, so combine them in one list.
- **Glass (`expo-blur`):** a `BlurView` only blurs what is drawn inside its `BlurTargetView`, not the target's own background. Keep an opaque page layer inside the target, or the glass renders as flat light grey. Also, `hitSlop` isn't delivered outside a clipping parent, so buttons inside glass are 48dp themselves.
- **Testing on the emulator:** `adb shell input text` crashes the dev build (NPE in `ReactActivityDelegate.onKeyUp`) when no text input has focus, and the stray keys land in other apps. Tap the field first and confirm with `adb shell dumpsys input_method | grep mServedView`.
