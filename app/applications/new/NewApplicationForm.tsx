'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseCompanyFromUrl } from '@/lib/parser/hostname'

export type CreateApplicationResult = {
  error: string | null
}

type NewApplicationFormProps = {
  submitAction: (formData: FormData) => Promise<CreateApplicationResult>
}

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function NewApplicationForm({ submitAction }: NewApplicationFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [note, setNote] = useState('')
  const [appliedAt, setAppliedAt] = useState(getToday())
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleUrlChange(value: string) {
    setUrl(value)

    if (!value.startsWith('http')) {
      return
    }

    const { company: parsedCompany } = parseCompanyFromUrl(value)
    if (parsedCompany) {
      setCompany(parsedCompany)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!company.trim()) {
      setErrorMessage('请填写公司名')
      return
    }

    if (!jobTitle.trim()) {
      setErrorMessage('请填写岗位名')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('source_url', url.trim())
    formData.set('company_name', company.trim())
    formData.set('job_title', jobTitle.trim())
    formData.set('note', note.trim())
    formData.set('applied_at', appliedAt)

    try {
      const result = await submitAction(formData)

      if (result.error) {
        setErrorMessage(result.error)
        setIsSubmitting(false)
        return
      }

      router.push('/applications')
      router.refresh()
    } catch {
      setErrorMessage('网络异常，请稍后重试')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="source_url">
          投递链接
        </label>
        <input
          id="source_url"
          type="url"
          placeholder="粘贴招聘页链接，自动识别公司"
          value={url}
          onChange={(event) => handleUrlChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
        <p className="mt-2 text-xs leading-5 text-slate-400">
          支持常见招聘域名自动识别，未收录链接会回退为主域名。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="company_name">
          公司名
        </label>
        <input
          id="company_name"
          type="text"
          placeholder="自动识别，也可手动修改"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="job_title">
          岗位名
        </label>
        <input
          id="job_title"
          type="text"
          placeholder="例如：前端工程师、产品经理"
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="applied_at">
          投递日期
        </label>
        <input
          id="applied_at"
          type="date"
          value={appliedAt}
          onChange={(event) => setAppliedAt(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="note">
          备注
        </label>
        <textarea
          id="note"
          placeholder="选填，例如：内推、社招..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? '保存中...' : '保存投递记录'}
      </button>
    </form>
  )
}
