import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { CaptionVoting } from '@/components/CaptionVoting';

export const revalidate = 0;

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Step 1: Fetch public images first
  const { data: images } = await supabase
    .from('images')
    .select('id, url, image_description')
    .eq('is_public', true)
    .limit(50);

  const imageIds = images?.map(img => img.id) || [];

  // Step 2: Fetch public captions for those images
  const { data: captions } = await supabase
    .from('captions')
    .select('id, content, like_count, image_id')
    .eq('is_public', true)
    .in('image_id', imageIds.length > 0 ? imageIds : ['none'])
    .order('created_datetime_utc', { ascending: false });

  // Step 3: Combine - only include captions that have a matching image
  const imageMap = new Map(images?.map(img => [img.id, img]) || []);
  
  const captionsWithImages = captions?.map(caption => ({
    ...caption,
    images: imageMap.get(caption.image_id)!
  })).filter(c => c.images) || [];

  // Step 4: Get user's existing votes
  const { data: userVotes } = await supabase
    .from('caption_votes')
    .select('caption_id')
    .eq('profile_id', user.id);

  const votedCaptionIds = userVotes?.map(v => v.caption_id) || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* User Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-purple-500/50"
              />
            )}
            <div>
              <h2 className="text-sm font-medium text-white">
                {user.user_metadata?.full_name || user.email}
              </h2>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Page Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rate Captions
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Is It Funny?
          </h1>
          <p className="text-slate-400">
            Help us find the best captions by voting
          </p>
        </header>

        {/* Caption Voting */}
        {captionsWithImages.length > 0 ? (
          <CaptionVoting 
            captions={captionsWithImages} 
            votedCaptionIds={votedCaptionIds} 
          />
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-lg">No captions available to vote on.</p>
              <p className="text-slate-500 text-sm mt-2">Check back later for new content!</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>Your votes help improve our caption recommendations</p>
        </footer>
      </div>
    </main>
  );
}
