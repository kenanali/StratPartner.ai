/**
 * Seed 126 GTM skills into the database.
 * Run with: npx tsx scripts/seed-gtm-skills.ts
 *
 * Prerequisites:
 * - .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * - Migrations 0001–0003 must be applied
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ── Type definitions ──────────────────────────────────────────────────────────

interface SkillInput {
  name: string
  description: string
  required: boolean
}

interface SkillOutput {
  name: string
  description: string
}

interface GTMSkill {
  slug: string
  name: string
  title: string
  description: string
  content: string
  prompt_injection: string
  track: string
  skill_type: 'tool' | 'workflow' | 'playbook'
  category: string
  inputs: SkillInput[]
  outputs: SkillOutput[]
  trigger_phrases: string[]
  connects_to: string[]
  auto_save: boolean
}

// ── Helper ────────────────────────────────────────────────────────────────────

function skill(
  slug: string,
  name: string,
  description: string,
  skill_type: 'tool' | 'workflow' | 'playbook',
  category: string,
  inputs: SkillInput[],
  outputs: SkillOutput[],
  trigger_phrases: string[],
  connects_to: string[] = []
): GTMSkill {
  return {
    slug,
    name,
    title: name,
    description,
    content: description,
    prompt_injection: description,
    track: 'gtm',
    skill_type,
    category,
    inputs,
    outputs,
    trigger_phrases,
    connects_to,
    auto_save: false,
  }
}

// ── Capabilities (tool) ───────────────────────────────────────────────────────

const CAPABILITIES: GTMSkill[] = [
  skill(
    'aeo',
    'Answer Engine Optimisation',
    'Optimise content to appear in AI-generated answers and featured snippets. Analyses your existing content and rewrites or structures it for maximum visibility in AI-powered search results.',
    'tool',
    'seo',
    [
      { name: 'Target URL', description: 'URL of the page to optimise for AEO', required: true },
      { name: 'Target keywords', description: 'Primary keywords or questions to target', required: true },
      { name: 'Competitor URLs', description: 'Competitor pages currently ranking in AI answers', required: false },
    ],
    [
      { name: 'Optimised content', description: 'Rewritten content structured for AI answer engines' },
      { name: 'Schema markup', description: 'Recommended structured data to add to the page' },
      { name: 'AEO score', description: 'Before/after readiness score for AI answer placement' },
    ],
    ['optimise for AI answers', 'AEO audit', '/aeo']
  ),

  skill(
    'agentmail',
    'Agent Email Sender',
    'Send personalised outreach emails via AI agent automation. Connects to your email provider to dispatch sequences at scale with per-recipient personalisation tokens.',
    'tool',
    'outreach',
    [
      { name: 'Recipient list', description: 'CSV or JSON list of recipients with contact fields', required: true },
      { name: 'Email template', description: 'Email body with personalisation placeholders', required: true },
      { name: 'Sender name', description: 'Name to display in the From field', required: false },
    ],
    [
      { name: 'Send report', description: 'Summary of emails sent, delivered, and failed' },
      { name: 'Personalised previews', description: 'Sample rendered emails for spot-checking' },
    ],
    ['send outreach emails', 'email blast', '/agentmail']
  ),

  skill(
    'apollo-lead-finder',
    'Apollo Lead Finder',
    'Find and extract qualified leads from the Apollo.io database using job title, industry, company size, and geography filters.',
    'tool',
    'lead-generation',
    [
      { name: 'Job titles', description: 'Target job titles or seniority levels', required: true },
      { name: 'Industries', description: 'Target industry verticals', required: true },
      { name: 'Company size', description: 'Employee count range (e.g. 50–500)', required: false },
      { name: 'Geography', description: 'Target countries or regions', required: false },
    ],
    [
      { name: 'Lead list', description: 'Qualified leads with name, title, company, and email' },
      { name: 'Lead count', description: 'Total number of leads found matching criteria' },
    ],
    ['find leads on Apollo', 'Apollo lead search', '/apollo-lead-finder']
  ),

  skill(
    'blog-scraper',
    'Blog Content Scraper',
    'Scrape and analyse competitor blog content to surface topics, cadence, SEO angles, and content gaps for your own strategy.',
    'tool',
    'research',
    [
      { name: 'Blog URL', description: 'URL of the blog or blog index page to scrape', required: true },
      { name: 'Date range', description: 'Limit scraping to posts published within this period', required: false },
      { name: 'Max posts', description: 'Maximum number of posts to analyse', required: false },
    ],
    [
      { name: 'Content catalogue', description: 'List of posts with titles, dates, topics, and word counts' },
      { name: 'Topic clusters', description: 'Grouped themes and recurring content patterns' },
      { name: 'Content gap report', description: 'Topics competitors cover that you do not' },
    ],
    ['scrape competitor blog', 'analyse blog content', '/blog-scraper']
  ),

  skill(
    'brainstorming-partner',
    'Brainstorming Partner',
    'Generate strategic ideas and creative solutions through structured brainstorming sessions. Uses proven ideation frameworks to explore angles you might miss working alone.',
    'tool',
    'research',
    [
      { name: 'Challenge or goal', description: 'The problem or opportunity to brainstorm around', required: true },
      { name: 'Context', description: 'Relevant background about your company, product, or market', required: false },
      { name: 'Constraints', description: 'Budget, timeline, or resource constraints to respect', required: false },
    ],
    [
      { name: 'Idea list', description: 'Ranked list of ideas with rationale for each' },
      { name: 'Prioritised shortlist', description: 'Top 3 ideas recommended for immediate action' },
    ],
    ['brainstorm ideas', 'help me think through', '/brainstorming-partner']
  ),

  skill(
    'brand-voice-extractor',
    'Brand Voice Extractor',
    'Extract and codify brand voice, tone, and messaging patterns from existing content so your team can write on-brand consistently.',
    'tool',
    'brand',
    [
      { name: 'Content samples', description: 'URLs or pasted text representing your best on-brand content', required: true },
      { name: 'Brand name', description: 'Your company or brand name', required: true },
    ],
    [
      { name: 'Brand voice guide', description: 'Documented tone, style, and vocabulary rules' },
      { name: 'Do/Don\'t examples', description: 'Side-by-side on-brand vs off-brand writing samples' },
    ],
    ['extract brand voice', 'document our tone of voice', '/brand-voice-extractor']
  ),

  skill(
    'champion-tracker',
    'Champion Tracker',
    'Track and engage internal champions within target accounts, monitoring job changes, promotions, and LinkedIn activity to surface timely outreach triggers.',
    'tool',
    'sales',
    [
      { name: 'Champion list', description: 'Names and LinkedIn URLs of internal champions to track', required: true },
      { name: 'Tracking frequency', description: 'How often to check for updates (daily/weekly)', required: false },
    ],
    [
      { name: 'Champion updates', description: 'Recent activity, promotions, or job changes for each champion' },
      { name: 'Outreach triggers', description: 'Specific events that warrant reaching out now' },
    ],
    ['track my champions', 'monitor champion accounts', '/champion-tracker']
  ),

  skill(
    'cold-email-outreach',
    'Cold Email Outreach',
    'Create and send personalised cold email sequences tailored to specific prospect segments, with A/B subject line testing and reply tracking.',
    'tool',
    'outreach',
    [
      { name: 'Prospect list', description: 'List of prospects with name, company, and email', required: true },
      { name: 'Value proposition', description: 'The core offer or pain point you are addressing', required: true },
      { name: 'Sequence length', description: 'Number of follow-up emails in the sequence', required: false },
    ],
    [
      { name: 'Email sequence', description: 'Full multi-step email sequence with subject lines and body copy' },
      { name: 'Personalisation map', description: 'Per-prospect personalisation tokens and angles' },
    ],
    ['write cold emails', 'create an outreach sequence', '/cold-email-outreach']
  ),

  skill(
    'company-contact-finder',
    'Company Contact Finder',
    'Find key decision-maker contacts within target companies using job title matching and verified email enrichment.',
    'tool',
    'lead-generation',
    [
      { name: 'Company name or URL', description: 'Target company name or website URL', required: true },
      { name: 'Target roles', description: 'Job titles or departments to find contacts for', required: true },
    ],
    [
      { name: 'Contact list', description: 'Key contacts with name, title, email, and LinkedIn URL' },
      { name: 'Org chart snippet', description: 'Partial org chart showing reporting relationships' },
    ],
    ['find contacts at a company', 'who do I contact at', '/company-contact-finder']
  ),

  skill(
    'competitor-post-engagers',
    'Competitor Post Engagers',
    'Find and extract people who interact with competitor LinkedIn or social content — a pre-warmed pool of buyers who already care about your category.',
    'tool',
    'competitive-intel',
    [
      { name: 'Competitor LinkedIn URL', description: 'LinkedIn company page or profile URL', required: true },
      { name: 'Post URL', description: 'Specific post URL to extract engagers from', required: false },
      { name: 'Engagement type', description: 'Filter by likes, comments, or shares', required: false },
    ],
    [
      { name: 'Engager list', description: 'People who engaged with the post including name, title, and company' },
      { name: 'ICP match score', description: 'ICP fit rating for each engager' },
    ],
    ['find competitor post engagers', 'who liked my competitor\'s post', '/competitor-post-engagers']
  ),

  skill(
    'conference-speaker-scraper',
    'Conference Speaker Scraper',
    'Extract speaker lists, bios, and contact data from conference and event websites to identify thought leaders and sales prospects.',
    'tool',
    'research',
    [
      { name: 'Conference URL', description: 'URL of the conference or event website', required: true },
      { name: 'Target roles', description: 'Speaker roles or topics to filter by', required: false },
    ],
    [
      { name: 'Speaker list', description: 'Speakers with name, title, company, bio, and LinkedIn URL' },
      { name: 'Contact data', description: 'Emails or contact links where publicly available' },
    ],
    ['scrape conference speakers', 'find speakers at', '/conference-speaker-scraper']
  ),

  skill(
    'contact-cache',
    'Contact Cache',
    'Store and retrieve enriched contact information across your GTM workflows, acting as a persistent lookup layer for prospect and customer data.',
    'tool',
    'lead-generation',
    [
      { name: 'Contacts to store', description: 'Contact records in CSV or JSON format', required: false },
      { name: 'Lookup query', description: 'Name, email, or company to retrieve from the cache', required: false },
    ],
    [
      { name: 'Contact record', description: 'Enriched contact with all stored fields' },
      { name: 'Cache summary', description: 'Total contacts stored and last updated timestamp' },
    ],
    ['look up a contact', 'store contact data', '/contact-cache']
  ),

  skill(
    'content-asset-creator',
    'Content Asset Creator',
    'Create multiple content assets — blog posts, LinkedIn posts, email copy, social snippets — from a single brief or source document.',
    'tool',
    'content',
    [
      { name: 'Source content or brief', description: 'Original content, talking points, or creative brief', required: true },
      { name: 'Asset types', description: 'Which formats to create (e.g. blog, LinkedIn, email)', required: true },
      { name: 'Target audience', description: 'Who the content is written for', required: false },
    ],
    [
      { name: 'Content assets', description: 'All requested formats ready to publish' },
      { name: 'Publishing calendar', description: 'Suggested sequence and timing for each asset' },
    ],
    ['create content assets', 'repurpose this into multiple formats', '/content-asset-creator']
  ),

  skill(
    'create-html-carousel',
    'HTML Carousel Creator',
    'Create interactive HTML carousel presentations optimised for embedding in emails, landing pages, or web content.',
    'tool',
    'content',
    [
      { name: 'Slide content', description: 'Text, headlines, and image descriptions for each slide', required: true },
      { name: 'Brand colours', description: 'Hex codes for primary and secondary brand colours', required: false },
      { name: 'Number of slides', description: 'Total slides to include in the carousel', required: false },
    ],
    [
      { name: 'HTML file', description: 'Self-contained HTML/CSS/JS carousel ready to embed' },
      { name: 'Embed code', description: 'iframe embed snippet for use in other pages' },
    ],
    ['create a carousel', 'build an HTML carousel', '/create-html-carousel']
  ),

  skill(
    'create-html-slides',
    'HTML Slides Creator',
    'Create presentation slides in clean, portable HTML format suitable for screen share, export, or web embedding.',
    'tool',
    'content',
    [
      { name: 'Slide outline', description: 'Slide titles and bullet points or speaker notes', required: true },
      { name: 'Theme', description: 'Visual theme or brand guidelines to apply', required: false },
    ],
    [
      { name: 'HTML slide deck', description: 'Full slide deck as a single HTML file with navigation' },
      { name: 'Print-ready version', description: 'CSS print stylesheet for exporting to PDF' },
    ],
    ['create presentation slides', 'build HTML slides', '/create-html-slides']
  ),

  skill(
    'create-workflow-diagram',
    'Workflow Diagram Creator',
    'Generate visual workflow diagrams from plain-language process descriptions using Mermaid or SVG output.',
    'tool',
    'content',
    [
      { name: 'Process description', description: 'Plain-language description of the workflow steps and decisions', required: true },
      { name: 'Diagram type', description: 'Flowchart, sequence diagram, or swimlane', required: false },
    ],
    [
      { name: 'Diagram code', description: 'Mermaid or DOT syntax for the workflow diagram' },
      { name: 'Rendered SVG', description: 'Visual diagram image ready to embed or share' },
    ],
    ['create a workflow diagram', 'diagram this process', '/create-workflow-diagram']
  ),

  skill(
    'crustdata-supabase',
    'CrustData to Supabase',
    'Sync CrustData company intelligence — funding rounds, headcount signals, tech stack — directly into your Supabase database for GTM enrichment.',
    'tool',
    'lead-generation',
    [
      { name: 'Company list', description: 'Company names or domains to enrich via CrustData', required: true },
      { name: 'Fields to sync', description: 'Data fields to pull (funding, headcount, tech stack)', required: false },
    ],
    [
      { name: 'Enriched records', description: 'Company records updated with CrustData intelligence' },
      { name: 'Sync summary', description: 'Count of records updated and any errors' },
    ],
    ['sync CrustData', 'enrich companies from CrustData', '/crustdata-supabase']
  ),

  skill(
    'customer-discovery',
    'Customer Discovery',
    'Conduct structured customer discovery research to validate assumptions, surface pain points, and identify unmet needs through interview synthesis.',
    'tool',
    'research',
    [
      { name: 'Interview transcripts or notes', description: 'Raw interview data to synthesise', required: false },
      { name: 'Discovery questions', description: 'Questions to guide the discovery process', required: false },
      { name: 'Target segment', description: 'Customer segment being researched', required: true },
    ],
    [
      { name: 'Discovery insights', description: 'Synthesised pain points, motivations, and unmet needs' },
      { name: 'Hypothesis validation', description: 'Which assumptions were confirmed, refuted, or need more data' },
    ],
    ['run customer discovery', 'synthesise customer interviews', '/customer-discovery']
  ),

  skill(
    'early-access-email-sequence',
    'Early Access Email Sequence',
    'Design multi-step email sequences for early access or waitlist campaigns that build anticipation, qualify interest, and convert signups to paying customers.',
    'tool',
    'outreach',
    [
      { name: 'Product or feature name', description: 'What early access is being offered', required: true },
      { name: 'Key benefits', description: 'Top 3 benefits to highlight in the sequence', required: true },
      { name: 'Launch date', description: 'Target launch date for deadline-driven urgency', required: false },
    ],
    [
      { name: 'Email sequence', description: '4–6 email sequence from signup confirmation to launch' },
      { name: 'Subject line variants', description: 'A/B tested subject lines for each email' },
    ],
    ['create an early access sequence', 'waitlist email sequence', '/early-access-email-sequence']
  ),

  skill(
    'email-drafting',
    'Email Drafter',
    'Draft professional business emails for any situation — follow-ups, proposals, objection handling, introductions — matched to your tone and context.',
    'tool',
    'outreach',
    [
      { name: 'Email purpose', description: 'What this email needs to accomplish', required: true },
      { name: 'Recipient context', description: 'Who you are writing to and your relationship', required: true },
      { name: 'Key points', description: 'Main messages or asks to include', required: false },
    ],
    [
      { name: 'Draft email', description: 'Ready-to-send email with subject line and body' },
      { name: 'Alternative versions', description: 'Shorter and longer variants of the same email' },
    ],
    ['draft an email', 'write this email for me', '/email-drafting']
  ),

  skill(
    'find-influencers',
    'Influencer Finder',
    'Identify relevant industry influencers and thought leaders by vertical, audience size, and engagement rate for partnership or content amplification.',
    'tool',
    'research',
    [
      { name: 'Industry or niche', description: 'The vertical or topic area to search within', required: true },
      { name: 'Platform', description: 'LinkedIn, X/Twitter, YouTube, or newsletter', required: false },
      { name: 'Minimum audience size', description: 'Follower or subscriber threshold', required: false },
    ],
    [
      { name: 'Influencer list', description: 'Ranked influencers with audience size, engagement rate, and contact info' },
      { name: 'Outreach angles', description: 'Personalised hooks for reaching out to each influencer' },
    ],
    ['find influencers in my space', 'discover thought leaders', '/find-influencers']
  ),

  skill(
    'gcalcli-calendar',
    'Calendar Scheduler',
    'Schedule and manage calendar events via CLI integration, including meeting creation, availability checking, and invite sending.',
    'tool',
    'research',
    [
      { name: 'Event details', description: 'Meeting title, date, time, duration, and attendees', required: true },
      { name: 'Calendar ID', description: 'Which calendar to add the event to', required: false },
    ],
    [
      { name: 'Confirmation', description: 'Event created confirmation with calendar link' },
      { name: 'Availability slots', description: 'Open time slots matching all attendee calendars' },
    ],
    ['schedule a meeting', 'add to my calendar', '/gcalcli-calendar']
  ),

  skill(
    'google-ad-scraper',
    'Google Ad Scraper',
    'Scrape and analyse competitor Google search and display ads to surface messaging angles, keywords, and creative strategies.',
    'tool',
    'ads',
    [
      { name: 'Competitor domain', description: 'Domain of the competitor to analyse ads for', required: true },
      { name: 'Keywords', description: 'Search terms to check for competitor ad presence', required: false },
      { name: 'Geography', description: 'Country or region to pull ads from', required: false },
    ],
    [
      { name: 'Ad inventory', description: 'All active competitor ads with headlines, descriptions, and landing page URLs' },
      { name: 'Messaging analysis', description: 'Key themes, hooks, and CTAs used across competitor ads' },
    ],
    ['scrape competitor Google ads', 'analyse Google ads', '/google-ad-scraper']
  ),

  skill(
    'hacker-news-scraper',
    'Hacker News Scraper',
    'Monitor Hacker News for discussions, Ask HN threads, and Show HN posts relevant to your product category or competitor landscape.',
    'tool',
    'research',
    [
      { name: 'Keywords', description: 'Terms to search for in HN posts and comments', required: true },
      { name: 'Date range', description: 'Time window to search within', required: false },
      { name: 'Minimum score', description: 'Minimum upvotes to filter by relevance', required: false },
    ],
    [
      { name: 'HN threads', description: 'Relevant threads with titles, scores, comment counts, and links' },
      { name: 'Key insights', description: 'Synthesised themes and pain points from the discussions' },
    ],
    ['search Hacker News', 'monitor HN discussions', '/hacker-news-scraper']
  ),

  skill(
    'icp-identification',
    'ICP Identification',
    'Define and validate ideal customer profile characteristics using firmographic, technographic, and behavioural signals from your best customers.',
    'tool',
    'lead-generation',
    [
      { name: 'Best customer list', description: 'List of your top customers with company and revenue data', required: false },
      { name: 'Product description', description: 'What your product does and who it is built for', required: true },
      { name: 'Deal data', description: 'Win/loss data or CRM export to identify patterns', required: false },
    ],
    [
      { name: 'ICP definition', description: 'Firmographic, technographic, and behavioural criteria for your ideal customer' },
      { name: 'ICP scorecard', description: 'Scoring rubric to rate any prospect against your ICP' },
    ],
    ['define my ICP', 'identify ideal customer profile', '/icp-identification']
  ),

  skill(
    'icp-persona-builder',
    'ICP Persona Builder',
    'Build detailed buyer personas for your ideal customer profile including goals, pain points, objections, preferred channels, and buying triggers.',
    'tool',
    'lead-generation',
    [
      { name: 'ICP definition', description: 'Firmographic and role criteria for the target persona', required: true },
      { name: 'Interview data', description: 'Customer interview notes or survey responses', required: false },
    ],
    [
      { name: 'Persona document', description: 'Full persona with demographics, goals, pains, objections, and preferred channels' },
      { name: 'Messaging cheat sheet', description: 'How to speak to this persona at each funnel stage' },
    ],
    ['build a persona', 'create buyer persona', '/icp-persona-builder']
  ),

  skill(
    'icp-website-review',
    'ICP Website Review',
    'Analyse a prospect website to validate ICP fit, surface buying signals, and generate personalised outreach context before reaching out.',
    'tool',
    'lead-generation',
    [
      { name: 'Prospect website URL', description: 'The website to review for ICP fit', required: true },
      { name: 'ICP criteria', description: 'Your ICP definition to match against', required: false },
    ],
    [
      { name: 'ICP fit score', description: 'Numerical score and rationale for ICP alignment' },
      { name: 'Personalisation hooks', description: 'Company-specific insights to use in outreach' },
      { name: 'Signals summary', description: 'Key signals that suggest buying intent or urgency' },
    ],
    ['review this website for ICP fit', 'analyse prospect website', '/icp-website-review']
  ),

  skill(
    'job-posting-intent',
    'Job Posting Intent',
    'Detect buying intent and strategic direction from a company\'s active job postings, revealing technology investments, expansion plans, and pain points.',
    'tool',
    'research',
    [
      { name: 'Company name or domain', description: 'The company to pull job postings for', required: true },
      { name: 'Keywords', description: 'Specific skills or tools to look for in postings', required: false },
    ],
    [
      { name: 'Intent signals', description: 'Inferred strategic initiatives and technology investments' },
      { name: 'Relevant job postings', description: 'Full list of postings with titles and descriptions' },
    ],
    ['check job postings for intent', 'job posting signal analysis', '/job-posting-intent']
  ),

  skill(
    'kol-discovery',
    'KOL Discovery',
    'Discover key opinion leaders in your target verticals by analysing content reach, audience quality, and relevance to your product category.',
    'tool',
    'research',
    [
      { name: 'Industry or vertical', description: 'The market segment to find KOLs in', required: true },
      { name: 'Platform', description: 'LinkedIn, X/Twitter, YouTube, or podcasts', required: false },
      { name: 'Geography', description: 'Target geography for the KOL search', required: false },
    ],
    [
      { name: 'KOL list', description: 'Key opinion leaders ranked by reach, engagement, and relevance' },
      { name: 'Partnership angles', description: 'Recommended collaboration formats for each KOL' },
    ],
    ['find KOLs', 'discover key opinion leaders', '/kol-discovery']
  ),

  skill(
    'kol-engager-icp',
    'KOL ICP Engager',
    'Identify and engage followers of key opinion leaders who match your ICP, turning KOL audiences into qualified pipeline.',
    'tool',
    'outreach',
    [
      { name: 'KOL profile URL', description: 'LinkedIn or X profile of the key opinion leader', required: true },
      { name: 'ICP criteria', description: 'Filters to apply to the KOL\'s audience', required: true },
    ],
    [
      { name: 'Matched audience list', description: 'KOL followers/engagers who match your ICP' },
      { name: 'Outreach templates', description: 'Personalised outreach messages referencing shared KOL content' },
    ],
    ['engage KOL audience', 'target KOL followers', '/kol-engager-icp']
  ),

  skill(
    'landing-page-intel',
    'Landing Page Intelligence',
    'Analyse competitor landing pages for conversion tactics, messaging hierarchy, social proof patterns, and CTA strategies.',
    'tool',
    'competitive-intel',
    [
      { name: 'Competitor landing page URL', description: 'URL of the landing page to analyse', required: true },
    ],
    [
      { name: 'Page teardown', description: 'Section-by-section analysis of copy, design, and conversion elements' },
      { name: 'Best practices report', description: 'Tactics worth adopting on your own pages' },
    ],
    ['analyse competitor landing page', 'landing page teardown', '/landing-page-intel']
  ),

  skill(
    'lead-qualification',
    'Lead Qualification',
    'Score and qualify inbound leads against your ICP criteria, BANT framework, and engagement signals to prioritise sales follow-up.',
    'tool',
    'lead-generation',
    [
      { name: 'Lead data', description: 'Lead records with company, title, and engagement history', required: true },
      { name: 'ICP criteria', description: 'Scoring criteria to apply to each lead', required: true },
    ],
    [
      { name: 'Qualified lead list', description: 'Leads ranked by qualification score with rationale' },
      { name: 'Disqualified list', description: 'Leads that do not meet minimum thresholds with reasons' },
    ],
    ['qualify these leads', 'score my inbound leads', '/lead-qualification']
  ),

  skill(
    'linkedin-commenter-extractor',
    'LinkedIn Commenter Extractor',
    'Extract people who comment on specific LinkedIn posts — ideal for finding engaged, category-aware prospects who have already raised their hand.',
    'tool',
    'lead-generation',
    [
      { name: 'LinkedIn post URL', description: 'URL of the LinkedIn post to extract commenters from', required: true },
      { name: 'ICP filter', description: 'Job titles or companies to filter commenters by', required: false },
    ],
    [
      { name: 'Commenter list', description: 'People who commented with name, title, company, and profile URL' },
      { name: 'ICP-matched commenters', description: 'Subset matching your ICP criteria' },
    ],
    ['extract LinkedIn commenters', 'find commenters on this post', '/linkedin-commenter-extractor']
  ),

  skill(
    'linkedin-influencer-discovery',
    'LinkedIn Influencer Discovery',
    'Discover LinkedIn influencers in your target niches by follower count, post engagement, and topic relevance.',
    'tool',
    'lead-generation',
    [
      { name: 'Topic or niche', description: 'Subject area to find LinkedIn influencers in', required: true },
      { name: 'Minimum followers', description: 'Minimum follower count threshold', required: false },
    ],
    [
      { name: 'Influencer list', description: 'LinkedIn influencers with follower counts, engagement rates, and profile URLs' },
      { name: 'Content themes', description: 'Topics each influencer posts most about' },
    ],
    ['find LinkedIn influencers', 'discover LinkedIn thought leaders', '/linkedin-influencer-discovery']
  ),

  skill(
    'linkedin-job-scraper',
    'LinkedIn Job Scraper',
    'Scrape LinkedIn job postings to identify hiring trends, technology investments, and expansion signals at target companies.',
    'tool',
    'research',
    [
      { name: 'Company or keyword', description: 'Company name or job-related keyword to search', required: true },
      { name: 'Location', description: 'Geographic filter for job postings', required: false },
      { name: 'Date posted', description: 'Limit to postings within a time window', required: false },
    ],
    [
      { name: 'Job posting list', description: 'Matched postings with title, company, location, and description' },
      { name: 'Signal analysis', description: 'Inferred buying intent or strategic direction from postings' },
    ],
    ['scrape LinkedIn jobs', 'find job postings on LinkedIn', '/linkedin-job-scraper']
  ),

  skill(
    'linkedin-outreach',
    'LinkedIn Outreach',
    'Create personalised LinkedIn connection requests and follow-up messages tailored to each prospect\'s profile, activity, and shared context.',
    'tool',
    'outreach',
    [
      { name: 'Prospect LinkedIn URL', description: 'Profile URL of the prospect to message', required: true },
      { name: 'Outreach goal', description: 'What you want to achieve with this outreach', required: true },
      { name: 'Personalisation data', description: 'Any specific details about the prospect to reference', required: false },
    ],
    [
      { name: 'Connection request', description: 'Personalised connection note under 300 characters' },
      { name: 'Follow-up sequence', description: 'Two follow-up messages if the connection is not accepted' },
    ],
    ['write a LinkedIn message', 'reach out on LinkedIn', '/linkedin-outreach']
  ),

  skill(
    'linkedin-post-research',
    'LinkedIn Post Research',
    'Research trending LinkedIn content in your space to identify popular formats, hooks, and topics driving high engagement.',
    'tool',
    'research',
    [
      { name: 'Topic or keyword', description: 'Subject area to research LinkedIn posts for', required: true },
      { name: 'Date range', description: 'Time window for trending post analysis', required: false },
      { name: 'Minimum engagement', description: 'Minimum likes/comments to filter by', required: false },
    ],
    [
      { name: 'Top posts', description: 'High-performing posts with engagement metrics and content summaries' },
      { name: 'Hook patterns', description: 'Opening line formulas that drive the most engagement' },
    ],
    ['research LinkedIn posts', 'find trending LinkedIn content', '/linkedin-post-research']
  ),

  skill(
    'linkedin-profile-post-scraper',
    'LinkedIn Profile Scraper',
    'Scrape LinkedIn profiles and recent posts to gather intelligence on a prospect\'s interests, pain points, and content before outreach.',
    'tool',
    'research',
    [
      { name: 'LinkedIn profile URL', description: 'Profile URL to scrape', required: true },
      { name: 'Post count', description: 'Number of recent posts to include', required: false },
    ],
    [
      { name: 'Profile summary', description: 'Structured summary of the prospect\'s background and interests' },
      { name: 'Recent posts', description: 'Latest posts with topics and engagement data' },
      { name: 'Outreach hooks', description: 'Personalisation angles based on their content' },
    ],
    ['scrape LinkedIn profile', 'research this LinkedIn profile', '/linkedin-profile-post-scraper']
  ),

  skill(
    'luma-event-attendees',
    'Luma Event Attendees',
    'Extract attendee lists from Luma events to identify prospects who are actively engaging with your ecosystem or competitor events.',
    'tool',
    'lead-generation',
    [
      { name: 'Luma event URL', description: 'URL of the Luma event to extract attendees from', required: true },
      { name: 'ICP filter', description: 'Job titles or companies to filter attendees by', required: false },
    ],
    [
      { name: 'Attendee list', description: 'Event attendees with name, title, company, and contact info where available' },
      { name: 'ICP-matched attendees', description: 'Subset of attendees matching your ICP' },
    ],
    ['get Luma attendees', 'extract event attendees', '/luma-event-attendees']
  ),

  skill(
    'meta-ad-scraper',
    'Meta Ad Scraper',
    'Scrape and analyse competitor Meta/Facebook and Instagram ads from the Meta Ad Library to surface creative formats, messaging angles, and targeting signals.',
    'tool',
    'ads',
    [
      { name: 'Competitor page name or URL', description: 'Facebook Page of the competitor to analyse', required: true },
      { name: 'Country', description: 'Country to pull ads from', required: false },
      { name: 'Ad category', description: 'Filter by ad category (e.g. housing, employment)', required: false },
    ],
    [
      { name: 'Ad library export', description: 'All active competitor ads with creative, copy, and dates' },
      { name: 'Creative analysis', description: 'Patterns in formats, hooks, and offers used' },
    ],
    ['scrape Meta ads', 'analyse Facebook ads', '/meta-ad-scraper']
  ),

  skill(
    'newsletter-sponsorship-finder',
    'Newsletter Sponsorship Finder',
    'Find newsletters in your niche that accept paid sponsorships, including audience demographics, sponsorship rates, and submission contacts.',
    'tool',
    'ads',
    [
      { name: 'Industry or topic', description: 'Niche to find relevant newsletters in', required: true },
      { name: 'Minimum subscribers', description: 'Minimum subscriber count', required: false },
      { name: 'Max CPM budget', description: 'Maximum cost per thousand readers you will pay', required: false },
    ],
    [
      { name: 'Newsletter list', description: 'Newsletters with subscriber counts, rates, and sponsorship contacts' },
      { name: 'Outreach templates', description: 'Sponsorship inquiry emails personalised for each newsletter' },
    ],
    ['find newsletters to sponsor', 'newsletter sponsorship opportunities', '/newsletter-sponsorship-finder']
  ),

  skill(
    'pain-language-engagers',
    'Pain Language Engagers',
    'Find prospects online who are actively expressing pain points that your product solves, across Reddit, LinkedIn, X, and review sites.',
    'tool',
    'lead-generation',
    [
      { name: 'Pain point keywords', description: 'Phrases that indicate the problem your product solves', required: true },
      { name: 'Platforms', description: 'Where to search: Reddit, LinkedIn, X, G2, etc.', required: false },
    ],
    [
      { name: 'Pain signal list', description: 'Posts and profiles of people expressing the target pain point' },
      { name: 'Response templates', description: 'Helpful, non-spammy replies to engage each prospect' },
    ],
    ['find prospects expressing pain', 'pain language prospecting', '/pain-language-engagers']
  ),

  skill(
    'product-hunt-scraper',
    'Product Hunt Scraper',
    'Extract upvoters, commenters, and followers from Product Hunt launches to find early adopters and tech-savvy prospects.',
    'tool',
    'research',
    [
      { name: 'Product Hunt URL', description: 'URL of the Product Hunt launch to scrape', required: true },
      { name: 'ICP filter', description: 'Roles or company types to filter by', required: false },
    ],
    [
      { name: 'Engager list', description: 'Upvoters and commenters with profile data and links' },
      { name: 'ICP-matched leads', description: 'Subset matching your ideal customer profile' },
    ],
    ['scrape Product Hunt', 'find Product Hunt engagers', '/product-hunt-scraper']
  ),

  skill(
    'reddit-scraper',
    'Reddit Scraper',
    'Monitor Reddit for relevant discussions, buying signals, competitor mentions, and pain point expressions across target subreddits.',
    'tool',
    'research',
    [
      { name: 'Keywords or subreddits', description: 'Terms to search for or subreddits to monitor', required: true },
      { name: 'Date range', description: 'Time window to search within', required: false },
      { name: 'Minimum upvotes', description: 'Minimum vote threshold for relevance filtering', required: false },
    ],
    [
      { name: 'Reddit threads', description: 'Relevant posts with titles, upvotes, comment counts, and links' },
      { name: 'Insight synthesis', description: 'Patterns, pain points, and buying signals from the discussions' },
    ],
    ['monitor Reddit', 'scrape Reddit discussions', '/reddit-scraper']
  ),

  skill(
    'review-scraper',
    'Review Scraper',
    'Scrape product reviews from G2, Capterra, App Store, and Google Play to extract voice-of-customer insights and competitor weaknesses.',
    'tool',
    'research',
    [
      { name: 'Product or company name', description: 'Product to scrape reviews for', required: true },
      { name: 'Review platforms', description: 'G2, Capterra, App Store, Google Play, or Trustpilot', required: false },
      { name: 'Review sentiment', description: 'Filter by positive, negative, or mixed reviews', required: false },
    ],
    [
      { name: 'Review dataset', description: 'Scraped reviews with rating, date, and text' },
      { name: 'Insight summary', description: 'Top praised features and most-cited complaints' },
    ],
    ['scrape reviews', 'analyse product reviews', '/review-scraper']
  ),

  skill(
    'seo-domain-analyzer',
    'SEO Domain Analyser',
    'Analyse domain authority, backlink profile, and core SEO metrics to benchmark your site or audit a competitor.',
    'tool',
    'seo',
    [
      { name: 'Domain', description: 'Domain to analyse SEO metrics for', required: true },
      { name: 'Competitor domains', description: 'Competitor domains to benchmark against', required: false },
    ],
    [
      { name: 'Domain metrics', description: 'DA, DR, backlink count, referring domains, and organic traffic estimate' },
      { name: 'Benchmarking report', description: 'Side-by-side comparison with competitor domains' },
    ],
    ['analyse domain SEO', 'check domain authority', '/seo-domain-analyzer']
  ),

  skill(
    'seo-traffic-analyzer',
    'SEO Traffic Analyser',
    'Analyse organic traffic trends, top landing pages, and keyword rankings for any domain to identify growth opportunities and traffic risks.',
    'tool',
    'seo',
    [
      { name: 'Domain', description: 'Domain to analyse organic traffic for', required: true },
      { name: 'Date range', description: 'Time period to analyse traffic trends', required: false },
    ],
    [
      { name: 'Traffic report', description: 'Monthly organic traffic, top pages, and traffic trends' },
      { name: 'Keyword rankings', description: 'Top keywords driving organic traffic with position data' },
    ],
    ['analyse organic traffic', 'check SEO traffic', '/seo-traffic-analyzer']
  ),

  skill(
    'setup-outreach-campaign',
    'Outreach Campaign Setup',
    'Configure and launch a multi-channel outreach campaign with sequence steps, send schedules, personalisation fields, and tracking.',
    'tool',
    'outreach',
    [
      { name: 'Campaign goal', description: 'What the campaign should achieve (meetings booked, demos, signups)', required: true },
      { name: 'Target segment', description: 'Who the campaign is targeting', required: true },
      { name: 'Channels', description: 'Email, LinkedIn, phone, or a mix', required: false },
    ],
    [
      { name: 'Campaign configuration', description: 'Full campaign setup including sequences, timing, and tracking' },
      { name: 'Sequence copy', description: 'All outreach messages for each step and channel' },
    ],
    ['set up an outreach campaign', 'launch a campaign', '/setup-outreach-campaign']
  ),

  skill(
    'signal-scanner',
    'Signal Scanner',
    'Monitor the web for buying intent signals and trigger events — funding rounds, leadership changes, tech stack switches, and hiring surges.',
    'tool',
    'research',
    [
      { name: 'Company or account list', description: 'Companies to monitor for signals', required: true },
      { name: 'Signal types', description: 'Types of signals to watch: funding, hiring, news, tech changes', required: false },
    ],
    [
      { name: 'Signal alerts', description: 'Detected signals with source, date, and recommended action' },
      { name: 'Priority accounts', description: 'Accounts with the strongest recent signals ranked by urgency' },
    ],
    ['scan for buying signals', 'monitor account signals', '/signal-scanner']
  ),

  skill(
    'site-content-catalog',
    'Site Content Catalogue',
    'Catalogue and analyse all discoverable content from a website — pages, blog posts, resources — to map content architecture and coverage.',
    'tool',
    'research',
    [
      { name: 'Website URL', description: 'Root URL of the site to catalogue', required: true },
      { name: 'Max pages', description: 'Maximum number of pages to crawl', required: false },
    ],
    [
      { name: 'Content catalogue', description: 'Full list of pages with URLs, titles, and content types' },
      { name: 'Content map', description: 'Visual or structured map of content categories and clusters' },
    ],
    ['catalogue website content', 'map all pages on this site', '/site-content-catalog']
  ),

  skill(
    'tam-builder',
    'TAM Builder',
    'Calculate total addressable market using a bottom-up analysis with company count, deal size, and segmentation data.',
    'tool',
    'research',
    [
      { name: 'ICP definition', description: 'Firmographic criteria defining the addressable market', required: true },
      { name: 'Average deal size', description: 'Average contract value in your target market', required: true },
      { name: 'Geography', description: 'Markets to include in the TAM calculation', required: false },
    ],
    [
      { name: 'TAM estimate', description: 'Total addressable market in dollars with methodology' },
      { name: 'Market segmentation', description: 'TAM broken down by segment, vertical, and geography' },
    ],
    ['calculate TAM', 'build a TAM model', '/tam-builder']
  ),

  skill(
    'tech-stack-teardown',
    'Tech Stack Teardown',
    'Identify the technology stack used by a company or competitor using domain scanning, job postings, and public signals.',
    'tool',
    'competitive-intel',
    [
      { name: 'Company domain', description: 'Website domain of the company to analyse', required: true },
    ],
    [
      { name: 'Tech stack list', description: 'Identified technologies with category (CRM, analytics, infra, etc.)' },
      { name: 'Sales angles', description: 'How your product fits alongside or replaces their current tools' },
    ],
    ['what tech stack does this company use', 'teardown tech stack', '/tech-stack-teardown']
  ),

  skill(
    'twitter-scraper',
    'X/Twitter Scraper',
    'Monitor X/Twitter for relevant discussions, competitor mentions, buyer signals, and trending conversations in your target market.',
    'tool',
    'research',
    [
      { name: 'Keywords or handles', description: 'Search terms or @handles to monitor', required: true },
      { name: 'Date range', description: 'Time window to search within', required: false },
      { name: 'Minimum engagement', description: 'Minimum likes or retweets threshold', required: false },
    ],
    [
      { name: 'Tweet dataset', description: 'Relevant tweets with engagement metrics and author profiles' },
      { name: 'Trend analysis', description: 'Recurring themes and sentiment patterns in the data' },
    ],
    ['monitor X/Twitter', 'scrape tweets', '/twitter-scraper']
  ),

  skill(
    'visual-brand-extractor',
    'Visual Brand Extractor',
    'Extract visual brand elements — colour palettes, typography, logo styles, and layout patterns — from competitor websites and assets.',
    'tool',
    'brand',
    [
      { name: 'Brand URL or asset', description: 'Website URL or image file to extract brand elements from', required: true },
    ],
    [
      { name: 'Brand palette', description: 'Extracted colour palette with hex codes' },
      { name: 'Typography', description: 'Identified font families and usage patterns' },
      { name: 'Brand style summary', description: 'Overall visual personality and design direction' },
    ],
    ['extract visual brand elements', 'analyse competitor brand', '/visual-brand-extractor']
  ),

  skill(
    'web-archive-scraper',
    'Web Archive Scraper',
    'Research historical website content via the Wayback Machine to track competitor pivots, messaging evolution, and removed pages.',
    'tool',
    'research',
    [
      { name: 'URL', description: 'The web URL to look up in the archive', required: true },
      { name: 'Date range', description: 'Time period to retrieve historical snapshots from', required: false },
    ],
    [
      { name: 'Historical snapshots', description: 'Archived page versions with timestamps and content' },
      { name: 'Change analysis', description: 'Summary of how the page or site has evolved over time' },
    ],
    ['check Wayback Machine', 'historical website research', '/web-archive-scraper']
  ),

  skill(
    'youtube-apify-transcript',
    'YouTube Transcript Extractor',
    'Extract full transcripts from YouTube videos for content repurposing, research synthesis, or competitive intelligence.',
    'tool',
    'research',
    [
      { name: 'YouTube video URL', description: 'URL of the YouTube video to transcribe', required: true },
    ],
    [
      { name: 'Full transcript', description: 'Complete timestamped transcript of the video' },
      { name: 'Key highlights', description: 'Top insights and quotes extracted from the transcript' },
    ],
    ['get YouTube transcript', 'transcribe this video', '/youtube-apify-transcript']
  ),

  skill(
    'youtube-watcher',
    'YouTube Channel Watcher',
    'Monitor YouTube channels for new uploads and surface content signals relevant to competitor strategy, market trends, or product positioning.',
    'tool',
    'research',
    [
      { name: 'YouTube channel URL', description: 'Channel URL to monitor for new content', required: true },
      { name: 'Keywords', description: 'Topics to flag when they appear in new videos', required: false },
    ],
    [
      { name: 'New video alerts', description: 'New uploads with titles, descriptions, and view counts' },
      { name: 'Content signals', description: 'Themes and topics from recent uploads' },
    ],
    ['monitor YouTube channel', 'watch this YouTube channel', '/youtube-watcher']
  ),
]

// ── Composites (workflow) ─────────────────────────────────────────────────────

const COMPOSITES: GTMSkill[] = [
  skill(
    'ad-angle-miner',
    'Ad Angle Miner',
    'Mine competitor ads across channels to identify the most effective angles, hooks, and value propositions driving performance in your category.',
    'workflow',
    'ads',
    [
      { name: 'Competitor list', description: 'Competitors to analyse ad angles for', required: true },
      { name: 'Ad platforms', description: 'Google, Meta, LinkedIn, or all', required: false },
    ],
    [
      { name: 'Angle inventory', description: 'All unique angles and value props found across competitor ads' },
      { name: 'Top performing angles', description: 'Highest-signal angles ranked by frequency and estimated spend' },
    ],
    ['mine ad angles', 'find best ad hooks', '/ad-angle-miner']
  ),

  skill(
    'ad-campaign-analyzer',
    'Ad Campaign Analyser',
    'Analyse the performance of an ad campaign across creative, audience, and channel dimensions to identify optimisation opportunities.',
    'workflow',
    'ads',
    [
      { name: 'Campaign data', description: 'Campaign performance data in CSV or JSON format', required: true },
      { name: 'Goal metric', description: 'Primary KPI (CPA, ROAS, CTR, etc.)', required: true },
    ],
    [
      { name: 'Performance breakdown', description: 'Results by ad, audience segment, and channel' },
      { name: 'Optimisation recommendations', description: 'Specific changes to improve the goal metric' },
    ],
    ['analyse ad campaign performance', 'review my campaign results', '/ad-campaign-analyzer']
  ),

  skill(
    'ad-creative-intelligence',
    'Ad Creative Intelligence',
    'Analyse the creative performance of ad assets — images, videos, headlines — to identify what visual and copy patterns drive the best results.',
    'workflow',
    'ads',
    [
      { name: 'Ad creative assets', description: 'Ad images, videos, or copy samples to analyse', required: true },
      { name: 'Performance data', description: 'CTR, conversion rate, or engagement metrics per creative', required: false },
    ],
    [
      { name: 'Creative scorecard', description: 'Each creative rated on key performance indicators' },
      { name: 'Winning patterns', description: 'Design and copy elements correlating with higher performance' },
    ],
    ['analyse ad creatives', 'which ad creative is best', '/ad-creative-intelligence']
  ),

  skill(
    'ad-spend-allocator',
    'Ad Spend Allocator',
    'Recommend optimal ad spend allocation across channels and campaigns based on historical performance data and business objectives.',
    'workflow',
    'ads',
    [
      { name: 'Total budget', description: 'Total ad budget available to allocate', required: true },
      { name: 'Channel performance data', description: 'Historical ROAS or CPA per channel', required: true },
      { name: 'Business goal', description: 'Primary objective: growth, efficiency, or market share', required: false },
    ],
    [
      { name: 'Allocation plan', description: 'Recommended budget split by channel and campaign type' },
      { name: 'Projected outcomes', description: 'Expected returns based on historical performance benchmarks' },
    ],
    ['allocate my ad budget', 'how should I split my ad spend', '/ad-spend-allocator']
  ),

  skill(
    'ad-to-landing-page-auditor',
    'Ad-to-Landing-Page Auditor',
    'Audit message match and conversion alignment between ad creatives and their destination landing pages to reduce drop-off and improve ROAS.',
    'workflow',
    'ads',
    [
      { name: 'Ad copy', description: 'The ad headline and description to audit', required: true },
      { name: 'Landing page URL', description: 'URL of the landing page the ad links to', required: true },
    ],
    [
      { name: 'Message match score', description: 'Alignment score between ad promise and landing page delivery' },
      { name: 'Audit report', description: 'Specific mismatches and recommendations to fix them' },
    ],
    ['audit ad to landing page', 'check message match', '/ad-to-landing-page-auditor']
  ),

  skill(
    'battlecard-generator',
    'Battlecard Generator',
    'Generate sales battlecards for a named competitor covering positioning, strengths/weaknesses, common objections, and winning talk tracks.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor name', description: 'The competitor to build the battlecard for', required: true },
      { name: 'Your product strengths', description: 'Key differentiators and strengths vs this competitor', required: false },
      { name: 'Win/loss context', description: 'Recent wins or losses against this competitor', required: false },
    ],
    [
      { name: 'Sales battlecard', description: 'One-page battlecard with positioning, objections, and talk tracks' },
      { name: 'Objection handlers', description: 'Scripted responses to the most common competitor objections' },
    ],
    ['create a battlecard', 'build competitive battlecard for', '/battlecard-generator']
  ),

  skill(
    'campaign-brief-generator',
    'Campaign Brief Generator',
    'Generate a complete campaign brief including goals, audience, messaging, channels, timeline, and success metrics from a high-level objective.',
    'workflow',
    'content',
    [
      { name: 'Campaign objective', description: 'The primary goal of the campaign', required: true },
      { name: 'Target audience', description: 'Who the campaign is targeting', required: true },
      { name: 'Budget range', description: 'Approximate campaign budget', required: false },
      { name: 'Timeline', description: 'Campaign start and end dates', required: false },
    ],
    [
      { name: 'Campaign brief', description: 'Complete brief document with all sections filled' },
      { name: 'Channel plan', description: 'Recommended channel mix with rationale' },
    ],
    ['create a campaign brief', 'write a campaign plan', '/campaign-brief-generator']
  ),

  skill(
    'champion-move-outreach',
    'Champion Move Outreach',
    'Detect when a customer champion has moved to a new company and trigger personalised outreach to open a new sales opportunity.',
    'workflow',
    'outreach',
    [
      { name: 'Champion list', description: 'Previous customers or champions to monitor for job moves', required: true },
    ],
    [
      { name: 'Move alerts', description: 'Champions who have recently changed companies' },
      { name: 'Outreach emails', description: 'Personalised congratulatory outreach referencing the move' },
    ],
    ['find champions who moved', 'champion move detection', '/champion-move-outreach']
  ),

  skill(
    'churn-risk-detector',
    'Churn Risk Detector',
    'Identify customers at risk of churning by analysing usage data, support tickets, NPS scores, and engagement signals.',
    'workflow',
    'research',
    [
      { name: 'Customer data', description: 'Usage metrics, login frequency, and account health data', required: true },
      { name: 'Churn indicators', description: 'Specific signals that historically precede churn', required: false },
    ],
    [
      { name: 'Risk ranked list', description: 'Customers ranked by churn probability with supporting signals' },
      { name: 'Intervention playbook', description: 'Recommended actions to retain each at-risk customer' },
    ],
    ['identify churn risk', 'find customers at risk of churning', '/churn-risk-detector']
  ),

  skill(
    'company-current-gtm-analysis',
    'Current GTM Analysis',
    'Analyse a company\'s current go-to-market strategy by researching their messaging, channels, pricing, and sales motion.',
    'workflow',
    'research',
    [
      { name: 'Company name or URL', description: 'The company to analyse', required: true },
    ],
    [
      { name: 'GTM analysis report', description: 'Assessment of target market, positioning, channels, and pricing' },
      { name: 'GTM strengths and gaps', description: 'What is working and where their GTM has weaknesses' },
    ],
    ['analyse company GTM', 'what is their go-to-market strategy', '/company-current-gtm-analysis']
  ),

  skill(
    'competitive-pricing-intel',
    'Competitive Pricing Intelligence',
    'Research and document competitor pricing, packaging tiers, and discount structures to inform your own pricing strategy.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor list', description: 'Competitors to research pricing for', required: true },
      { name: 'Your pricing', description: 'Your current pricing for benchmarking', required: false },
    ],
    [
      { name: 'Pricing comparison', description: 'Side-by-side competitor pricing with tier breakdowns' },
      { name: 'Pricing recommendations', description: 'Suggested adjustments based on competitive positioning' },
    ],
    ['research competitor pricing', 'competitive pricing analysis', '/competitive-pricing-intel']
  ),

  skill(
    'competitive-strategy-tracker',
    'Competitive Strategy Tracker',
    'Track shifts in competitor strategy over time — new product launches, messaging changes, market expansions, and partnership announcements.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor list', description: 'Competitors to track strategy for', required: true },
      { name: 'Monitoring frequency', description: 'How often to run the tracker', required: false },
    ],
    [
      { name: 'Strategy change log', description: 'Documented changes in competitor strategy with dates and sources' },
      { name: 'Strategic implications', description: 'What each change means for your positioning and roadmap' },
    ],
    ['track competitor strategy', 'monitor strategic changes', '/competitive-strategy-tracker']
  ),

  skill(
    'competitor-ad-teardown',
    'Competitor Ad Teardown',
    'Conduct a deep teardown of a competitor\'s full advertising strategy across Google, Meta, and LinkedIn to extract actionable intelligence.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor name or domain', description: 'The competitor to teardown ads for', required: true },
    ],
    [
      { name: 'Ad teardown report', description: 'Comprehensive analysis of all active ads across channels' },
      { name: 'Winning creatives', description: 'Best-performing ads with analysis of why they work' },
      { name: 'Counter-strategy', description: 'Recommended ad angles to win against this competitor' },
    ],
    ['teardown competitor ads', 'analyse competitor advertising', '/competitor-ad-teardown']
  ),

  skill(
    'competitor-content-tracker',
    'Competitor Content Tracker',
    'Track competitor content output across blog, social, and email channels to identify content velocity, topic shifts, and gaps you can exploit.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor list', description: 'Competitors to track content for', required: true },
      { name: 'Channels to monitor', description: 'Blog, LinkedIn, X, YouTube, email, or all', required: false },
    ],
    [
      { name: 'Content activity report', description: 'Recent content published by each competitor with dates and topics' },
      { name: 'Content gap analysis', description: 'Topics they are not covering that you could own' },
    ],
    ['track competitor content', 'monitor what competitors are publishing', '/competitor-content-tracker']
  ),

  skill(
    'competitor-intel',
    'Competitor Intelligence',
    'Compile a comprehensive intelligence profile on a competitor covering product, pricing, messaging, customers, and GTM motion.',
    'workflow',
    'competitive-intel',
    [
      { name: 'Competitor name or URL', description: 'The competitor to profile', required: true },
    ],
    [
      { name: 'Competitor profile', description: 'Full intelligence report covering all GTM dimensions' },
      { name: 'Competitive summary', description: 'One-page executive summary of key findings' },
    ],
    ['research a competitor', 'competitive intelligence on', '/competitor-intel']
  ),

  skill(
    'content-brief-factory',
    'Content Brief Factory',
    'Generate structured SEO content briefs at scale from a keyword list, including target keywords, outline, word count, and SERP angle.',
    'workflow',
    'content',
    [
      { name: 'Keyword list', description: 'Keywords to create content briefs for', required: true },
      { name: 'Target audience', description: 'Who the content is written for', required: false },
      { name: 'Brand voice notes', description: 'Tone and style guidance to apply', required: false },
    ],
    [
      { name: 'Content briefs', description: 'Complete briefs for each keyword with outline, angle, and references' },
      { name: 'Brief summary table', description: 'Overview of all briefs with estimated word counts and priorities' },
    ],
    ['create content briefs', 'generate SEO briefs', '/content-brief-factory']
  ),

  skill(
    'content-repurposer',
    'Content Repurposer',
    'Repurpose a single piece of content into multiple formats — LinkedIn posts, tweets, email newsletters, blog posts, and short-form video scripts.',
    'workflow',
    'content',
    [
      { name: 'Source content', description: 'The original content to repurpose (URL or paste)', required: true },
      { name: 'Target formats', description: 'Which formats to create from the source', required: true },
    ],
    [
      { name: 'Repurposed assets', description: 'All requested content formats ready to publish' },
      { name: 'Distribution calendar', description: 'Suggested posting schedule across channels' },
    ],
    ['repurpose this content', 'turn this into multiple formats', '/content-repurposer']
  ),

  skill(
    'customer-story-builder',
    'Customer Story Builder',
    'Build compelling customer success stories and case studies from interview notes, product data, or customer testimonials.',
    'workflow',
    'content',
    [
      { name: 'Customer name', description: 'Company name for the case study', required: true },
      { name: 'Interview notes or quotes', description: 'Raw quotes or interview transcript from the customer', required: false },
      { name: 'Results achieved', description: 'Metrics and outcomes the customer achieved', required: true },
    ],
    [
      { name: 'Case study', description: 'Full narrative case study with challenge, solution, and results' },
      { name: 'Short-form version', description: 'One-paragraph testimonial format for website use' },
    ],
    ['write a case study', 'build a customer story', '/customer-story-builder']
  ),

  skill(
    'customer-win-back-sequencer',
    'Customer Win-Back Sequencer',
    'Design personalised re-engagement sequences to win back churned customers with targeted offers, updated value messaging, and timing triggers.',
    'workflow',
    'outreach',
    [
      { name: 'Churned customer list', description: 'List of churned customers with churn date and reason', required: true },
      { name: 'Win-back offer', description: 'Incentive or updated value prop to present', required: false },
    ],
    [
      { name: 'Win-back sequences', description: 'Multi-step personalised sequences for each customer segment' },
      { name: 'Segmentation strategy', description: 'How to group churned customers for different messaging' },
    ],
    ['win back churned customers', 'create re-engagement sequence', '/customer-win-back-sequencer']
  ),

  skill(
    'disqualification-handling',
    'Disqualification Handler',
    'Provide structured guidance on when and how to disqualify prospects, including objection handling scripts and graceful exit templates.',
    'workflow',
    'sales',
    [
      { name: 'Prospect context', description: 'Details about the prospect and their situation', required: true },
      { name: 'Disqualification reason', description: 'Why this prospect may not be a good fit', required: true },
    ],
    [
      { name: 'Disqualification decision', description: 'Clear recommendation to disqualify or continue with rationale' },
      { name: 'Disqualification message', description: 'Professional message to send the prospect' },
    ],
    ['should I disqualify this prospect', 'how to disqualify gracefully', '/disqualification-handling']
  ),

  skill(
    'expansion-signal-spotter',
    'Expansion Signal Spotter',
    'Identify expansion signals within existing customer accounts — new team growth, new use cases, and cross-sell opportunities.',
    'workflow',
    'research',
    [
      { name: 'Customer account list', description: 'Existing customers to scan for expansion signals', required: true },
      { name: 'Expansion products', description: 'Products or features available for upsell', required: false },
    ],
    [
      { name: 'Expansion opportunities', description: 'Accounts ranked by expansion potential with signals' },
      { name: 'Outreach recommendations', description: 'Personalised expansion pitches for top accounts' },
    ],
    ['find expansion opportunities', 'identify upsell signals', '/expansion-signal-spotter']
  ),

  skill(
    'feature-launch-playbook',
    'Feature Launch Playbook',
    'Create a complete launch playbook for a new product feature including positioning, enablement, content, and channel plans.',
    'workflow',
    'content',
    [
      { name: 'Feature name', description: 'The feature being launched', required: true },
      { name: 'Feature description', description: 'What the feature does and who benefits', required: true },
      { name: 'Launch date', description: 'Target launch date', required: false },
    ],
    [
      { name: 'Launch playbook', description: 'Complete launch plan with timeline, stakeholders, and deliverables' },
      { name: 'Launch content kit', description: 'Blog post, release notes, email, and social copy' },
    ],
    ['create a feature launch plan', 'launch playbook for', '/feature-launch-playbook']
  ),

  skill(
    'funding-signal-monitor',
    'Funding Signal Monitor',
    'Monitor funding announcements and investor activity to identify newly funded companies ready to buy technology and grow their teams.',
    'workflow',
    'research',
    [
      { name: 'Target verticals', description: 'Industries or sectors to monitor for funding news', required: true },
      { name: 'Funding stage', description: 'Funding rounds to track: Seed, Series A, Series B, etc.', required: false },
      { name: 'Geography', description: 'Target regions to monitor', required: false },
    ],
    [
      { name: 'Funding alerts', description: 'Newly funded companies matching your criteria with deal details' },
      { name: 'Prioritised prospect list', description: 'Funded companies ranked by ICP fit' },
    ],
    ['monitor funding news', 'find recently funded companies', '/funding-signal-monitor']
  ),

  skill(
    'funding-signal-outreach',
    'Funding Signal Outreach',
    'Generate timely, personalised outreach to companies that have recently announced a funding round, leveraging the funding as a relevant hook.',
    'workflow',
    'outreach',
    [
      { name: 'Funded company list', description: 'Companies that recently received funding', required: true },
      { name: 'Your value proposition', description: 'How your product helps companies at this stage of growth', required: true },
    ],
    [
      { name: 'Outreach emails', description: 'Personalised emails for each funded company referencing the round' },
      { name: 'LinkedIn messages', description: 'LinkedIn outreach variants for the same prospects' },
    ],
    ['reach out to funded companies', 'funding congratulations outreach', '/funding-signal-outreach']
  ),

  skill(
    'get-qualified-leads-from-luma',
    'Qualified Leads from Luma',
    'Extract attendees from Luma events, enrich with company data, and filter to qualified leads matching your ICP.',
    'workflow',
    'lead-generation',
    [
      { name: 'Luma event URLs', description: 'One or more Luma event URLs to extract leads from', required: true },
      { name: 'ICP criteria', description: 'Qualification criteria to apply to attendees', required: true },
    ],
    [
      { name: 'Qualified lead list', description: 'ICP-matched attendees with enriched contact data' },
      { name: 'Outreach templates', description: 'Event-specific outreach messages for each lead' },
    ],
    ['get leads from Luma event', 'extract qualified leads from Luma', '/get-qualified-leads-from-luma']
  ),

  skill(
    'google-search-ads-builder',
    'Google Search Ads Builder',
    'Build complete Google Search ad campaigns including keyword lists, match types, ad groups, headlines, and descriptions optimised for Quality Score.',
    'workflow',
    'ads',
    [
      { name: 'Campaign goal', description: 'What the campaign should achieve', required: true },
      { name: 'Product or service', description: 'What you are advertising', required: true },
      { name: 'Target keywords', description: 'Seed keywords to build the campaign around', required: true },
      { name: 'Monthly budget', description: 'Approximate monthly spend budget', required: false },
    ],
    [
      { name: 'Ad campaign structure', description: 'Campaign, ad group, and keyword organisation' },
      { name: 'Ad copy', description: 'Headlines and descriptions for each ad group with character counts' },
    ],
    ['build Google Search ads', 'create a Google Ads campaign', '/google-search-ads-builder']
  ),

  skill(
    'help-center-article-generator',
    'Help Centre Article Generator',
    'Generate clear, structured help centre articles and documentation from product specs, support tickets, or feature descriptions.',
    'workflow',
    'content',
    [
      { name: 'Topic or feature', description: 'What the help article should cover', required: true },
      { name: 'Product context', description: 'Relevant product details, steps, or screenshots', required: false },
      { name: 'Audience', description: 'Technical or non-technical end users', required: false },
    ],
    [
      { name: 'Help article', description: 'Complete help centre article with headings, steps, and FAQs' },
      { name: 'SEO meta', description: 'Meta title and description for the help page' },
    ],
    ['write a help article', 'create documentation', '/help-center-article-generator']
  ),

  skill(
    'hiring-signal-outreach',
    'Hiring Signal Outreach',
    'Generate personalised outreach triggered by a company\'s hiring activity — referencing specific roles to connect your solution to their growth initiative.',
    'workflow',
    'outreach',
    [
      { name: 'Company and job posting', description: 'Company name and the relevant job posting to reference', required: true },
      { name: 'Your value proposition', description: 'How your product supports the hiring initiative', required: true },
    ],
    [
      { name: 'Outreach email', description: 'Personalised email referencing the hiring signal' },
      { name: 'LinkedIn message', description: 'Shorter LinkedIn variant for the same prospect' },
    ],
    ['reach out based on hiring', 'hiring signal email', '/hiring-signal-outreach']
  ),

  skill(
    'icp-website-audit',
    'ICP Website Audit',
    'Audit a prospect website against ICP criteria to score fit, surface buying signals, and generate tailored outreach recommendations.',
    'workflow',
    'lead-generation',
    [
      { name: 'Prospect website URL', description: 'The website to audit', required: true },
      { name: 'ICP definition', description: 'Your ICP criteria to score against', required: true },
    ],
    [
      { name: 'ICP audit report', description: 'Detailed fit assessment with evidence from the website' },
      { name: 'Outreach brief', description: 'Personalisation hooks and recommended outreach approach' },
    ],
    ['audit website for ICP fit', 'score this prospect website', '/icp-website-audit']
  ),

  skill(
    'inbound-lead-enrichment',
    'Inbound Lead Enrichment',
    'Enrich inbound leads with company data, technographics, LinkedIn profiles, and intent signals before routing to sales.',
    'workflow',
    'lead-generation',
    [
      { name: 'Inbound lead data', description: 'Raw inbound leads with name, email, or company', required: true },
    ],
    [
      { name: 'Enriched lead records', description: 'Leads with added company size, tech stack, funding, and LinkedIn data' },
      { name: 'Enrichment summary', description: 'Fields added and data coverage rate' },
    ],
    ['enrich inbound leads', 'add data to my leads', '/inbound-lead-enrichment']
  ),

  skill(
    'inbound-lead-qualification',
    'Inbound Lead Qualification',
    'Qualify inbound leads against your ICP and BANT criteria, scoring each lead and recommending next actions for the sales team.',
    'workflow',
    'lead-generation',
    [
      { name: 'Lead records', description: 'Inbound leads to qualify', required: true },
      { name: 'Qualification criteria', description: 'ICP and BANT criteria to score against', required: true },
    ],
    [
      { name: 'Qualification results', description: 'Each lead scored and labelled as qualified, nurture, or disqualified' },
      { name: 'Next action recommendations', description: 'Specific follow-up actions for each lead tier' },
    ],
    ['qualify inbound leads', 'score my form submissions', '/inbound-lead-qualification']
  ),

  skill(
    'inbound-lead-triage',
    'Inbound Lead Triage',
    'Triage inbound leads by urgency, fit, and intent to ensure the right leads reach sales immediately while others enter nurture flows.',
    'workflow',
    'lead-generation',
    [
      { name: 'Lead queue', description: 'Current inbound lead queue to triage', required: true },
      { name: 'Routing rules', description: 'Criteria for routing to sales vs nurture vs disqualify', required: false },
    ],
    [
      { name: 'Triaged lead list', description: 'Leads sorted into Hot, Warm, Nurture, and Disqualified buckets' },
      { name: 'Routing recommendations', description: 'Specific routing action for each lead' },
    ],
    ['triage my leads', 'sort inbound leads by priority', '/inbound-lead-triage']
  ),

  skill(
    'industry-scanner',
    'Industry Scanner',
    'Scan an industry for key trends, major players, regulatory changes, and growth signals to support market entry or expansion decisions.',
    'workflow',
    'research',
    [
      { name: 'Industry or vertical', description: 'The industry to scan', required: true },
      { name: 'Research focus', description: 'Specific aspects to prioritise: trends, players, regulation', required: false },
    ],
    [
      { name: 'Industry scan report', description: 'Structured overview of trends, players, and opportunities' },
      { name: 'Market map', description: 'Key players categorised by segment and positioning' },
    ],
    ['scan this industry', 'research the market', '/industry-scanner']
  ),

  skill(
    'kol-content-monitor',
    'KOL Content Monitor',
    'Monitor key opinion leaders for new content so you can engage early, identify trending topics, and spot partnership opportunities.',
    'workflow',
    'research',
    [
      { name: 'KOL list', description: 'Key opinion leaders to monitor with profile URLs', required: true },
      { name: 'Platforms', description: 'LinkedIn, X, YouTube, or newsletter', required: false },
    ],
    [
      { name: 'New content alerts', description: 'Recent content from monitored KOLs with engagement data' },
      { name: 'Trending topics', description: 'Topics gaining traction across the KOL network' },
    ],
    ['monitor KOL content', 'track thought leader posts', '/kol-content-monitor']
  ),

  skill(
    'launch-positioning-builder',
    'Launch Positioning Builder',
    'Develop differentiated positioning for a product launch including category definition, key claims, and proof points tailored to your target audience.',
    'workflow',
    'content',
    [
      { name: 'Product details', description: 'What you are launching and who it is for', required: true },
      { name: 'Competitive landscape', description: 'Key competitors and how you differ', required: false },
      { name: 'Target audience', description: 'Primary buyer and secondary influencers', required: true },
    ],
    [
      { name: 'Positioning statement', description: 'Formal positioning statement with category and differentiation' },
      { name: 'Messaging framework', description: 'Key messages tailored by audience and funnel stage' },
    ],
    ['build launch positioning', 'define positioning for launch', '/launch-positioning-builder']
  ),

  skill(
    'leadership-change-outreach',
    'Leadership Change Outreach',
    'Generate personalised outreach triggered by leadership changes — new executives who typically re-evaluate vendors and bring fresh budget.',
    'workflow',
    'outreach',
    [
      { name: 'New leader details', description: 'Name, title, company, and announcement link', required: true },
      { name: 'Your value proposition', description: 'How your product helps this type of leader succeed', required: true },
    ],
    [
      { name: 'Outreach email', description: 'Congratulatory email personalised to the leadership change' },
      { name: 'LinkedIn message', description: 'Shorter LinkedIn connection request variant' },
    ],
    ['reach out to new executive', 'leadership change outreach', '/leadership-change-outreach']
  ),

  skill(
    'meeting-brief',
    'Meeting Brief Generator',
    'Generate a pre-meeting brief for a prospect or customer meeting, including company research, attendee profiles, agenda, and strategic objectives.',
    'workflow',
    'research',
    [
      { name: 'Company name', description: 'Company you are meeting with', required: true },
      { name: 'Attendee names or LinkedIn URLs', description: 'People who will be in the meeting', required: false },
      { name: 'Meeting objective', description: 'What you want to achieve in the meeting', required: true },
    ],
    [
      { name: 'Meeting brief', description: 'Pre-meeting research document with context, agenda, and talking points' },
      { name: 'Attendee profiles', description: 'Background on each attendee including recent activity' },
    ],
    ['prepare for a meeting', 'create a meeting brief for', '/meeting-brief']
  ),

  skill(
    'messaging-ab-tester',
    'Messaging A/B Tester',
    'Create multiple variants of a message — email subject, ad headline, landing page hero — to A/B test and identify which performs best.',
    'workflow',
    'content',
    [
      { name: 'Original message', description: 'The current message to create variants of', required: true },
      { name: 'Test goal', description: 'What metric you are optimising for: open rate, CTR, conversion', required: true },
      { name: 'Number of variants', description: 'How many alternatives to create', required: false },
    ],
    [
      { name: 'Message variants', description: 'Alternative versions with explanation of the angle each tests' },
      { name: 'Testing recommendation', description: 'Which variants to test first and how to structure the test' },
    ],
    ['create A/B test variants', 'test different message angles', '/messaging-ab-tester']
  ),

  skill(
    'meta-ads-campaign-builder',
    'Meta Ads Campaign Builder',
    'Build complete Meta (Facebook and Instagram) ad campaigns with audience targeting, creative briefs, copy, and campaign structure.',
    'workflow',
    'ads',
    [
      { name: 'Campaign objective', description: 'Awareness, traffic, leads, or conversions', required: true },
      { name: 'Product or offer', description: 'What you are advertising', required: true },
      { name: 'Target audience description', description: 'Demographics, interests, and behaviours to target', required: true },
      { name: 'Monthly budget', description: 'Approximate monthly Meta Ads budget', required: false },
    ],
    [
      { name: 'Campaign structure', description: 'Campaign, ad set, and ad hierarchy with settings' },
      { name: 'Ad copy and creative briefs', description: 'Primary text, headlines, and creative direction for each ad' },
    ],
    ['build a Meta ads campaign', 'create Facebook ads', '/meta-ads-campaign-builder']
  ),

  skill(
    'news-signal-outreach',
    'News Signal Outreach',
    'Generate personalised outreach triggered by a company news event — product launch, award, partnership — using the news as a timely hook.',
    'workflow',
    'outreach',
    [
      { name: 'Company name', description: 'Company that appeared in the news', required: true },
      { name: 'News item', description: 'The news event or announcement to reference', required: true },
      { name: 'Your connection', description: 'How your product relates to their news event', required: true },
    ],
    [
      { name: 'Outreach email', description: 'Personalised email referencing the news as a hook' },
      { name: 'LinkedIn message', description: 'Shorter LinkedIn variant of the same message' },
    ],
    ['reach out based on news', 'news-triggered outreach', '/news-signal-outreach']
  ),

  skill(
    'newsletter-monitor',
    'Newsletter Monitor',
    'Monitor newsletters in your space for new issues, trending topics, and competitor advertising to stay ahead of market conversation.',
    'workflow',
    'research',
    [
      { name: 'Newsletter list', description: 'Newsletters to monitor with subscription or RSS details', required: true },
      { name: 'Keywords', description: 'Topics to flag when they appear in issues', required: false },
    ],
    [
      { name: 'Newsletter digest', description: 'Summary of recent issues from monitored newsletters' },
      { name: 'Trend signals', description: 'Recurring topics and emerging themes across newsletters' },
    ],
    ['monitor newsletters', 'track newsletter content', '/newsletter-monitor']
  ),

  skill(
    'newsletter-signal-scanner',
    'Newsletter Signal Scanner',
    'Scan newsletters for buying intent signals, sponsored content, and competitor activity to inform your GTM and advertising strategy.',
    'workflow',
    'research',
    [
      { name: 'Newsletters to scan', description: 'Newsletter names or archive URLs to scan', required: true },
      { name: 'Signal types', description: 'What to look for: competitor ads, pain language, market trends', required: false },
    ],
    [
      { name: 'Signal report', description: 'Identified signals with source newsletter and date' },
      { name: 'Opportunity summary', description: 'Recommended actions based on the signals found' },
    ],
    ['scan newsletters for signals', 'find buying intent in newsletters', '/newsletter-signal-scanner']
  ),

  skill(
    'paid-channel-prioritizer',
    'Paid Channel Prioritiser',
    'Analyse your business model, audience, and budget to recommend the highest-ROI paid channels and the right sequencing to test them.',
    'workflow',
    'ads',
    [
      { name: 'Product and audience', description: 'What you sell and who buys it', required: true },
      { name: 'Budget', description: 'Total paid media budget available', required: true },
      { name: 'Current channel performance', description: 'Results from any channels already running', required: false },
    ],
    [
      { name: 'Channel priority ranking', description: 'Recommended channels ordered by expected ROI' },
      { name: 'Testing roadmap', description: 'Sequence and budget allocation for testing each channel' },
    ],
    ['which paid channels should I use', 'prioritise my ad channels', '/paid-channel-prioritizer']
  ),

  skill(
    'pipeline-review',
    'Pipeline Review',
    'Review your sales pipeline to identify stalled deals, forecast accuracy issues, and coaching opportunities for the team.',
    'workflow',
    'sales',
    [
      { name: 'Pipeline data', description: 'CRM export or deal list with stage, value, and age', required: true },
      { name: 'Forecast period', description: 'Quarter or month to review against', required: false },
    ],
    [
      { name: 'Pipeline health report', description: 'Assessment of deal quality, velocity, and forecast coverage' },
      { name: 'At-risk deals', description: 'Deals flagged as stalled or likely to slip with recommended actions' },
    ],
    ['review my pipeline', 'pipeline health check', '/pipeline-review']
  ),

  skill(
    'programmatic-seo-planner',
    'Programmatic SEO Planner',
    'Plan a programmatic SEO strategy by identifying scalable page templates, data sources, and keyword patterns for large-scale content generation.',
    'workflow',
    'seo',
    [
      { name: 'Product or service', description: 'What you are building programmatic SEO for', required: true },
      { name: 'Target keywords', description: 'Seed keywords or patterns to expand programmatically', required: true },
    ],
    [
      { name: 'Programmatic SEO blueprint', description: 'Page template designs, data sources, and URL patterns' },
      { name: 'Keyword pattern analysis', description: 'Scalable keyword clusters and estimated traffic opportunity' },
    ],
    ['plan programmatic SEO', 'build a pSEO strategy', '/programmatic-seo-planner']
  ),

  skill(
    'programmatic-seo-spy',
    'Programmatic SEO Spy',
    'Reverse-engineer competitor programmatic SEO strategies by analysing their URL patterns, page templates, and data sources.',
    'workflow',
    'seo',
    [
      { name: 'Competitor domain', description: 'Domain to analyse for programmatic SEO patterns', required: true },
    ],
    [
      { name: 'pSEO teardown', description: 'Analysis of URL structure, templates, and data sources used' },
      { name: 'Traffic opportunities', description: 'Pages driving significant traffic that you could replicate' },
    ],
    ['spy on competitor programmatic SEO', 'reverse engineer pSEO', '/programmatic-seo-spy']
  ),

  skill(
    'qbr-deck-builder',
    'QBR Deck Builder',
    'Build a Quarterly Business Review deck with account health, key metrics, wins, challenges, and strategic recommendations for the next quarter.',
    'workflow',
    'content',
    [
      { name: 'Customer account', description: 'Account name and context for the QBR', required: true },
      { name: 'Metrics and results', description: 'Key performance data from the quarter', required: true },
      { name: 'Next quarter goals', description: 'Objectives for the upcoming quarter', required: false },
    ],
    [
      { name: 'QBR slide deck', description: 'Complete QBR presentation structure with content for each slide' },
      { name: 'Executive summary', description: 'One-page summary of the QBR for busy stakeholders' },
    ],
    ['build a QBR deck', 'create quarterly business review', '/qbr-deck-builder']
  ),

  skill(
    'review-intelligence-digest',
    'Review Intelligence Digest',
    'Aggregate and synthesise product reviews from multiple platforms into an intelligence digest highlighting trends, complaints, and praise patterns.',
    'workflow',
    'research',
    [
      { name: 'Product or competitor', description: 'Product to generate the review intelligence digest for', required: true },
      { name: 'Platforms', description: 'Review sites to aggregate from', required: false },
      { name: 'Time period', description: 'Date range for reviews to include', required: false },
    ],
    [
      { name: 'Review digest', description: 'Synthesised report of themes, sentiment, and top quotes' },
      { name: 'Feature request list', description: 'Most-requested features extracted from review text' },
    ],
    ['synthesise product reviews', 'review intelligence report', '/review-intelligence-digest']
  ),

  skill(
    'sales-call-prep',
    'Sales Call Prep',
    'Prepare a sales rep for an upcoming call with account research, attendee profiles, likely objections, and a recommended talk track.',
    'workflow',
    'sales',
    [
      { name: 'Company name', description: 'The account being called', required: true },
      { name: 'Meeting attendees', description: 'Names and titles of people on the call', required: false },
      { name: 'Deal stage', description: 'Where this opportunity is in the sales process', required: false },
    ],
    [
      { name: 'Call prep document', description: 'Research summary, agenda, and key talking points' },
      { name: 'Objection handlers', description: 'Anticipated objections with prepared responses' },
    ],
    ['prep for a sales call', 'prepare for a discovery call', '/sales-call-prep']
  ),

  skill(
    'sales-coaching',
    'Sales Coaching',
    'Analyse call recordings, email threads, or deal notes and provide structured coaching feedback to improve rep performance.',
    'workflow',
    'sales',
    [
      { name: 'Call recording or transcript', description: 'Sales call content to coach on', required: false },
      { name: 'Email thread', description: 'Sales email exchange to review', required: false },
      { name: 'Coaching focus area', description: 'Specific skill to focus on: discovery, objection handling, closing', required: false },
    ],
    [
      { name: 'Coaching feedback', description: 'Structured feedback with specific examples and improvement suggestions' },
      { name: 'Scorecard', description: 'Skill ratings across key sales competencies' },
    ],
    ['coach me on this call', 'give me sales feedback', '/sales-coaching']
  ),

  skill(
    'sales-performance-review',
    'Sales Performance Review',
    'Analyse sales team performance against targets, identify top performers and areas of improvement, and generate coaching priorities.',
    'workflow',
    'sales',
    [
      { name: 'Performance data', description: 'Rep-level sales data with quota, pipeline, and closed revenue', required: true },
      { name: 'Review period', description: 'Time period to review (monthly, quarterly)', required: true },
    ],
    [
      { name: 'Performance summary', description: 'Team and individual performance vs target with trends' },
      { name: 'Coaching priorities', description: 'Specific development areas for each rep ranked by impact' },
    ],
    ['review sales team performance', 'analyse rep results', '/sales-performance-review']
  ),

  skill(
    'search-ad-keyword-architect',
    'Search Ad Keyword Architect',
    'Build a comprehensive keyword architecture for paid search campaigns including match types, negative keywords, and ad group structure.',
    'workflow',
    'ads',
    [
      { name: 'Product or service', description: 'What you are advertising in paid search', required: true },
      { name: 'Seed keywords', description: 'Starting keywords to expand from', required: true },
      { name: 'Competitors', description: 'Competitor brand terms to include or exclude', required: false },
    ],
    [
      { name: 'Keyword list', description: 'Full keyword list with match types and estimated volume' },
      { name: 'Negative keyword list', description: 'Terms to exclude to prevent wasted spend' },
      { name: 'Ad group structure', description: 'Recommended grouping of keywords into ad groups' },
    ],
    ['build keyword architecture', 'create keyword list for Google Ads', '/search-ad-keyword-architect']
  ),

  skill(
    'seo-content-audit',
    'SEO Content Audit',
    'Audit existing website content for SEO performance, identifying pages to update, consolidate, or remove based on traffic and ranking data.',
    'workflow',
    'seo',
    [
      { name: 'Website URL', description: 'The site to audit', required: true },
      { name: 'Traffic data', description: 'Google Search Console or Analytics export', required: false },
    ],
    [
      { name: 'Content audit report', description: 'Page-by-page assessment with action recommendations' },
      { name: 'Priority update list', description: 'Pages ranked by improvement potential' },
    ],
    ['audit my SEO content', 'content audit for SEO', '/seo-content-audit']
  ),

  skill(
    'seo-opportunity-finder',
    'SEO Opportunity Finder',
    'Find untapped SEO opportunities including low-competition keywords, featured snippet targets, and content gaps vs competitors.',
    'workflow',
    'seo',
    [
      { name: 'Your domain', description: 'Your website domain', required: true },
      { name: 'Competitor domains', description: 'Competitor sites to gap-analyse against', required: false },
      { name: 'Topic focus', description: 'Content topics or product areas to focus on', required: false },
    ],
    [
      { name: 'Opportunity list', description: 'Ranked list of SEO opportunities with traffic potential' },
      { name: 'Quick wins', description: 'Opportunities achievable within 30–90 days' },
    ],
    ['find SEO opportunities', 'discover keyword gaps', '/seo-opportunity-finder']
  ),

  skill(
    'sequence-performance',
    'Sequence Performance Analyser',
    'Analyse the performance of email or LinkedIn outreach sequences to identify drop-off points, subject lines, and steps that need optimisation.',
    'workflow',
    'sales',
    [
      { name: 'Sequence performance data', description: 'Open rates, reply rates, and conversion by step', required: true },
      { name: 'Sequence copy', description: 'The email or message copy for each step', required: false },
    ],
    [
      { name: 'Performance analysis', description: 'Step-by-step breakdown of sequence performance with benchmarks' },
      { name: 'Optimisation recommendations', description: 'Specific changes to improve reply rates and conversions' },
    ],
    ['analyse my email sequence', 'improve outreach sequence performance', '/sequence-performance']
  ),

  skill(
    'serp-feature-sniper',
    'SERP Feature Sniper',
    'Identify SERP feature opportunities — featured snippets, People Also Ask, local packs — that your content can target for instant visibility gains.',
    'workflow',
    'seo',
    [
      { name: 'Target keywords', description: 'Keywords to analyse for SERP feature opportunities', required: true },
      { name: 'Your domain', description: 'Your website to check current SERP feature presence', required: false },
    ],
    [
      { name: 'SERP feature opportunities', description: 'Keywords where SERP features are available and winnable' },
      { name: 'Content recommendations', description: 'Specific content changes to win each SERP feature' },
    ],
    ['find SERP feature opportunities', 'target featured snippets', '/serp-feature-sniper']
  ),

  skill(
    'sponsored-newsletter-finder',
    'Sponsored Newsletter Finder',
    'Find newsletters in your niche that actively run paid sponsorships with audience data, rates, and previous sponsor examples.',
    'workflow',
    'ads',
    [
      { name: 'Target niche or industry', description: 'Topic area to find sponsored newsletters in', required: true },
      { name: 'Budget range', description: 'Sponsorship budget to filter by affordability', required: false },
    ],
    [
      { name: 'Newsletter sponsor opportunities', description: 'Newsletters with active sponsorship programs, rates, and contacts' },
      { name: 'Past sponsor examples', description: 'Companies who have previously sponsored each newsletter' },
    ],
    ['find newsletters to advertise in', 'newsletter advertising opportunities', '/sponsored-newsletter-finder']
  ),

  skill(
    'topical-authority-mapper',
    'Topical Authority Mapper',
    'Map the content needed to build topical authority in a subject area, creating a pillar-cluster architecture with gap analysis.',
    'workflow',
    'seo',
    [
      { name: 'Core topic', description: 'The main topic area to build authority in', required: true },
      { name: 'Your domain', description: 'Your website to assess current coverage', required: false },
      { name: 'Competitor domains', description: 'Competitors who rank well in this topic', required: false },
    ],
    [
      { name: 'Topical authority map', description: 'Pillar and cluster content architecture with content titles' },
      { name: 'Gap analysis', description: 'Topics not yet covered that are needed for authority' },
    ],
    ['build topical authority', 'map content for authority', '/topical-authority-mapper']
  ),

  skill(
    'trending-ad-hook-spotter',
    'Trending Ad Hook Spotter',
    'Identify trending creative hooks and ad formats gaining traction across social platforms before they become saturated.',
    'workflow',
    'ads',
    [
      { name: 'Industry or niche', description: 'Market segment to identify trending hooks for', required: true },
      { name: 'Ad platforms', description: 'Meta, TikTok, YouTube, or all', required: false },
    ],
    [
      { name: 'Trending hooks', description: 'Hook formats gaining traction with examples' },
      { name: 'Hook templates', description: 'Adapted versions of trending hooks for your product' },
    ],
    ['find trending ad hooks', 'what hooks are working right now', '/trending-ad-hook-spotter']
  ),

  skill(
    'voice-of-customer-synthesizer',
    'Voice-of-Customer Synthesiser',
    'Synthesise voice-of-customer data from reviews, interviews, surveys, and support tickets into actionable insights for messaging and product decisions.',
    'workflow',
    'research',
    [
      { name: 'VoC data sources', description: 'Reviews, survey responses, interview transcripts, or support tickets', required: true },
      { name: 'Analysis focus', description: 'Messaging, product gaps, churn reasons, or all', required: false },
    ],
    [
      { name: 'VoC synthesis report', description: 'Themes, exact quotes, and frequency analysis from customer language' },
      { name: 'Messaging recommendations', description: 'Customer language to adopt in your copy and positioning' },
    ],
    ['synthesise customer feedback', 'voice of customer analysis', '/voice-of-customer-synthesizer']
  ),
]

// ── Playbooks ─────────────────────────────────────────────────────────────────

const PLAYBOOKS: GTMSkill[] = [
  skill(
    'client-onboarding',
    'Client Onboarding Playbook',
    'End-to-end playbook for onboarding new clients — from kickoff meeting to first value delivery — with task assignments, timelines, and success milestones.',
    'playbook',
    'research',
    [
      { name: 'Client name', description: 'Name of the client being onboarded', required: true },
      { name: 'Contract start date', description: 'Date the engagement begins', required: true },
      { name: 'Primary contact', description: 'Client\'s main point of contact', required: false },
    ],
    [
      { name: 'Onboarding plan', description: 'Step-by-step onboarding timeline with owners and deadlines' },
      { name: 'Kickoff agenda', description: 'Agenda for the kickoff meeting' },
      { name: 'Success milestones', description: 'Defined 30/60/90-day success criteria' },
    ],
    ['onboard a new client', 'create onboarding plan', '/client-onboarding'],
    ['meeting-brief', 'customer-discovery']
  ),

  skill(
    'client-package-local',
    'Client Package (Local)',
    'Assemble and export a complete client-ready deliverable package to local file storage, including all reports, decks, and supporting assets.',
    'playbook',
    'content',
    [
      { name: 'Client name', description: 'Client the package is for', required: true },
      { name: 'Deliverables to include', description: 'List of reports and assets to bundle', required: true },
      { name: 'Output directory', description: 'Local path to save the package to', required: false },
    ],
    [
      { name: 'Client package', description: 'Assembled and formatted deliverable package ready for export' },
      { name: 'Package manifest', description: 'Index of all files included in the package' },
    ],
    ['package client deliverables', 'export client package locally', '/client-package-local']
  ),

  skill(
    'client-package-notion',
    'Client Package (Notion)',
    'Assemble and publish a complete client-ready deliverable package directly to a Notion workspace with structured pages and navigation.',
    'playbook',
    'content',
    [
      { name: 'Client name', description: 'Client the package is for', required: true },
      { name: 'Notion workspace', description: 'Target Notion workspace or page URL', required: true },
      { name: 'Deliverables to include', description: 'List of reports and assets to publish', required: true },
    ],
    [
      { name: 'Notion package', description: 'Published Notion pages with all deliverables structured and linked' },
      { name: 'Notion URL', description: 'Direct link to the client\'s Notion package' },
    ],
    ['publish client package to Notion', 'send deliverables to Notion', '/client-package-notion']
  ),

  skill(
    'client-packet-engine',
    'Client Packet Engine',
    'Orchestrate the end-to-end creation and delivery of a client intelligence packet — research, analysis, synthesis, and formatted output.',
    'playbook',
    'content',
    [
      { name: 'Client or prospect name', description: 'Who the packet is being built for', required: true },
      { name: 'Packet type', description: 'Sales, onboarding, QBR, or custom', required: true },
      { name: 'Delivery format', description: 'PDF, Notion, Slides, or email', required: false },
    ],
    [
      { name: 'Client packet', description: 'Complete formatted client intelligence packet' },
      { name: 'Delivery confirmation', description: 'Confirmation of successful delivery with link or attachment' },
    ],
    ['create a client packet', 'build intelligence packet for', '/client-packet-engine'],
    ['company-current-gtm-analysis', 'meeting-brief', 'competitor-intel']
  ),

  skill(
    'competitor-monitoring-system',
    'Competitor Monitoring System',
    'Set up a continuous competitor monitoring system that tracks messaging, pricing, content, ads, and hiring across your key competitors on a recurring schedule.',
    'playbook',
    'competitive-intel',
    [
      { name: 'Competitor list', description: 'Competitors to monitor on an ongoing basis', required: true },
      { name: 'Monitoring cadence', description: 'Daily, weekly, or monthly monitoring frequency', required: false },
      { name: 'Alert channels', description: 'Where to receive alerts: Slack, email, or Notion', required: false },
    ],
    [
      { name: 'Monitoring setup', description: 'Configured monitoring system with sources, cadence, and alerts' },
      { name: 'First report', description: 'Initial competitive intelligence report for all monitored competitors' },
    ],
    ['set up competitor monitoring', 'continuous competitive intelligence system', '/competitor-monitoring-system'],
    ['competitor-intel', 'competitor-content-tracker', 'competitive-pricing-intel', 'tech-stack-teardown']
  ),

  skill(
    'event-prospecting-pipeline',
    'Event Prospecting Pipeline',
    'Build a full prospecting pipeline around an event — scraping speakers and attendees, qualifying against ICP, and sending personalised outreach before and after.',
    'playbook',
    'lead-generation',
    [
      { name: 'Event name and URL', description: 'The conference or event to build pipeline from', required: true },
      { name: 'ICP criteria', description: 'Qualification criteria to apply to attendees and speakers', required: true },
      { name: 'Outreach timing', description: 'How many days before/after the event to reach out', required: false },
    ],
    [
      { name: 'Prospect pipeline', description: 'Qualified prospect list from the event with contact data' },
      { name: 'Outreach sequences', description: 'Pre-event and post-event outreach messages for each prospect' },
      { name: 'Pipeline report', description: 'Summary of pipeline generated from the event' },
    ],
    ['prospect from an event', 'build event pipeline', '/event-prospecting-pipeline'],
    ['conference-speaker-scraper', 'luma-event-attendees', 'lead-qualification', 'cold-email-outreach']
  ),

  skill(
    'outbound-prospecting-engine',
    'Outbound Prospecting Engine',
    'Run a full outbound prospecting engine that finds leads, enriches data, qualifies against ICP, and launches personalised multi-channel sequences.',
    'playbook',
    'outreach',
    [
      { name: 'ICP definition', description: 'Ideal customer profile to prospect for', required: true },
      { name: 'Target channels', description: 'Email, LinkedIn, or both', required: true },
      { name: 'Monthly target', description: 'Number of qualified prospects to add to sequences per month', required: false },
    ],
    [
      { name: 'Prospect list', description: 'Qualified prospects ready for outreach' },
      { name: 'Active sequences', description: 'Running outreach sequences with personalised messages per prospect' },
      { name: 'Pipeline report', description: 'Weekly summary of outbound activity and results' },
    ],
    ['run outbound prospecting', 'build an outbound engine', '/outbound-prospecting-engine'],
    ['apollo-lead-finder', 'icp-identification', 'inbound-lead-enrichment', 'cold-email-outreach', 'linkedin-outreach']
  ),

  skill(
    'seo-content-engine',
    'SEO Content Engine',
    'Operate a continuous SEO content production engine — from keyword research and brief creation through to draft production and publishing optimisation.',
    'playbook',
    'seo',
    [
      { name: 'Target topics', description: 'Core topics or keyword areas to build content around', required: true },
      { name: 'Monthly content target', description: 'Number of pieces to produce per month', required: false },
      { name: 'Domain', description: 'Your website domain for existing coverage analysis', required: false },
    ],
    [
      { name: 'Content pipeline', description: 'Prioritised queue of content to produce with briefs' },
      { name: 'Published content', description: 'SEO-optimised articles ready for publishing' },
      { name: 'Monthly report', description: 'Ranking and traffic progress report' },
    ],
    ['run SEO content production', 'build a content engine', '/seo-content-engine'],
    ['seo-opportunity-finder', 'content-brief-factory', 'topical-authority-mapper', 'seo-content-audit']
  ),

  skill(
    'signal-detection-pipeline',
    'Signal Detection Pipeline',
    'Set up a continuous signal detection pipeline that monitors funding, hiring, news, and intent signals across target accounts and routes them to the right outreach workflow.',
    'playbook',
    'research',
    [
      { name: 'Target account list', description: 'Companies to monitor for buying signals', required: true },
      { name: 'Signal types', description: 'Which signals to monitor: funding, hiring, news, intent', required: false },
      { name: 'Routing rules', description: 'Which signals trigger which outreach workflows', required: false },
    ],
    [
      { name: 'Signal pipeline', description: 'Configured monitoring pipeline with routing rules' },
      { name: 'Signal alerts', description: 'Daily or weekly digest of detected signals with recommended actions' },
      { name: 'Pipeline metrics', description: 'Signals detected, outreach triggered, and pipeline attributed' },
    ],
    ['set up signal detection', 'monitor buying signals across accounts', '/signal-detection-pipeline'],
    ['signal-scanner', 'funding-signal-monitor', 'hiring-signal-outreach', 'news-signal-outreach']
  ),
]

// ── Combine all skills ────────────────────────────────────────────────────────

const GTM_SKILLS: GTMSkill[] = [...CAPABILITIES, ...COMPOSITES, ...PLAYBOOKS]

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${GTM_SKILLS.length} GTM skills...\n`)

  const { error } = await supabase
    .from('skills')
    .upsert(GTM_SKILLS, { onConflict: 'slug', ignoreDuplicates: false })

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Done. Seeded ${GTM_SKILLS.length} skills successfully.`)
  console.log(`  - Capabilities (tool):   ${CAPABILITIES.length}`)
  console.log(`  - Composites (workflow): ${COMPOSITES.length}`)
  console.log(`  - Playbooks (playbook):  ${PLAYBOOKS.length}`)
}

seed().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
