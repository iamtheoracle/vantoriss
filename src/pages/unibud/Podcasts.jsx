import React from 'react';
import { Radio, ArrowRight } from 'lucide-react';

const highlights = [
          {
            title: 'Featured shows',
            description: 'Surface thought-provoking episodes from alumni, faculty, and student creators.',
          },
          {
            title: 'Study audio',
            description: 'Queue revision explainers, focus mixes, and productivity sessions for deep work.',
          },
          {
            title: 'Creator studio',
            description: 'Preview upcoming releases, audience analytics, and collaborative recording plans.',
          },
];

export default function Podcasts() {
  return (
    <main className="flex-1 px-4 pb-8 pt-6 sm:px-6">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-2xl shadow-purple-900/20 backdrop-blur-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-violet-200">
          <Radio size={14} />
          UNIBUD
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Podcasts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">Audio stories, learning series, and creator-led conversations curated for campus life.</p>
      </section>

      <section className="mt-6 grid gap-4">
        {highlights.map((item) => (
          <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                <ArrowRight size={18} />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
