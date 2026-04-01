import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth and password gate disabled for testing — re-enable before going live
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
