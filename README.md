# Transcriber App

A cross-platform (iOS + Android) transcription app using **free, on-device speech
recognition** — no cloud API, no per-minute cost, no subscription to any
transcription vendor.

## How it works

Instead of calling a paid transcription API, this app wraps the **speech
recognizer already built into iOS and Android** via
[`expo-speech-recognition`](https://github.com/jamsch/expo-speech-recognition).

> **Note on library choice:** an earlier version of this project used
> `@react-native-voice/voice`. That package is now deprecated, and — more
> importantly — it silently fails on React Native's New Architecture (the
> default in current Expo SDKs) because it still relies on the old bridge.
> `expo-speech-recognition` is a TurboModule built for New Architecture, so
> it's the safer long-term choice.

Because the OS recognizers are designed for *live* recognition (not "upload a
file, get text back"), recording and transcription happen **at the same
time**: tapping "Record" starts a speech recognition session with
`recordingOptions` enabled, which saves the audio file alongside the live
transcript in one step (no separate recording library needed). When you
stop, you have both:
- the full transcript (text)
- the original audio file (for playback/export, played back via `expo-audio`)

## ⚠️ Important: this needs a Dev Client, not Expo Go

`expo-speech-recognition` includes native (non-JS) code, so it cannot run in
the plain Expo Go app. You need a **custom development build**. This is still
100% free — it's just a different command:

```bash
npm install
npx expo prebuild        # generates native ios/ and android/ folders
npx expo run:ios         # builds & runs on simulator/device (needs a Mac + Xcode)
npx expo run:android     # builds & runs on emulator/device (needs Android Studio)
```

Or use [EAS Build](https://docs.expo.dev/build/introduction/) (free tier
available) to build a dev client in the cloud if you don't have Xcode/Android
Studio locally:

```bash
npx eas build --profile development --platform all
```

Day-to-day after that, you still get the fast Expo refresh loop:

```bash
npx expo start --dev-client
```

## Project structure

```
App.tsx                        Navigation shell (Record / History / Detail)
src/hooks/useVoiceRecognition.ts   Core: expo-speech-recognition (live transcript + audio file)
src/screens/RecordScreen.tsx       Main recording UI, live transcript
src/screens/HistoryScreen.tsx      List of saved transcripts
src/screens/DetailScreen.tsx       View/edit/play/export a single transcript
src/storage/db.ts                  SQLite persistence (expo-sqlite)
```

## Known platform differences (read this before you ship)

- **iOS**: `SFSpeechRecognizer` gives good accuracy and lower latency. Apple's
  on-device mode is used automatically where supported.
- **Android**: quality and latency vary a lot by manufacturer, since some
  OEMs ship weaker or older speech services. Test on a real budget Android
  device before launch, not just an emulator or a flagship phone.
- Both platforms **auto-stop listening after a pause in speech**. The hook
  in this project (`useVoiceRecognition.ts`) automatically restarts
  recognition when that happens, so long recordings keep working — but there
  is a small (sub-second) gap in transcription right at each restart. This is
  a known limitation of wrapping OS-level recognizers rather than a
  continuous streaming model.
- No speaker diarization ("who said what") is available through this
  approach — that would require a separate on-device model.

## Suggested next steps

1. `npm install` and get it running on a real device (see above).
2. Test recording length limits — try a 10+ minute recording on Android to see
   how the pause/restart handling holds up in practice.
3. Add a settings screen for recognition language (`lang: 'en-US'` in
   `beginSession()` is hardcoded right now — swap in whatever locale the
   user picks).
4. When you're ready to monetize, consider what free vs. paid tiers look
   like — since there's no per-minute API cost, your margin is high and you
   have flexibility (e.g. unlimited recordings free, paid tier only for
   extra features like cloud sync).
"# eTranscribe" 
