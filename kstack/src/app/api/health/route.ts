import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const TABLES = [
  'orgs',
  'memory',
  'messages',
  'files',
  'file_chunks',
  'skills',
  'org_skills',
  'meetings',
  'interviews',
]

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const results = await Promise.all(
      TABLES.map(async (table) => {
        const { error } = await supabase.from(table).select('count').limit(1)
        return { table, reachable: !error }
      })
    )

    const unreachable = results.filter((r) => !r.reachable).map((r) => r.table)

    if (unreachable.length > 0) {
      return NextResponse.json(
        { ok: false, tables: results, unreachable },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      tables: TABLES,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
