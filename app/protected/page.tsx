import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/LogoutButton';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch university majors for the protected content
  const { data: majors } = await supabase
    .from('university_majors')
    .select('*')
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* User Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-purple-500/50"
              />
            )}
            <div>
              <h2 className="text-lg font-medium text-white">
                {user.user_metadata?.full_name || user.email}
              </h2>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        {/* Protected Content Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Protected Content
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            University Majors
          </h1>
          <p className="text-slate-400 text-lg">
            You have access to {majors?.length || 0} academic programs
          </p>
        </header>

        {/* Majors Grid */}
        {majors && majors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {majors.map((major, index) => (
              <div
                key={major.id}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 border border-slate-700/50 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 hover:border-purple-500/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-mono">
                      {index + 1}
                    </span>
                    <h3 className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {major.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-lg">No majors found in the database.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>
            Authenticated via{' '}
            <span className="text-green-400 font-medium">Google OAuth</span>
            {' '}• Data from{' '}
            <span className="text-purple-400 font-medium">Supabase</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
