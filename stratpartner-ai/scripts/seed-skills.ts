/**
 * Seed all 18 skills into the database.
 * Run with: npx tsx scripts/seed-skills.ts
 *
 * Prerequisites:
 * - .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * - Run migration 0002 first in the Supabase SQL editor
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { SKILLS_LIST } from '../src/lib/skills'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log(`Seeding ${SKILLS_LIST.length} skills…\n`)

  for (const skill of SKILLS_LIST) {
    // Upsert by slug
    const { error } = await supabase.from('skills').upsert(
      {
        slug: skill.slug,
        title: skill.name,
        name: skill.name,
        description: skill.description,
        content: skill.content,
        prompt_injection: skill.content,
        track: skill.track,
      },
      { onConflict: 'slug' }
    )

    if (error) {
      console.error(`  ✗ ${skill.slug}: ${error.message}`)
    } else {
      console.log(`  ✓ ${skill.slug}`)
    }
  }

  // Activate all skills for all existing orgs
  console.log('\nActivating skills for all orgs…')

  const { data: orgs } = await supabase.from('orgs').select('id')
  const { data: skills } = await supabase.from('skills').select('id')

  if (!orgs || !skills) {
    console.log('No orgs or skills found — skipping org_skills seeding.')
    return
  }

  for (const org of orgs) {
    for (const skill of skills) {
      const { error } = await supabase.from('org_skills').upsert(
        {
          org_id: org.id,
          skill_id: skill.id,
          enabled: true,
        },
        { onConflict: 'org_id,skill_id' }
      )

      if (error) {
        console.error(`  ✗ org ${org.id} + skill ${skill.id}: ${error.message}`)
      }
    }
  }

  console.log(`  ✓ Activated ${skills.length} skills for ${orgs.length} orgs`)
  console.log('\nDone.')
}

main().catch(console.error)
