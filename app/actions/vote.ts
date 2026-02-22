'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitVote(captionId: string, voteValue: 1 | -1) {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be logged in to vote' };
  }

  // Check if user has already voted on this caption
  const { data: existingVote } = await supabase
    .from('caption_votes')
    .select('id, vote_value')
    .eq('caption_id', captionId)
    .eq('profile_id', user.id)
    .single();

  if (existingVote) {
    // User already voted - update their vote if different
    if (existingVote.vote_value !== voteValue) {
      const { error: updateError } = await supabase
        .from('caption_votes')
        .update({ 
          vote_value: voteValue,
          modified_datetime_utc: new Date().toISOString()
        })
        .eq('id', existingVote.id);

      if (updateError) {
        return { error: 'Failed to update vote: ' + updateError.message };
      }
    }
    // If same vote, just return success
    revalidatePath('/protected');
    return { success: true, action: 'updated' };
  }

  // Insert new vote
  const { error: insertError } = await supabase
    .from('caption_votes')
    .insert({
      caption_id: captionId,
      profile_id: user.id,
      vote_value: voteValue,
      created_datetime_utc: new Date().toISOString(),
      modified_datetime_utc: new Date().toISOString()
    });

  if (insertError) {
    return { error: 'Failed to submit vote: ' + insertError.message };
  }

  revalidatePath('/protected');
  return { success: true, action: 'created' };
}
