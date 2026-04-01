import { type Skill, SKILLS_LIST } from './skills'

/**
 * Detects if a message should trigger a skill.
 * Checks explicit slash commands first, then keyword matching.
 * Only matches against skills that are active for this org.
 */
export function detectSkill(
  message: string,
  activeSlugs: string[]
): Skill | null {
  const lower = message.trim().toLowerCase()

  // 1. Explicit slash command: message starts with /slug
  const slashMatch = SKILLS_LIST.find(
    (s) =>
      activeSlugs.includes(s.slug) &&
      lower.startsWith(`/${s.slug}`)
  )
  if (slashMatch) return slashMatch

  // 2. Keyword detection against each skill's trigger list
  for (const skill of SKILLS_LIST) {
    if (!activeSlugs.includes(skill.slug)) continue
    if (skill.triggers.some((kw) => lower.includes(kw))) {
      return skill
    }
  }

  return null
}
