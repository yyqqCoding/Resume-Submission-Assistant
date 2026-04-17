# Resume Submission Assistant

一个基于 `Next.js 15 + Supabase + Vercel` 的简历投递追踪器，用于集中管理投递记录、阶段流转、面试记录和后续跟进动作。

在线地址：`https://jobb.lol`

## 功能概览

- 邮箱注册、邮箱确认、登录与退出登录
- 新增投递记录，支持维护公司、岗位、来源链接和投递备注
- 投递总览页，支持状态筛选、统计和卡片化浏览
- 投递详情页，支持查看完整时间线
- 支持更新投递状态，状态变化自动写入时间线
- 支持为每个状态节点维护一条可反复修改的面试记录
- 支持删除投递记录及其关联时间线

## 当前固定状态

- `已投递`
- `一面`
- `二面`
- `三面`
- `加面`
- `HR面`
- `Offer`
- `已拒`

## 技术栈

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Supabase`
- `Vitest + Testing Library`
- `Vercel`

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
JOBAGENT_BASE_URL=http://127.0.0.1:18090
```

### 3. 初始化数据库

按顺序执行 `docs/` 里的 SQL：

- [step-2-alter-applied-at-to-date.sql](/mnt/e/javaproject/resume-submission-assistant/docs/step-2-alter-applied-at-to-date.sql)
- [step-2-supabase-trigger.sql](/mnt/e/javaproject/resume-submission-assistant/docs/step-2-supabase-trigger.sql)
- 如果你有旧数据，还需要：
  - [step-5-fix-application-events-timezone.sql](/mnt/e/javaproject/resume-submission-assistant/docs/step-5-fix-application-events-timezone.sql)
  - [step-6-fixed-status-migration.sql](/mnt/e/javaproject/resume-submission-assistant/docs/step-6-fixed-status-migration.sql)

### 4. 启动项目

```bash
npm run dev
```

访问：`http://localhost:3000`

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:run
```

## 部署架构

当前生产环境采用：

- `Spaceship`：域名注册商
- `Cloudflare`：DNS 托管
- `Vercel`：Next.js 应用部署
- `Supabase`：认证、数据库、时间线事件存储

### 生产域名

- 主域名：`https://jobb.lol`

### 生产环境变量

Vercel 生产环境至少需要：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://jobb.lol
JOBAGENT_BASE_URL=https://your-jobagent-service.example.com
```

### Supabase Auth 配置

在 `Authentication -> URL Configuration` 中配置：

- `Site URL = https://jobb.lol`
- `Redirect URLs` 至少包含：
  - `https://jobb.lol/auth/callback`
  - `http://localhost:3000/auth/callback`

## 认证与时间线说明

- 注册后不会直接登录，用户需要先点击邮箱确认链接
- 邮件确认链接会回到 `/auth/callback`
- 投递状态变化事件由数据库 trigger 自动写入 `application_events`
- 面试记录直接写在对应状态节点的 `application_events.remark`

## 项目结构

```text
app/
  login/                  登录与注册
  applications/           投递列表、详情、新增、server actions
  auth/callback/          邮件确认回跳

components/
  ApplicationsClient.tsx
  ApplicationCard.tsx
  ApplicationDetailClient.tsx
  Timeline.tsx
  TimelineEventDialog.tsx
  StatusBadge.tsx
  ui/

lib/
  supabase/
  env.ts

types/
  index.ts

tests/unit/
  *.test.ts(x)

docs/
  开发说明、SQL 脚本、部署说明
```

## 相关文档

- [总体开发文档.md](/mnt/e/javaproject/resume-submission-assistant/docs/总体开发文档.md)
- [step-1-登录以及连接数据库.md](/mnt/e/javaproject/resume-submission-assistant/docs/step-1-登录以及连接数据库.md)
- [step-2-新增加投递记录.md](/mnt/e/javaproject/resume-submission-assistant/docs/step-2-新增加投递记录.md)
- [step-3-投递列表 + 状态更新.md](/mnt/e/javaproject/resume-submission-assistant/docs/step-3-投递列表 + 状态更新.md)
- [step-4-详情页时间线.md](/mnt/e/javaproject/resume-submission-assistant/docs/step-4-详情页时间线.md)
- [step-5-部署上线.md](/mnt/e/javaproject/resume-submission-assistant/docs/step-5-部署上线.md)

## 仓库地址

- GitHub: `https://github.com/yyqqCoding/Resume-Submission-Assistant`
