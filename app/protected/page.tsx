import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';
import { CaptionVoting } from '@/components/CaptionVoting';
import { ImageUpload } from '@/components/ImageUpload';

export const revalidate = 0;

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch ALL images
  const { data: allImages } = await supabase
    .from('images')
    .select('id, url, image_description, is_public');

  // 2. Fetch ALL captions
  const { data: allCaptions } = await supabase
    .from('captions')
    .select('id, content, like_count, image_id, is_public');

  // 3. Filter images: only public ones
  const publicImages = allImages?.filter(img => img.is_public === true) || [];

  // 4. Filter captions: only ones with non-null content
  const validCaptions = allCaptions?.filter(cap => cap.content !== null && cap.content !== '') || [];

  // 5. Create image lookup map
  const imageMap = new Map(publicImages.map(img => [img.id, img]));

  // 6. Match captions to public images
  const captionsWithImages = validCaptions
    .filter(cap => imageMap.has(cap.image_id))
    .map(cap => ({
      id: cap.id,
      content: cap.content,
      like_count: cap.like_count,
      image_id: cap.image_id,
      images: imageMap.get(cap.image_id)!
    }));

  // 7. Get user's existing votes
  const { data: userVotes } = await supabase
    .from('caption_votes')
    .select('caption_id')
    .eq('profile_id', user.id);

  const votedCaptionIds = userVotes?.map(v => v.caption_id) || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-3 max-w-4xl mx-auto w-full">
        {/* User Header - compact */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-purple-500/50"
              />
            )}
            <div>
              <h2 className="text-xs font-medium text-white">
                {user.user_metadata?.full_name || user.email}
              </h2>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Image Upload Section */}
        <div className="mb-4 flex-shrink-0 max-w-lg mx-auto w-full">
          <ImageUpload />
        </div>

        {/* Caption Voting - takes remaining space */}
        {captionsWithImages.length > 0 ? (
          <CaptionVoting 
            captions={captionsWithImages} 
            votedCaptionIds={votedCaptionIds} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-lg">No captions available to vote on.</p>
              <p className="text-slate-500 text-sm mt-2">Check back later for new content!</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
