import React from 'react'

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="type-h1 text-text">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-text-secondary">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}
