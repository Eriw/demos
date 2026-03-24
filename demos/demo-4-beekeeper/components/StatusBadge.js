export const STATUS_META = {
  healthy:          { label: 'Healthy',         color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  needs_attention:  { label: 'Needs Attention', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  swarming:         { label: 'Swarming',         color: 'bg-orange-100 text-orange-800 border-orange-200' },
  dormant:          { label: 'Dormant',          color: 'bg-stone-100 text-stone-600 border-stone-200' },
}

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.dormant
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  )
}
