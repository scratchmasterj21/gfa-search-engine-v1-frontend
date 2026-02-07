import React, { useEffect, useRef, useCallback } from 'react';
import { saveGoogleUserInfo, type GoogleUserInfo } from './firebase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: { getMomentType: () => string }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            config: { type?: string; theme?: string; size?: string; text?: string }
          ) => void;
        };
      };
    };
  }
}

function decodeJwtPayload(credential: string): { sub?: string; email?: string; name?: string; picture?: string } | null {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

interface GoogleSignInProps {
  onSignInSuccess?: () => void;
  onSignInError?: (message: string) => void;
  /** When true, show the sign-in modal (desktop/Chromebook only). */
  showModal: boolean;
  onCloseModal: () => void;
  /** Theme for the modal (matches app). */
  theme?: 'light' | 'dark';
}

export default function GoogleSignIn({
  onSignInSuccess,
  onSignInError,
  showModal,
  onCloseModal,
  theme = 'light'
}: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      const payload = decodeJwtPayload(response.credential);
      if (!payload?.sub) {
        onSignInError?.('Invalid sign-in response');
        return;
      }
      const user: GoogleUserInfo = {
        googleId: payload.sub,
        email: payload.email ?? null,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
        signedInAt: new Date().toISOString()
      };
      await saveGoogleUserInfo(user);
      onSignInSuccess?.();
      onCloseModal();
    },
    [onSignInSuccess, onSignInError, onCloseModal]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

    if (initialized.current) return;
    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
  }, [handleCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !showModal || !buttonRef.current || !window.google?.accounts?.id) return;

    const el = buttonRef.current;
    el.innerHTML = '';
    try {
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        text: 'signin_with'
      });
    } catch (e) {
      console.warn('Google button render failed:', e);
    }
  }, [showModal, theme]);

  if (!GOOGLE_CLIENT_ID) return null;

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in with Google"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCloseModal}
        onKeyDown={(e) => e.key === 'Escape' && onCloseModal()}
      />
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-xl ${
          theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Sign in with Google</h2>
          <button
            type="button"
            onClick={onCloseModal}
            className="p-2 rounded-full hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Sign in to associate this device with your account for better logging on Chromebooks and desktops.
        </p>
        <div className="flex justify-center" ref={buttonRef} />
      </div>
    </div>
  );
}
