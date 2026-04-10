const HOSTNAME_MAP: Record<string, string> = {
  'job.meituan.com': '美团',
  'careers.tencent.com': '腾讯',
  'job.alibaba.com': '阿里巴巴',
  'talent.baidu.com': '百度',
  'job.bytedance.com': '字节跳动',
  'jobs.bytedance.com': '字节跳动',
  'career.jd.com': '京东',
  'job.pinduoduo.com': '拼多多',
  'campus.meituan.com': '美团',
  'zhaopin.meituan.com': '美团',
  'jobs.netease.com': '网易',
  'hr.xiaomi.com': '小米',
  'job.bilibili.com': 'bilibili',
  'campus.bilibili.com': 'bilibili',
  'jobs.didichuxing.com': '滴滴',
  'job.kuaishou.com': '快手',
  'career.xiaohongshu.com': '小红书',
  'job.zhihu.com': '知乎',
  'jobs.shopee.cn': 'Shopee',
  'career.trip.com': '携程',
  'www.lagou.com': '拉勾',
  'www.zhipin.com': 'BOSS直聘',
  'www.liepin.com': '猎聘',
  'jobs.51job.com': '前程无忧',
  'www.linkedin.com': 'LinkedIn',
}

const FUZZY_MAP: Record<string, string> = {
  meituan: '美团',
  bytedance: '字节跳动',
  tencent: '腾讯',
  alibaba: '阿里巴巴',
  baidu: '百度',
  jd: '京东',
  bilibili: 'bilibili',
  xiaomi: '小米',
  kuaishou: '快手',
  netease: '网易',
  didi: '滴滴',
}

const SECOND_LEVEL_SUFFIXES = new Set([
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'co.uk',
])

function getFallbackCompany(hostname: string) {
  const normalized = hostname.replace(/^www\./, '')
  const parts = normalized.split('.')

  if (parts.length <= 1) {
    return normalized
  }

  const suffix = parts.slice(-2).join('.')
  if (SECOND_LEVEL_SUFFIXES.has(suffix) && parts.length >= 3) {
    return parts[parts.length - 3] ?? normalized
  }

  return parts[parts.length - 2] ?? normalized
}

export function parseCompanyFromUrl(url: string): {
  company: string
  hostname: string
} {
  let hostname = ''

  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return { company: '', hostname: '' }
  }

  const exactMatch = HOSTNAME_MAP[hostname]
  if (exactMatch) {
    return { company: exactMatch, hostname }
  }

  for (const [keyword, company] of Object.entries(FUZZY_MAP)) {
    if (hostname.includes(keyword)) {
      return { company, hostname }
    }
  }

  return {
    company: getFallbackCompany(hostname),
    hostname,
  }
}
