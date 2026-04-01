import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans">

      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <span className="font-display font-bold text-base tracking-tight">StratPartner</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/explore" className="text-gray-500 hover:text-[#111111] transition-colors">
              Explore
            </Link>
            <Link
              href="/login"
              className="text-[#111111] font-medium hover:text-[#8B5CF6] transition-colors"
            >
              Sign in →
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">

        {/* What it is */}
        <section className="pt-20 pb-16 border-b border-gray-100">
          <h1 className="font-display text-4xl font-bold leading-tight">StratPartner</h1>
          <p className="mt-3 text-lg text-gray-500 font-medium">
            An AI strategy partner for consultants and leadership teams.
          </p>
          <p className="mt-5 text-base text-gray-600 max-w-2xl leading-relaxed">
            It combines a research-grade chat interface, a library of strategy frameworks, and
            meeting intelligence — so strategy work that used to take days can happen in a single
            conversation.
          </p>
        </section>

        {/* Problems */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
            What problems it solves
          </h2>
          <ol className="space-y-8">
            <li className="flex gap-5">
              <span className="text-[#8B5CF6] font-display font-bold text-lg shrink-0 w-5">1</span>
              <div>
                <p className="font-semibold text-[#111111]">Strategy work takes too long.</p>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Research, synthesis, and structured output used to require a team of analysts.
                  StratPartner runs the work directly in chat.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-[#8B5CF6] font-display font-bold text-lg shrink-0 w-5">2</span>
              <div>
                <p className="font-semibold text-[#111111]">Context gets lost.</p>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Decisions made in meetings, context shared in documents, insights from past
                  projects — StratPartner captures all of it and uses it in every future
                  conversation.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-[#8B5CF6] font-display font-bold text-lg shrink-0 w-5">3</span>
              <div>
                <p className="font-semibold text-[#111111]">Frameworks are underused.</p>
                <p className="mt-1 text-gray-500 text-sm leading-relaxed">
                  Most teams know what a customer journey map or SWOT analysis is, but rarely run
                  them rigorously. StratPartner runs them completely, with your actual data.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Core value */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-gray-400 mb-6">
            The core idea
          </h2>
          <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
            A strategy partner that gets smarter the more you work with it. StratPartner learns your
            organisation — your market, your team, your priorities — and uses that memory in every
            conversation. The more you use it, the more context it carries.
          </p>
        </section>

        {/* How it works */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
            How it works
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Describe your organisation and goals.',
                body: 'Set up a project, share context, and StratPartner starts building an understanding of your business.',
              },
              {
                step: '02',
                title: 'Work in the chat.',
                body: 'Ask questions, request research, run frameworks. StratPartner searches the web when it needs to, cites sources, and streams answers in real time.',
              },
              {
                step: '03',
                title: 'Every output is saved.',
                body: 'Deliverables — competitive analyses, personas, journey maps — are saved to your project and used as context in future conversations.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-6">
                <span className="font-mono text-xs text-gray-300 pt-0.5 shrink-0 w-6">{step}</span>
                <div>
                  <p className="font-semibold text-[#111111] text-sm">{title}</p>
                  <p className="mt-1 text-gray-500 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-b border-gray-100">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: 'Research-grade chat',
                body: 'Searches the web in real time — competitor filings, job postings, pricing pages, news. Every source linked.',
              },
              {
                title: 'Strategy skills',
                body: '40+ built-in frameworks activated by a command — /journey-map, /persona-build, /biz-case. Runs the full framework with your data.',
              },
              {
                title: 'Meeting intelligence',
                body: 'Paste a Zoom, Meet, or Teams URL. StratPartner joins, transcribes, extracts decisions and action items, and sends a briefing when it ends. Powered by Recall.ai.',
              },
              {
                title: 'Org memory',
                body: 'Every fact, decision, and insight is captured and categorised — surfaced automatically in the right conversation.',
              },
              {
                title: 'Deliverables library',
                body: 'Every structured output is saved to your project — searchable, shareable, and used as context in future chats.',
              },
              {
                title: 'Multi-project',
                body: 'Run separate projects for different clients, products, or initiatives. Each has its own memory and deliverables.',
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="border-l-2 border-[#8B5CF6] pl-4 py-1"
              >
                <p className="font-semibold text-sm text-[#111111]">{title}</p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built with */}
        <section className="py-12">
          <p className="text-xs text-gray-400">
            Built on:{' '}
            <span className="text-gray-500">Claude (Anthropic)</span>
            {' · '}
            <span className="text-gray-500">Recall.ai</span>
            {' · '}
            <span className="text-gray-500">VAPI</span>
            {' · '}
            <span className="text-gray-500">Brave Search</span>
            {' · '}
            <span className="text-gray-500">Supabase</span>
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-6 h-12 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-display font-semibold">StratPartner</span>
          <nav className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/explore" className="hover:text-gray-600 transition-colors">Explore</Link>
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
          </nav>
        </div>
      </footer>

    </div>
  )
}
