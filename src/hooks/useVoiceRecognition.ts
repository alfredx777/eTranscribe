import { useEffect, useRef, useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export type RecognitionState = 'idle' | 'listening' | 'stopping' | 'error';

interface UseVoiceRecognitionResult {
  state: RecognitionState;
  liveText: string;
  finalSegments: string[];
  fullTranscript: string;
  audioUri: string | null;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

/**
 * Wraps expo-speech-recognition (TurboModule-based, New Architecture
 * compatible) to produce both a live transcript and a saved audio file
 * from a single recording session. Replaces the older
 * @react-native-voice/voice + expo-av combination, which is deprecated
 * and silently fails under React Native's New Architecture.
 */
export function useVoiceRecognition(): UseVoiceRecognitionResult {
  const [state, setState] = useState<RecognitionState>('idle');
  const [liveText, setLiveText] = useState('');
  const [finalSegments, setFinalSegments] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActiveRef = useRef(false);
  const liveTextRef = useRef('');
  const sessionFileRef = useRef<string | null>(null);

  useEffect(() => {
    liveTextRef.current = liveText;
  }, [liveText]);

  useSpeechRecognitionEvent('result', (event: any) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    setLiveText(transcript);
  });

  useSpeechRecognitionEvent('audiostart', (event: any) => {
    if (event?.uri) {
      sessionFileRef.current = event.uri;
    }
  });

  useSpeechRecognitionEvent('audioend', (event: any) => {
    if (event?.uri) {
      sessionFileRef.current = event.uri;
    }
  });

  useSpeechRecognitionEvent('end', () => {
    // The native recognizer stops after a pause in speech. Commit
    // whatever we captured and restart automatically so a long recording
    // session isn't cut short by normal pauses in talking.
    setFinalSegments((prev) =>
      liveTextRef.current ? [...prev, liveTextRef.current.trim()] : prev
    );
    setLiveText('');

    if (isActiveRef.current) {
      beginSession().catch(() => {
        /* transient restart race, ignore */
      });
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    // "no-speech" fires naturally during pauses — not a real error.
    if (event.error === 'no-speech' && isActiveRef.current) {
      return; // the "end" handler above takes care of restarting
    }
    setErrorMessage(event.message ?? String(event.error) ?? 'Speech recognition error');
    setState('error');
    isActiveRef.current = false;
  });

  const beginSession = useCallback(async () => {
    await ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: false,
      recordingOptions: {
        persist: true,
        outputDirectory: RECORDINGS_DIR,
        outputFileName: `session-${Date.now()}.wav`,
      },
    } as any);
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    setLiveText('');
    setFinalSegments([]);
    setAudioUri(null);
    sessionFileRef.current = null;

    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
      intermediates: true,
    }).catch(() => {
      /* already exists */
    });

    const micPerm =
      await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!micPerm.granted) {
      setErrorMessage('Microphone permission denied');
      setState('error');
      return;
    }

    isActiveRef.current = true;
    setState('listening');
    await beginSession();
  }, [beginSession]);

  const stop = useCallback(async () => {
    isActiveRef.current = false;
    setState('stopping');

    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }

    setFinalSegments((prev) =>
      liveTextRef.current ? [...prev, liveTextRef.current.trim()] : prev
    );
    setLiveText('');
    setAudioUri(sessionFileRef.current);
    setState('idle');
  }, []);

  const reset = useCallback(() => {
    setLiveText('');
    setFinalSegments([]);
    setAudioUri(null);
    setErrorMessage(null);
    setState('idle');
  }, []);

  const fullTranscript = [...finalSegments, liveText].filter(Boolean).join(' ');

  return {
    state,
    liveText,
    finalSegments,
    fullTranscript,
    audioUri,
    errorMessage,
    start,
    stop,
    reset,
  };
}
