export interface SkillInput {
  name: string
  description: string
  required?: boolean
}

export interface SkillOutput {
  name: string
  description: string
}

export interface Skill {
  id: string
  slug: string
  name: string
  description: string
  prompt?: string
  skill_type: 'strategy' | 'tool' | 'workflow' | 'playbook'
  category: string
  inputs: SkillInput[]
  outputs: SkillOutput[]
  trigger_phrases: string[]
  auto_save: boolean
  connects_to?: string[]
  enabled?: boolean
}
