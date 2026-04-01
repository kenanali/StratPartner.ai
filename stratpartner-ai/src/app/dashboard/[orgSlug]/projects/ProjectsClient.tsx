'use client'

import { useState } from 'react'
import Link from 'next/link'
import VoiceIntake from '../VoiceIntake'

type Phase = string
type Status = string

interface ProjectRow {
  id: string
  name: string
  description: string | null
  phase: Phase
  status: Status
  created_at: string
  org_id: string
  task_count: number
  deliverable_count: number
}

interface Props {
  orgId: string
  orgSlug: string
  projects: ProjectRow[]
  openNew?: boolean
}

function phaseBadgeClass(phase: Phase): string {
  switch (phase?.toLowerCase()) {
    case 'discovery': return 'bg-indigo-100 text-indigo-700'
    case 'activation': return 'bg-amber-100 text-amber-700'
    case 'delivery': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function statusBadgeClass(status: Status): string {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-green-50 text-green-700'
    case 'paused': return 'bg-gray-100 text-gray-500'
    case 'archived': return 'bg-gray-100 text-gray-400'
    default: return 'bg-gray-100 text-gray-500'
  }
}

export default function ProjectsClient({ orgId, orgSlug, projects, openNew = false }: Props) {
  const [intakeOpen, setIntakeOpen] = useState(openNew)

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-primary">Projects</h1>
        <button
          onClick={() => setIntakeOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <span aria-hidden="true">+</span>
          New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white px-8 py-16 text-center">
          <p className="text-sm text-gray-500 mb-4">
            No projects yet. Create your first project to get started.
          </p>
          <button
            onClick={() => setIntakeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            + New Project
          </button>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                {project.phase && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${phaseBadgeClass(project.phase)}`}>
                    {project.phase}
                  </span>
                )}
                {project.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadgeClass(project.status)}`}>
                    {project.status}
                  </span>
                )}
              </div>

              <h2 className="font-display font-semibold text-gray-900 leading-snug mb-1">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">{project.description}</p>
              )}
              {!project.description && <div className="flex-1" />}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{project.task_count}</span>{' '}
                  {project.task_count === 1 ? 'task' : 'tasks'}
                  <span className="mx-1.5 text-gray-300">·</span>
                  <span className="font-medium text-gray-600">{project.deliverable_count}</span>{' '}
                  {project.deliverable_count === 1 ? 'deliverable' : 'deliverables'}
                </p>
                <Link
                  href={`/dashboard/${orgSlug}/projects/${project.id}`}
                  className="text-xs font-semibold text-accent hover:underline shrink-0"
                >
                  Open &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <VoiceIntake
        orgId={orgId}
        orgSlug={orgSlug}
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
      />
    </div>
  )
}
