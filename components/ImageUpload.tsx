'use client';

import { useState, useRef } from 'react';
import { getAccessToken } from '@/app/actions/getToken';

const API_BASE = 'https://api.almostcrackd.ai';

type Caption = {
  id: string;
  content: string;
  is_public: boolean;
};

type UploadState = 
  | { status: 'idle' }
  | { status: 'selecting' }
  | { status: 'uploading'; step: number; message: string }
  | { status: 'success'; captions: Caption[]; imageUrl: string }
  | { status: 'error'; message: string };

export function ImageUpload() {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setState({ status: 'uploading', step: 4, message: 'Generating captions... (this may take a moment)' });
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

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />

      {state.status === 'idle' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload Image & Generate Captions
        </button>
      )}

      {state.status === 'uploading' && (
        <div className="text-center py-4">
          {previewUrl && (
            <div className="mb-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg object-contain" />
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
        <div className="py-2">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Success! {state.captions.length} captions generated</span>
          </div>
          
          {previewUrl && (
            <div className="mb-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Uploaded" className="max-h-32 rounded-lg object-contain" />
            </div>
          )}
          
          <div className="space-y-2 mb-4">
            {state.captions.map((caption, i) => (
              <div key={caption.id} className="bg-slate-900/50 rounded-lg p-3 text-sm">
                <span className="text-slate-500 mr-2">{i + 1}.</span>
                <span className="text-white">&ldquo;{caption.content}&rdquo;</span>
              </div>
            ))}
          </div>
          
          <p className="text-slate-500 text-xs mb-3">
            Note: Captions are saved as private. They won&apos;t appear in the voting feed until made public.
          </p>
          
          <button
            onClick={reset}
            className="w-full py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
          >
            Upload Another Image
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="py-4 text-center">
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
  );
}
