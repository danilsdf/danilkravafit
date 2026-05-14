"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

declare global {
  // eslint-disable-next-line no-var
  var google:
    | {
        accounts: {
          id: {
            initialize: (config: {
              client_id: string;
              callback: (response: { credential: string }) => void;
            }) => void;
            renderButton: (element: HTMLElement, options: object) => void;
          };
        };
      }
    | undefined;
}

interface GoogleSignInButtonProps {
  readonly onError?: (message: string) => void;
}

export default function GoogleSignInButton({
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  function initializeGoogle() {
    if (!globalThis.google || !buttonRef.current || initializedRef.current) return;
    initializedRef.current = true;

    globalThis.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async (response) => {
        try {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          });

          const data = await res.json();

          if (!res.ok) {
            onError?.(data.error ?? "Google sign-in failed.");
            return;
          }

          router.push("/");
        } catch {
          onError?.("Network error. Please try again.");
        }
      },
    });

    globalThis.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      width: buttonRef.current.offsetWidth || 400,
    });
  }

  // Re-initialize if the script was already loaded (e.g. navigating between pages)
  useEffect(() => {
    if (globalThis.google) {
      initializeGoogle();
    }
  });

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      <div ref={buttonRef} className="w-full" />
    </>
  );
}
