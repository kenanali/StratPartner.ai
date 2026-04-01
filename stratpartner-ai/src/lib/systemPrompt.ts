import { SOUL } from './soul'
import { SKILLS_LIST, type Skill } from './skills'
import type { RetrievedChunk } from './retrieve'

interface SystemPromptParams {
  orgMemory: string
  retrievedChunks: RetrievedChunk[]
  activeSlugs: string[]
  detectedSkill: Skill | null
  projectContext?: {
    name: string
    phase: string
    description: string
    memory: string
  } | null
}

/**
 * Assembles the full system prompt in the canonical order:
 * 1. SOUL (always)
 * 2. PROJECT CONTEXT (if projectId provided)
 * 3. ORG MEMORY (always)
 * 4. RAG CONTEXT (if retrieved chunks exist)
 * 5. ACTIVE SKILL (if skill detected — full content injected for this turn only)
 * 6. SKILLS INDEX (always — list of available skills)
 * 7. DELIVERABLE INSTRUCTION (if inside a project)
 */
export function buildSystemPrompt(params: SystemPromptParams): string {
  const {
    orgMemory,
    retrievedChunks,
    activeSlugs,
    detectedSkill,
    projectContext,
  } = params

  const parts: string[] = []

  // 1. SOUL
  parts.push(SOUL)

  // 2. PROJECT CONTEXT
  if (projectContext) {
    parts.push(`[PROJECT CONTEXT]
You are working on: ${projectContext.name}
Current phase: ${projectContext.phase}
Project goal: ${projectContext.description}

Project memory:
${projectContext.memory || 'No project memory yet.'}
[/PROJECT CONTEXT]`)
  }

  // 3. ORG MEMORY
  parts.push(`[MEMORY]
Here is what I know about this client's organisation:
${orgMemory || 'No memory yet — this is the beginning of the engagement.'}
[/MEMORY]`)

  // 4. RAG CONTEXT
  if (retrievedChunks.length > 0) {
    const contextLines = retrievedChunks
      .map((c) => `Source: ${c.fileName}\n${c.content}`)
      .join('\n\n')
    parts.push(`[CONTEXT FROM UPLOADED DOCUMENTS]
The following excerpts are from documents the client has uploaded. Use them when relevant. Always cite the source file name when you draw on them.

${contextLines}
[/CONTEXT]`)
  } else {
    parts.push(`[CONTEXT FROM UPLOADED DOCUMENTS]
No relevant excerpts found in uploaded documents for this query.
[/CONTEXT]`)
  }

  // 5. ACTIVE SKILL + 6. SKILLS INDEX
  const activeSkills = SKILLS_LIST.filter((s) => activeSlugs.includes(s.slug))
  const skillsIndex = activeSkills
    .map((s) => `- /${s.slug}: ${s.name} — ${s.description}`)
    .join('\n')

  const nextSkillsInstruction = `
When you finish your response, if 2–3 specific skills from the list above would be genuinely valuable as the user's next action, add this on its own line at the very end (no code block, no explanation):
NEXT_SKILLS: skill-slug-1, skill-slug-2
Only include this when it adds real value. It will be stripped and rendered as clickable action buttons.`

  if (detectedSkill) {
    parts.push(`[AVAILABLE SKILLS]
You have access to the following strategy frameworks. Run the active skill in full now.

${skillsIndex}
${nextSkillsInstruction}

[ACTIVE SKILL: ${detectedSkill.name}]
${detectedSkill.content}
[/ACTIVE SKILL]
[/AVAILABLE SKILLS]`)
  } else {
    parts.push(`[AVAILABLE SKILLS]
You have access to the following strategy frameworks. If the user explicitly triggers one with /{slug} or if their request clearly calls for it, run that framework in full.

${skillsIndex}
${nextSkillsInstruction}
[/AVAILABLE SKILLS]`)
  }

  // 7. DELIVERABLE INSTRUCTION (only inside a project context)
  if (projectContext && detectedSkill?.autoSave) {
    parts.push(`[DELIVERABLE INSTRUCTION]
When you complete this skill output, end your response with the following marker exactly as shown:

---DELIVERABLE---
Title: [write a descriptive title for this deliverable, e.g. "Customer Journey Map — Enterprise Onboarding"]
---

This marker tells the system to save your output as a named deliverable for this project. The marker will be stripped before display to the user.
[/DELIVERABLE INSTRUCTION]`)
  }

  return parts.join('\n\n')
}
