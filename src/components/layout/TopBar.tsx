'use client'

interface TopBarProps {
  title: string
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
    </div>
  )
}
