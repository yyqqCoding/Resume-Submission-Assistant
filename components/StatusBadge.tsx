import { STATUS_LABEL, type ApplicationStatus } from '@/types'

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: 'border-blue-200 bg-blue-50 text-blue-700',
  interview_1: 'border-amber-200 bg-amber-50 text-amber-700',
  interview_2: 'border-orange-200 bg-orange-50 text-orange-700',
  final: 'border-rose-200 bg-rose-50 text-rose-700',
  offer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-200 bg-slate-100 text-slate-500',
}

type Props = {
  status: ApplicationStatus
}

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
