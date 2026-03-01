import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.json({ 
      error: 'Not logged in',
      hint: 'Go to the main app and log in first, then come back here'
    });
  }

  return NextResponse.json({
    access_token: session.access_token,
    expires_at: new Date(session.expires_at! * 1000).toISOString(),
    user_id: session.user.id,
    email: session.user.email
  });
}
