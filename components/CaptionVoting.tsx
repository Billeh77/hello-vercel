'use client';

import { useMemo, useState } from 'react';
import { VoteButtons } from './VoteButtons';

function shuffleCaptions<T extends { id: string }>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Caption = {
  id: string;
  content: string;
  like_count: number;
  image_id: string;
  images: {
    id: string;
    url: string;
    image_description: string | null;
  };
};

type CaptionVotingProps = {
  captions: Caption[];
  votedCaptionIds: string[];
};

export function CaptionVoting({ captions, votedCaptionIds }: CaptionVotingProps) {
  const serverUnvotedKey = useMemo(
    () =>
      captions
        .filter((c) => !votedCaptionIds.includes(c.id))
        .map((c) => c.id)
        .sort()
        .join(','),
    [captions, votedCaptionIds]
  );

  const shuffledQueue = useMemo(() => {
    const pool = captions.filter((c) => !votedCaptionIds.includes(c.id));
    return shuffleCaptions(pool);
    // Only reshuffle when the set of server-unvoted caption ids changes (key), not on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- captions/votedCaptionIds are consistent with serverUnvotedKey
  }, [serverUnvotedKey]);

  const [localVotedIds, setLocalVotedIds] = useState<string[]>([]);
  const remainingCaptions = shuffledQueue.filter((c) => !localVotedIds.includes(c.id));

  if (remainingCaptions.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
          <svg className="w-12 h-12 mx-auto text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-1">All Done!</h2>
          <p className="text-slate-400 text-sm">You&apos;ve voted on all available captions.</p>
        </div>
      </div>
    );
  }

  const currentCaption = remainingCaptions[0];

  const handleVoted = () => {
    setLocalVotedIds(prev => [...prev, currentCaption.id]);
  };

  return (
    <div className="flex flex-col max-w-lg mx-auto w-full">
      {/* Progress indicator */}
      <div className="text-center mb-2 flex-shrink-0">
        <span className="text-slate-400 text-xs">
          {localVotedIds.length + votedCaptionIds.length} voted • {remainingCaptions.length} remaining
        </span>
      </div>

      {/* Caption Card */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col">
        {/* Image - FIXED max height, scales to fit */}
        <div className="bg-slate-900/50 flex items-center justify-center p-2" style={{ maxHeight: '50vh' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentCaption.images.url}
            alt={currentCaption.images.image_description || 'Caption image'}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: 'calc(50vh - 16px)' }}
          />
        </div>

        {/* Caption */}
        <div className="px-4 py-3 border-t border-slate-700/50 flex-shrink-0">
          <p className="text-base text-white text-center font-medium leading-snug">
            &ldquo;{currentCaption.content}&rdquo;
          </p>
        </div>

        {/* Vote Buttons */}
        <div className="px-4 py-3 border-t border-slate-700/50 flex-shrink-0">
          <VoteButtons
            key={currentCaption.id}
            captionId={currentCaption.id}
            onVoted={handleVoted}
          />
        </div>
      </div>

      {/* Skip: same as advancing in the shuffled queue, without recording a vote */}
      <div className="mt-4 flex-shrink-0 rounded-xl border border-slate-600/60 bg-slate-800/40 p-3">
          <button
            type="button"
            onClick={handleVoted}
            className="shrink-0 rounded-lg border border-slate-500 bg-slate-700/80 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            title="Next item in your shuffled queue, no vote recorded"
          >
            Skip to next caption
          </button>
      </div>
    </div>
  );
}
