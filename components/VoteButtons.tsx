'use client';

import { useState, useTransition } from 'react';
import { submitVote } from '@/app/actions/vote';

type VoteButtonsProps = {
  captionId: string;
  currentVote?: number | null;
  onVoted: () => void;
};

export function VoteButtons({ captionId, currentVote, onVoted }: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const handleVote = async (voteValue: 1 | -1) => {
    setError(null);
    
    startTransition(async () => {
      const result = await submitVote(captionId, voteValue);
      
      if (result.error) {
        setError(result.error);
      } else {
        setVoted(true);
        // Wait a moment to show feedback, then move to next
        setTimeout(() => {
          onVoted();
        }, 500);
      }
    });
  };

  if (voted) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Vote recorded!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-6">
        {/* Upvote Button */}
        <button
          onClick={() => handleVote(1)}
          disabled={isPending}
          className={`group flex flex-col items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 ${
            isPending
              ? 'opacity-50 cursor-not-allowed bg-slate-800/50'
              : 'bg-slate-800/50 hover:bg-green-500/20 hover:border-green-500/50 border border-slate-700/50 hover:scale-105'
          }`}
        >
          <svg 
            className={`w-10 h-10 transition-colors ${isPending ? 'text-slate-500' : 'text-slate-400 group-hover:text-green-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span className={`font-medium transition-colors ${isPending ? 'text-slate-500' : 'text-slate-300 group-hover:text-green-400'}`}>
            Funny
          </span>
        </button>

        {/* Downvote Button */}
        <button
          onClick={() => handleVote(-1)}
          disabled={isPending}
          className={`group flex flex-col items-center gap-2 px-8 py-4 rounded-2xl transition-all duration-200 ${
            isPending
              ? 'opacity-50 cursor-not-allowed bg-slate-800/50'
              : 'bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/50 border border-slate-700/50 hover:scale-105'
          }`}
        >
          <svg 
            className={`w-10 h-10 transition-colors ${isPending ? 'text-slate-500' : 'text-slate-400 group-hover:text-red-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          <span className={`font-medium transition-colors ${isPending ? 'text-slate-500' : 'text-slate-300 group-hover:text-red-400'}`}>
            Not Funny
          </span>
        </button>
      </div>

      {error && (
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isPending && (
        <div className="text-center">
          <p className="text-slate-400 text-sm animate-pulse">Submitting vote...</p>
        </div>
      )}
    </div>
  );
}
