'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAccessToken(): Promise<{ token: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return { token: null, error: error?.message || 'Not authenticated' };
  }

  return { token: session.access_token, error: null };
}
