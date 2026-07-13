"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BrowserRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionResult = ArrayLike<{ transcript?: string }> & {
  isFinal?: boolean;
};

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
};

type BrowserWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognition;
  webkitSpeechRecognition?: new () => BrowserRecognition;
};

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasFinalTranscript, setHasFinalTranscript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);

  useEffect(() => {
    const browserWindow = window as BrowserWindow;
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };
    recognition.onresult = (event) => {
      const segments = Array.from(event.results).map((result) => ({
        transcript: result[0]?.transcript?.trim() ?? "",
        isFinal: Boolean(result.isFinal),
      }));
      const finalTranscript = segments
        .filter((segment) => segment.isFinal)
        .map((segment) => segment.transcript)
        .join(" ")
        .trim();
      const interimTranscript = segments
        .filter((segment) => !segment.isFinal)
        .map((segment) => segment.transcript)
        .join(" ")
        .trim();

      const nextTranscript = (finalTranscript || interimTranscript).trim();
      setTranscript(nextTranscript);
      setHasFinalTranscript(Boolean(finalTranscript));
    };
    recognition.onerror = (event) => {
      setListening(false);
      setHasFinalTranscript(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone access is blocked. Allow mic permission and try again."
          : event.error === "no-speech"
            ? "No speech was detected. Try again a little closer to the microphone."
            : event.error === "audio-capture"
              ? "No microphone was found for speech recognition."
              : "Voice recognition failed. Try again.",
      );
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) {
      return;
    }

    setTranscript("");
    setHasFinalTranscript(false);
    setError(null);

    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
      setError("Voice recognition could not start. Try again.");
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || !listening) {
      return;
    }

    recognitionRef.current.stop();
  }, [listening]);

  const reset = useCallback(() => {
    setTranscript("");
    setHasFinalTranscript(false);
    setError(null);
  }, []);

  return useMemo(
    () => ({
      supported,
      listening,
      transcript,
      hasFinalTranscript,
      error,
      setTranscript,
      start,
      stop,
      reset,
    }),
    [error, hasFinalTranscript, listening, reset, start, stop, supported, transcript],
  );
}
