import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          Hello World
        </h1>
        <p className="text-xl text-slate-400 mb-12">
          A Next.js app with Supabase authentication and data
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Signed in as {user.email}
              </div>
              <Link
                href="/protected"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                View Protected Content
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                Sign in with Google
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/protected"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:border-purple-500/50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Try Protected Route
              </Link>
            </>
          )}
        </div>

        <footer className="mt-16 text-slate-500 text-sm">
          <p>
            Built with{' '}
            <span className="text-cyan-400">Next.js</span>
            {' '}•{' '}
            <span className="text-purple-400">Supabase</span>
            {' '}•{' '}
            <span className="text-pink-400">Google OAuth</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
