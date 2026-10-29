# CLAUDE.md

## Ways of working

How Claude should approach every task here. These govern the whole workflow — read them before starting work.

1. **Less is more.** Favour concise, clean, elegant solutions over complex, comprehensive ones — simplicity over cleverness, to avoid over-engineering. On finishing a piece of work, pause and critically review it: if complexity has crept in, address it and suggest a small workflow change to help avoid it next time.

2. **Work the queue in order.** Treat all work as a queue of todos. When I propose tweaks, changes, or corrections, append them to the queue — don't break the queue to suddenly prioritise a correction. Only stop when 100% of the queue is truly clear.

3. **No apologies — fix the instructions.** Mistakes are not your fault; you're an LLM. A mistake means a gap or issue in the instruction files instead. Don't apologise — describe what problem in the instruction files caused the mistake, and suggest the fix. Be solution-oriented.

4. **YAGNI — You Aren't Gonna Need It.** Don't over-engineer, and never expand scope without permission. All work must be justifiable. Assess where the work sits on the "quick and dirty" → "production grade" scale and engineer to match. Always suggest possible scope improvements when they make sense.

5. **Review with fresh eyes.** After making changes, spin up a sub-agent with minimal context on a cheap model whose sole job is to review your changes and sus out possible problems with fresh eyes.

---

## Project

Expo + Supabase starter kit (MakerKit), a pnpm + Turborepo monorepo. It targets iOS, Android and web. It ships email/password auth, a profile and account settings area, and protected routes. On top of it sits the product: a device-only teleprompter. Scripts and prompter settings live in AsyncStorage, with no account or network. It is the home screen at `/`; the template's auth and settings screens still exist but aren't linked from it.

- **App:** `apps/expo-app` — Expo Router (file-based), NativeWind, React Query, React Hook Form + Zod.
- **Packages:** `packages/features/{auth,account,teleprompter}`, `packages/supabase` (client, auth hooks), `packages/ui` (`@kit/ui` components), `tooling/*` (shared configs).
- **Teleprompter:** the scroll loop is `lib/use-auto-scroll.ts` (Reanimated frame callback, UI thread). Scroll speed in px/s scales with font size, so a speed level keeps the same reading pace. Routes are in `app/(app)/(teleprompter)`.
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
- **Testing on the emulator:** `adb shell input text` crashes the dev build (NPE in `ReactActivityDelegate.onKeyUp`) when no text input has focus, and the stray keys land in other apps. Tap the field first and confirm with `adb shell dumpsys input_method | grep mServedView`.
