import { supabase } from '@/lib/supabase';

type UniversityMajor = {
  id: string;
  name: string;
};

export const revalidate = 60; // Revalidate every 60 seconds

async function getUniversityMajors() {
  const { data, error } = await supabase
    .from('university_majors')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching university majors:', error);
    return [];
  }

  return data as UniversityMajor[];
}

export default async function Home() {
  const majors = await getUniversityMajors();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            University Majors
          </h1>
          <p className="text-slate-400 text-lg">
            Explore {majors.length} academic programs from our database
          </p>
        </header>

        {majors.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-lg">No majors found in the database.</p>
              <p className="text-slate-500 text-sm mt-2">Check your Supabase connection and RLS policies.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {majors.map((major, index) => (
              <div
                key={major.id}
                className="group relative overflow-hidden rounded-xl bg-slate-800/40 border border-slate-700/50 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/60 hover:border-purple-500/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-mono">
                      {index + 1}
                    </span>
                    <h2 className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {major.name}
                    </h2>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>
            Data fetched from{' '}
            <span className="text-purple-400 font-medium">Supabase</span>
            {' '}• Built with{' '}
            <span className="text-cyan-400 font-medium">Next.js</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
