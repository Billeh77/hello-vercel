import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { CaptionVoting } from '@/components/CaptionVoting';

export const revalidate = 0; // Always fetch fresh data

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch captions first (only public captions)
  const { data: captions, error: captionsError } = await supabase
    .from('captions')
    .select('id, content, like_count, image_id')
    .eq('is_public', true)
    .order('created_datetime_utc', { ascending: false })
    .limit(50);

  // Get unique image IDs from captions
  const imageIds = [...new Set(captions?.map(c => c.image_id).filter(Boolean) || [])] as string[];

  // Fetch images separately - DON'T filter by is_public since caption is already public
  let images: { id: string; url: string; image_description: string | null }[] | null = null;
  
  if (imageIds.length > 0) {
    const result = await supabase
      .from('images')
      .select('id, url, image_description')
      .in('id', imageIds);
    
    images = result.data;
  }

  // Create a map for quick image lookup
  const imageMap = new Map(images?.map(img => [img.id, img]) || []);

  // Debug: Check if IDs match
  const firstCaptionImageId = captions?.[0]?.image_id;
  const firstImageId = images?.[0]?.id;
  const lookupResult = firstCaptionImageId ? imageMap.get(firstCaptionImageId) : null;

  // Combine captions with their images - keep ALL captions, some may have null images
  const allCaptionsWithImages = captions?.map(caption => {
    const image = caption.image_id ? imageMap.get(caption.image_id) : undefined;
    return { ...caption, images: image || null };
  }) || [];

  // Filter to only captions with images for display (RLS may block some)
  const captionsWithImages = allCaptionsWithImages.filter(c => c.images !== null);

  // Fetch user's existing votes
  const { data: userVotes } = await supabase
    .from('caption_votes')
    .select('caption_id')
    .eq('profile_id', user.id);

  const votedCaptionIds = userVotes?.map(v => v.caption_id) || [];

  // Debug info
  const debugInfo = {
    captionsCount: captions?.length || 0,
    imageIdsCount: imageIds.length,
    imagesCount: images?.length || 0,
    imageMapSize: imageMap.size,
    captionsWithImagesCount: captionsWithImages.length,
    firstCaptionImageId,
    firstImageId,
    lookupWorked: !!lookupResult,
    sampleImageIds: imageIds.slice(0, 3),
    sampleReturnedIds: images?.slice(0, 3).map(i => i.id),
  };

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

        {/* Debug Info - will remove once working */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg text-xs font-mono text-slate-400 overflow-x-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
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
            captions={captionsWithImages as any} 
            votedCaptionIds={votedCaptionIds} 
          />
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-lg">No captions with images available.</p>
              <p className="text-slate-500 text-sm mt-2">
                {captionsError ? `Error: ${captionsError.message}` : `Found ${captions?.length || 0} captions but ${captionsWithImages.length} have accessible images.`}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>
            Your votes help improve our caption recommendations
          </p>
        </footer>
      </div>
    </main>
  );
}
