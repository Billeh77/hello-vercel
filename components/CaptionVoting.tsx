'use client';

import { useState } from 'react';
import { VoteButtons } from './VoteButtons';
import Image from 'next/image';

type Caption = {
  id: string;
  content: string;
  like_count: number;
  images: {
    id: string;
    url: string;
    image_description: string | null;
  } | null;
};

type CaptionVotingProps = {
  captions: Caption[];
  votedCaptionIds: string[];
};

export function CaptionVoting({ captions, votedCaptionIds }: CaptionVotingProps) {
  // Filter out already voted captions
  const unvotedCaptions = captions.filter(c => !votedCaptionIds.includes(c.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localVotedIds, setLocalVotedIds] = useState<string[]>([]);

  // Combine server-side voted IDs with local session voted IDs
  const remainingCaptions = unvotedCaptions.filter(c => !localVotedIds.includes(c.id));

  if (remainingCaptions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-8 rounded-2xl bg-slate-800/50 border border-slate-700">
          <svg className="w-16 h-16 mx-auto text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
          <p className="text-slate-400">You&apos;ve voted on all available captions.</p>
          <p className="text-slate-500 text-sm mt-2">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  const currentCaption = remainingCaptions[0];

  const handleVoted = () => {
    setLocalVotedIds(prev => [...prev, currentCaption.id]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6 text-center">
        <span className="text-slate-400 text-sm">
          {localVotedIds.length + votedCaptionIds.length} voted • {remainingCaptions.length} remaining
        </span>
      </div>

      {/* Caption Card */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Image */}
        {currentCaption.images?.url && (
          <div className="relative aspect-square w-full bg-slate-900/50">
            <Image
              src={currentCaption.images.url}
              alt={currentCaption.images.image_description || 'Caption image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
        )}

        {/* Caption */}
        <div className="p-6">
          <p className="text-xl text-white text-center font-medium leading-relaxed">
            &ldquo;{currentCaption.content}&rdquo;
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Vote Buttons */}
        <div className="p-6">
          <p className="text-center text-slate-400 text-sm mb-4">Is this caption funny?</p>
          <VoteButtons
            captionId={currentCaption.id}
            onVoted={handleVoted}
          />
        </div>
      </div>

      {/* Skip button */}
      <div className="mt-4 text-center">
        <button
          onClick={handleVoted}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Skip this one →
        </button>
      </div>
    </div>
  );
}
