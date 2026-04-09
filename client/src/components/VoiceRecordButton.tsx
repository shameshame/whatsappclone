import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

import { Button } from "@/components/ui/button";

type VoiceRecorderButtonProps = {
  onSendVoice: (audioBlob: Blob, durationSec: number) => Promise<unknown>;
  disabled?: boolean;
};

export default function VoiceRecorderButton({
  onSendVoice,
  disabled = false,
}: VoiceRecorderButtonProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const shouldSendRef = useRef(false);

  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!recording) return;

    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const seconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(seconds);
    }, 250);

    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, []);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function beginRecording() {
    if (disabled || sending || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      shouldSendRef.current = false;
      startedAtRef.current = Date.now();
      setElapsedSec(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const startedAt = startedAtRef.current;
        startedAtRef.current = null;
        setRecording(false);

        const durationSec = startedAt
          ? Math.max(1, Math.round((Date.now() - startedAt) / 1000))
          : 1;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        cleanupStream();

        const shouldSend = shouldSendRef.current;
        shouldSendRef.current = false;

        if (!shouldSend) {
          chunksRef.current = [];
          setElapsedSec(0);
          return;
        }

        if (blob.size === 0) {
          chunksRef.current = [];
          setElapsedSec(0);
          return;
        }

        try {
          setSending(true);
          await onSendVoice(blob, durationSec);
        } catch (error) {
          console.error("Failed to send voice message:", error);
        } finally {
          chunksRef.current = [];
          setElapsedSec(0);
          setSending(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Microphone access failed:", error);
      cleanupStream();
    }
  }

  function finishRecordingAndSend() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    shouldSendRef.current = true;
    recorderRef.current.stop();
  }

  function cancelRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    shouldSendRef.current = false;
    recorderRef.current.stop();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      void beginRecording();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    finishRecordingAndSend();
  }

  function handlePointerLeave() {
    if (recording) {
      cancelRecording();
    }
  }

  function handlePointerCancel() {
    if (recording) {
      cancelRecording();
    }
  }

  function formatDuration(seconds: number) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  return (
    <div className="flex items-center gap-2">
      {recording && (
        <div className="rounded-full border px-3 py-2 text-sm">
          Recording {formatDuration(elapsedSec)}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        variant={recording ? "default" : "outline"}
        disabled={disabled || sending}
        aria-label={recording ? "Release to send voice message" : "Hold to record voice message"}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        className="touch-none select-none"
      >
        <Mic className="h-4 w-4" />
      </Button>
    </div>
  );
}