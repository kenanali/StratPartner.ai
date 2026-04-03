import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background: #f7f7f4;
          color: #1a1a1a;
        }

        /* ── NAV ── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(15,15,26,0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(99,102,241,0.12);
          padding: 0 64px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6366f1;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.15s;
        }

        .nav-link:hover {
          color: #c7d2fe;
        }

        .nav-link-primary {
          font-size: 12px;
          font-weight: 600;
          color: #818cf8;
          text-decoration: none;
          transition: color 0.15s;
        }

        .nav-link-primary:hover {
          color: #a5b4fc;
        }

        /* ── HERO ── */
        .hero {
          background: #0f0f1a;
          padding: 72px 64px 64px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: -120px; right: -120px;
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .wordmark {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 48px;
        }

        .hero-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 20px;
        }

        .hero-headline {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.15;
          color: #ffffff;
          max-width: 680px;
          margin-bottom: 28px;
          letter-spacing: -1px;
        }

        .hero-headline em {
          font-style: normal;
          color: #818cf8;
        }

        .hero-sub {
          font-size: 17px;
          line-height: 1.65;
          color: #9ca3af;
          max-width: 560px;
          margin-bottom: 48px;
        }

        .hero-tags {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #6366f1;
          border: 1px solid rgba(99,102,241,0.35);
          padding: 5px 14px;
          border-radius: 100px;
        }

        /* ── SECTIONS ── */
        .section {
          padding: 64px;
          border-bottom: 1px solid #e8e8e4;
        }

        .section:last-of-type {
          border-bottom: none;
        }

        .section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 28px;
        }

        /* ── PROBLEM ── */
        .problem-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
        }

        .problem-card {
          background: #fff;
          border: 1px solid #e8e8e4;
          border-radius: 12px;
          padding: 28px 24px;
        }

        .problem-number {
          font-size: 32px;
          font-weight: 800;
          color: #e8e8e4;
          margin-bottom: 12px;
          font-variant-numeric: tabular-nums;
        }

        .problem-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .problem-body {
          font-size: 13px;
          line-height: 1.65;
          color: #666;
        }

        /* ── SOLUTION ── */
        .solution-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }

        .solution-text h2 {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.5px;
          color: #1a1a1a;
          margin-bottom: 20px;
        }

        .solution-text p {
          font-size: 15px;
          line-height: 1.7;
          color: #444;
        }

        .how-it-works {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .step {
          display: flex;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid #f0f0ec;
        }

        .step:last-child { border-bottom: none; }

        .step-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .step-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .step-body {
          font-size: 13px;
          line-height: 1.6;
          color: #666;
        }

        /* ── SKILLS ── */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-top: 8px;
        }

        .skill-card {
          background: #fff;
          border: 1px solid #e8e8e4;
          border-radius: 12px;
          padding: 22px 18px;
          transition: border-color 0.2s;
        }

        .skill-icon {
          font-size: 22px;
          margin-bottom: 12px;
        }

        .skill-name {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }

        .skill-desc {
          font-size: 11px;
          line-height: 1.55;
          color: #888;
        }

        /* ── DIFFERENTIATORS ── */
        .diff-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .diff-card {
          background: #fff;
          border: 1px solid #e8e8e4;
          border-radius: 12px;
          padding: 28px 24px;
        }

        .diff-card.dark {
          background: #0f0f1a;
          border-color: #1e1e2e;
        }

        .diff-title {
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .diff-card.dark .diff-title { color: #fff; }

        .diff-body {
          font-size: 13px;
          line-height: 1.65;
          color: #666;
        }

        .diff-card.dark .diff-body { color: #9ca3af; }

        .diff-highlight {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 10px;
        }

        /* ── FEATURES ── */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .feature-card {
          border-left: 2px solid #6366f1;
          padding-left: 16px;
          padding-top: 2px;
          padding-bottom: 2px;
        }

        .feature-title {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 6px;
        }

        .feature-body {
          font-size: 12px;
          line-height: 1.6;
          color: #666;
        }

        /* ── AUDIENCE ── */
        .audience-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .audience-card {
          background: #fff;
          border: 1px solid #e8e8e4;
          border-radius: 12px;
          padding: 28px 24px;
        }

        .audience-type {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 8px;
        }

        .audience-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 10px;
        }

        .audience-body {
          font-size: 13px;
          line-height: 1.65;
          color: #666;
        }

        /* ── FOOTER ── */
        .footer {
          background: #0f0f1a;
          padding: 40px 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-brand {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6366f1;
        }

        .footer-meta {
          font-size: 11px;
          color: #444;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .footer-link {
          color: #555;
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-link:hover { color: #818cf8; }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .nav {
            padding: 0 24px;
          }

          .hero {
            padding: 48px 24px 44px;
          }

          .hero::before {
            width: 240px;
            height: 240px;
            top: -40px;
            right: -40px;
          }

          .wordmark {
            margin-bottom: 28px;
          }

          .hero-headline {
            font-size: 30px;
            letter-spacing: -0.5px;
            max-width: 100%;
          }

          .hero-sub {
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 32px;
            max-width: 100%;
          }

          .section {
            padding: 44px 24px;
          }

          .problem-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .problem-card {
            padding: 22px 20px;
          }

          .solution-wrap {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .solution-text h2 {
            font-size: 22px;
          }

          .skills-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .skill-card {
            padding: 18px 14px;
          }

          .diff-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .diff-card {
            padding: 22px 20px;
          }

          .features-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px 24px;
          }

          .audience-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .audience-card {
            padding: 22px 20px;
          }

          .footer {
            padding: 32px 24px;
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }

          .footer-meta {
            flex-wrap: wrap;
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .nav {
            padding: 0 16px;
          }

          .hero {
            padding: 40px 16px 36px;
          }

          .hero-headline {
            font-size: 26px;
          }

          .section {
            padding: 36px 16px;
          }

          .skills-grid {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .footer {
            padding: 28px 16px;
          }
        }

        @media print {
          .nav { display: none; }
          body { background: white; }
          .hero { padding: 40px; }
          .section { padding: 40px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <span className="nav-brand">stratpartner.ai</span>
        <div className="nav-links">
          <Link href="/explore" className="nav-link">Explore</Link>
          <Link href="/login" className="nav-link-primary">Sign in →</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="wordmark">stratpartner.ai</div>
        <div className="hero-eyebrow">Product Overview · April 2026</div>
        <h1 className="hero-headline">
          The senior strategist that<br/>
          <em>never leaves the project.</em>
        </h1>
        <p className="hero-sub">
          Joins every client call. Remembers everything. Executes methodology-grade strategy deliverables between sessions — so you spend your time on thinking, not rebuilding context.
        </p>
        <div className="hero-tags">
          <span className="tag">Meeting Intelligence</span>
          <span className="tag">Strategy Skills</span>
          <span className="tag">Persistent Project Memory</span>
          <span className="tag">Built for Practitioners</span>
        </div>
      </div>

      {/* PROBLEM */}
      <div className="section">
        <div className="section-label">The Problem</div>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-number">01</div>
            <div className="problem-title">Context dies between sessions</div>
            <div className="problem-body">Every time a project resumes, senior strategists spend hours rebuilding context that already exists — scattered across meeting notes, emails, and their own memory. It&apos;s invisible rework that eats billable time.</div>
          </div>
          <div className="problem-card">
            <div className="problem-number">02</div>
            <div className="problem-title">Senior output doesn&apos;t scale</div>
            <div className="problem-body">Producing consistent, senior-level strategy deliverables — competitive audits, personas, landscape analyses — requires scarce senior time. Junior teams produce inconsistent work that needs heavy revision. The bottleneck never moves.</div>
          </div>
          <div className="problem-card">
            <div className="problem-number">03</div>
            <div className="problem-title">Meeting tools stop at transcription</div>
            <div className="problem-body">Otter, Fireflies, and Gong capture what was said. None of them translate it into strategic action. The gap between &ldquo;what the client told us&rdquo; and &ldquo;the competitive audit it implies&rdquo; is still filled manually, every time.</div>
          </div>
        </div>
      </div>

      {/* SOLUTION */}
      <div className="section">
        <div className="section-label">How It Works</div>
        <div className="solution-wrap">
          <div className="solution-text">
            <h2>Strategy that shows up, follows through, and never forgets.</h2>
            <p>stratpartner.ai combines live meeting intelligence with a library of practitioner-grade strategy skills and a persistent project memory that compounds over time. It doesn&apos;t just record what happened — it understands the strategic implications and executes on them between sessions.</p>
          </div>
          <div className="how-it-works">
            <div className="step">
              <div className="step-icon">📞</div>
              <div>
                <div className="step-title">Joins your strategy sessions</div>
                <div className="step-body">The meeting bot attends client calls, strategy workshops, and briefs. It captures decisions, open questions, competitive signals, and context — not just a transcript.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">🧠</div>
              <div>
                <div className="step-title">Builds project intelligence over time</div>
                <div className="step-body">Every session deepens the system&apos;s understanding of the client&apos;s business, competitive landscape, and strategic priorities. Context compounds — it doesn&apos;t reset.</div>
              </div>
            </div>
            <div className="step">
              <div className="step-icon">⚡</div>
              <div>
                <div className="step-title">Executes strategy skills between sessions</div>
                <div className="step-body">Based on what it learned, the system runs practitioner-grade skills — delivering ready-to-present outputs before you need them, without a brief from scratch.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SKILLS */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="section-label">Strategy Skills</div>
        <div className="skills-grid">
          <div className="skill-card">
            <div className="skill-icon">👤</div>
            <div className="skill-name">Persona Build</div>
            <div className="skill-desc">Research-grounded customer personas using Jobs-to-be-Done and emotional driver mapping</div>
          </div>
          <div className="skill-card">
            <div className="skill-icon">🗺️</div>
            <div className="skill-name">Customer Journey</div>
            <div className="skill-desc">Moment-by-moment journey maps with emotional scoring, pain points, and opportunity areas</div>
          </div>
          <div className="skill-card">
            <div className="skill-icon">🔍</div>
            <div className="skill-name">Competitive Audit</div>
            <div className="skill-desc">Structured competitor analysis across positioning, messaging, offering, and experience</div>
          </div>
          <div className="skill-card">
            <div className="skill-icon">🌐</div>
            <div className="skill-name">Landscape Analysis</div>
            <div className="skill-desc">Market mapping that surfaces white space, category tensions, and strategic opportunity</div>
          </div>
          <div className="skill-card">
            <div className="skill-icon">🎯</div>
            <div className="skill-name">Brand Positioning</div>
            <div className="skill-desc">Positioning territories, value propositions, and messaging frameworks grounded in real audience insight</div>
          </div>
        </div>
      </div>

      {/* DIFFERENTIATORS */}
      <div className="section">
        <div className="section-label">Why It&apos;s Different</div>
        <div className="diff-grid">
          <div className="diff-card dark">
            <div className="diff-highlight">Unfair Advantage</div>
            <div className="diff-title">The context moat</div>
            <div className="diff-body">After 90 days of active use, the system holds more accumulated intelligence about a client&apos;s strategic situation than any competing tool. Switching doesn&apos;t mean changing software — it means losing months of accumulated project memory. That&apos;s a structural lock-in, not a feature.</div>
          </div>
          <div className="diff-card">
            <div className="diff-highlight">Not Generic AI</div>
            <div className="diff-title">Practitioner methodology, not prompts</div>
            <div className="diff-body">Every skill is built on frameworks developed through real client work — not assembled from internet data. The outputs hold up in the client room because they were designed by someone who&apos;s been in that room.</div>
          </div>
          <div className="diff-card">
            <div className="diff-highlight">Category Distinction</div>
            <div className="diff-title">The only tool that joins the meeting</div>
            <div className="diff-body">Meeting tools don&apos;t do strategy. Strategy tools don&apos;t join meetings. stratpartner.ai is the first to combine live meeting intelligence with methodology-grade strategic execution — a category that doesn&apos;t yet have an owner.</div>
          </div>
          <div className="diff-card">
            <div className="diff-highlight">Compounding Value</div>
            <div className="diff-title">Gets smarter every session</div>
            <div className="diff-body">Generic AI resets with every conversation. stratpartner.ai builds forward — each session adds to the project&apos;s strategic intelligence, making every output more specific, more accurate, and more useful than the last.</div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="section" style={{ background: '#fff' }}>
        <div className="section-label">Platform Features</div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-title">Research-grade chat</div>
            <div className="feature-body">Searches the web in real time — competitor filings, job postings, pricing pages, news. Every source linked.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Meeting intelligence</div>
            <div className="feature-body">Paste a Zoom, Meet, or Teams URL. Joins, transcribes, extracts decisions and action items, sends a briefing when it ends. Powered by Recall.ai.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Org memory</div>
            <div className="feature-body">Every fact, decision, and insight is captured and categorised — surfaced automatically in the right conversation.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Deliverables library</div>
            <div className="feature-body">Every structured output is saved to your project — searchable, shareable, and used as context in future chats.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Multi-project</div>
            <div className="feature-body">Run separate projects for different clients or initiatives. Each has its own memory, deliverables, and context.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Built on Claude</div>
            <div className="feature-body">Powered by Anthropic&apos;s Claude, Recall.ai, VAPI, Brave Search, and Supabase — best-in-class infrastructure for every layer.</div>
          </div>
        </div>
      </div>

      {/* AUDIENCE */}
      <div className="section">
        <div className="section-label">Built For</div>
        <div className="audience-grid">
          <div className="audience-card">
            <div className="audience-type">Primary</div>
            <div className="audience-title">Boutique strategy consultants</div>
            <div className="audience-body">Solo to 10-person shops billing by the hour across brand, CX, and marketing strategy engagements. Time is the constraint. Context loss is the tax. stratpartner.ai removes both — delivering senior-level outputs without the senior-level timeline.</div>
          </div>
          <div className="audience-card">
            <div className="audience-type">Primary</div>
            <div className="audience-title">Agency strategy teams</div>
            <div className="audience-body">10–50 person shops running multi-month client engagements across strategy, CX, and brand. Senior time is scarce and junior output is inconsistent. stratpartner.ai levels the team — so anyone can produce work that holds up in the room.</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="footer">
        <div className="footer-brand">stratpartner.ai</div>
        <div className="footer-meta">
          <span>Kenan Mir · kenanmir@gmail.com · April 2026 · Confidential</span>
          <Link href="/explore" className="footer-link">Explore →</Link>
          <Link href="/login" className="footer-link">Sign in</Link>
        </div>
      </div>
    </>
  )
}
