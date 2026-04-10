'use client';

import { useState, useRef, useEffect } from 'react';
import { getAccessToken } from '@/app/actions/getToken';

const API_BASE = 'https://api.almostcrackd.ai';

type Caption = {
  id: string;
  content: string;
  is_public: boolean;
};

type UploadState = 
  | { status: 'idle' }
  | { status: 'uploading'; step: number; message: string }
  | { status: 'success'; captions: Caption[]; imageUrl: string }
  | { status: 'error'; message: string };

const UPLOAD_HINT_KEY = 'hello-vercel-upload-fab-seen';

export function ImageUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showFabPulse, setShowFabPulse] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !sessionStorage.getItem(UPLOAD_HINT_KEY)) {
        setShowFabPulse(true);
      }
    } catch {
      setShowFabPulse(true);
    }
  }, []);

  const markFabSeen = () => {
    try {
      sessionStorage.setItem(UPLOAD_HINT_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowFabPulse(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      setState({ status: 'error', message: 'Invalid file type. Please use JPEG, PNG, WebP, GIF, or HEIC.' });
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Start upload
    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      // Get token
      setState({ status: 'uploading', step: 0, message: 'Getting authentication...' });
      const { token, error: tokenError } = await getAccessToken();
      if (!token) {
        setState({ status: 'error', message: tokenError || 'Failed to get authentication' });
        return;
      }

      // Step 1: Generate presigned URL
      setState({ status: 'uploading', step: 1, message: 'Preparing upload...' });
      const presignedRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentType: file.type })
      });

      if (!presignedRes.ok) {
        const errText = await presignedRes.text();
        setState({ status: 'error', message: `Failed to get upload URL: ${errText}` });
        return;
      }

      const { presignedUrl, cdnUrl } = await presignedRes.json();

      // Step 2: Upload image bytes
      setState({ status: 'uploading', step: 2, message: 'Uploading image...' });
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadRes.ok) {
        setState({ status: 'error', message: 'Failed to upload image' });
        return;
      }

      // Step 3: Register image URL
      setState({ status: 'uploading', step: 3, message: 'Registering image...' });
      const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
      });

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        setState({ status: 'error', message: `Failed to register image: ${errText}` });
        return;
      }

      const { imageId } = await registerRes.json();

      // Step 4: Generate captions
      setState({ status: 'uploading', step: 4, message: 'Generating captions...' });
      const captionRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId })
      });

      if (!captionRes.ok) {
        const errText = await captionRes.text();
        setState({ status: 'error', message: `Failed to generate captions: ${errText}` });
        return;
      }

      const captions = await captionRes.json();
      setState({ 
        status: 'success', 
        captions: captions.map((c: Caption) => ({ id: c.id, content: c.content, is_public: c.is_public })),
        imageUrl: cdnUrl
      });

    } catch (err) {
      setState({ status: 'error', message: `Error: ${err}` });
    }
  };

  const reset = () => {
    setState({ status: 'idle' });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closePanel = () => {
    setIsOpen(false);
    // Reset state when closing if not uploading
    if (state.status !== 'uploading') {
      reset();
    }
  };

  return (
    <>
      {/* Primary action: labeled FAB so users scanning the center still notice upload */}
      <button
        type="button"
        onClick={() => {
          markFabSeen();
          setIsOpen(true);
        }}
        className={`fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3.5 text-white shadow-lg shadow-purple-900/50 transition-all hover:bg-purple-700 hover:scale-[1.02] sm:bottom-6 sm:right-6 sm:py-4 sm:pl-5 sm:pr-6 ${showFabPulse ? 'animate-pulse ring-2 ring-purple-400/80 ring-offset-2 ring-offset-slate-900' : ''}`}
        title="Add your own image and generate captions"
        aria-label="Add your own image to generate captions"
      >
        <svg className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="max-w-[11rem] text-left text-sm font-semibold leading-tight sm:max-w-none sm:text-base">
          Add your image
        </span>
      </button>

      {/* Larger centered modal (addresses cramped panel feedback) */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/60"
            onClick={closePanel}
            aria-hidden
          />
          
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-dialog-title"
            className="fixed inset-3 z-50 flex max-h-[min(92vh,880px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-600 bg-slate-800 shadow-2xl sm:inset-6 md:left-1/2 md:top-1/2 md:h-auto md:max-h-[min(92vh,880px)] md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:inset-auto md:w-[min(92vw,42rem)] animate-slide-up"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <h3 id="upload-dialog-title" className="text-lg font-semibold text-white sm:text-xl">Generate captions</h3>
                <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">Upload a photo to get AI captions</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                onChange={handleFileSelect}
                className="hidden"
              />

              {state.status === 'idle' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                  <svg className="w-12 h-12 mx-auto text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-300 font-medium mb-1">Click to select an image</p>
                  <p className="text-slate-500 text-sm">JPEG, PNG, WebP, GIF, HEIC</p>
                </div>
              )}

              {state.status === 'uploading' && (
                <div className="py-2 text-center">
                  {previewUrl && (
                    <div className="mb-6 flex min-h-[12rem] justify-center rounded-xl bg-slate-900/50 p-4 sm:min-h-[16rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="max-h-[min(50vh,22rem)] w-auto max-w-full rounded-lg object-contain" />
                    </div>
                  )}
                  
                  {/* Progress steps */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          step < state.step
                            ? 'bg-green-500 text-white'
                            : step === state.step
                            ? 'bg-purple-500 text-white animate-pulse'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {step < state.step ? '✓' : step}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-slate-300 text-sm">{state.message}</p>
                </div>
              )}

              {state.status === 'success' && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-green-400">
                    <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base font-medium sm:text-lg">{state.captions.length} captions generated</span>
                  </div>
                  
                  {previewUrl && (
                    <div className="mb-5 flex min-h-[14rem] justify-center rounded-xl bg-slate-900/50 p-4 sm:min-h-[18rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Uploaded" className="max-h-[min(55vh,26rem)] w-auto max-w-full rounded-lg object-contain" />
                    </div>
                  )}
                  
                  <div className="mb-4 max-h-[min(40vh,20rem)] space-y-3 overflow-y-auto pr-1">
                    {state.captions.map((caption, i) => (
                      <div key={caption.id} className="rounded-xl bg-slate-900/60 p-4 text-base leading-relaxed text-white">
                        <span className="mr-2 font-mono text-sm text-slate-500">{i + 1}.</span>
                        &ldquo;{caption.content}&rdquo;
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-slate-500 text-xs mb-3">
                    Captions saved as private.
                  </p>
                  
                  <button
                    onClick={reset}
                    className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              )}

              {state.status === 'error' && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-red-400 mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Upload Failed</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{state.message}</p>
                  <button
                    onClick={reset}
                    className="py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
