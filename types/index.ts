export const ALL_STATUSES = [
  'applied',
  'interview_1',
  'interview_2',
  'final',
  'offer',
  'rejected',
] as const

export type ApplicationStatus = (typeof ALL_STATUSES)[number]

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: '已投递',
  interview_1: '一面',
  interview_2: '二面',
  final: '终面',
  offer: 'Offer',
  rejected: '已拒',
}

export interface Application {
  id: string
  user_id: string
  source_url: string | null
  raw_title: string | null
  company_name: string | null
  job_title: string | null
  status: ApplicationStatus
  applied_at: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationEvent {
  id: string
  application_id: string
  stage: ApplicationStatus
  happened_at: string
  remark: string | null
}
