import { useCallback, useEffect, useRef, useState } from "react";

interface UseClipboardCopyOptions {
  resetAfterMs?: number;
}

export const useClipboardCopy = ({
  resetAfterMs = 1200,
}: UseClipboardCopyOptions = {}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);

        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetAfterMs);
      } catch (error) {
        console.error("Failed to copy to clipboard", error);
        setCopied(false);
      }
    },
    [resetAfterMs],
  );

  return {
    copied,
    copy,
  };
};
