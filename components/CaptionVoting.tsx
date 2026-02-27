'use client';

import { useState } from 'react';
import { VoteButtons } from './VoteButtons';

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
  const unvotedCaptions = captions.filter(c => !votedCaptionIds.includes(c.id));
  const [localVotedIds, setLocalVotedIds] = useState<string[]>([]);
  const remainingCaptions = unvotedCaptions.filter(c => !localVotedIds.includes(c.id));

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
    <div className="flex flex-col flex-1 max-w-lg mx-auto">
      {/* Progress indicator */}
      <div className="text-center mb-2">
        <span className="text-slate-400 text-xs">
          {localVotedIds.length + votedCaptionIds.length} voted • {remainingCaptions.length} remaining
        </span>
      </div>

      {/* Caption Card - flex-1 to take available space */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col flex-1 min-h-0">
        {/* Image - constrained height */}
        <div className="flex-1 min-h-0 bg-slate-900/50 flex items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentCaption.images.url}
            alt={currentCaption.images.image_description || 'Caption image'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Caption */}
        <div className="px-4 py-3 border-t border-slate-700/50">
          <p className="text-base text-white text-center font-medium leading-snug">
            &ldquo;{currentCaption.content}&rdquo;
          </p>
        </div>

        {/* Vote Buttons */}
        <div className="px-4 py-3 border-t border-slate-700/50">
          <VoteButtons
            key={currentCaption.id}
            captionId={currentCaption.id}
            onVoted={handleVoted}
          />
        </div>
      </div>

      {/* Skip button */}
      <div className="mt-2 text-center">
        <button
          onClick={handleVoted}
          className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
