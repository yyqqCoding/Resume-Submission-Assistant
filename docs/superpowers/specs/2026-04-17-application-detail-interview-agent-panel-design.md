# 第 10 步：投递详情页接入模拟面试 Agent 面板

## 背景

当前 `Resume-Submission-Assistant` 已经具备：

- 投递列表、分页、详情页浏览
- 投递状态流转
- 时间线节点级面试记录编辑
- `application_events.remark` 作为当前系统里的面试记录承载位

同时，独立仓库 `JobAgent` 已经具备可运行的后端闭环：

- 创建面试会话
- 基于简历、投递上下文、ResearchMCP 检索结果出题
- 提交答案、评分、追问、推进下一题
- 会话完成后输出总结与记忆沉淀

当前缺口不再是底层能力，而是把这套面试能力以最小成本接入现有网站，让用户在投递详情页内直接发起并完成一轮模拟面试。

## 目标

- 在投递详情页内提供“开始模拟面试”入口
- 发起面试时固定使用当前投递的 `company_name + job_title`
- 第一版不新增独立路由，直接在详情页右侧内嵌面试面板
- 前端通过本站 BFF 接口与 `JobAgent` 通信，不直接耦合外部服务地址
- 刷新页面后可基于前端本地 `sessionId` 恢复当前投递的活跃会话
- 会话完成后展示总结、题目主题、记忆沉淀结果
- 会话完成后把 AI 总结追加回当前投递最新时间线节点的 `remark`

## 非目标

- 不做独立 `/interviews` 页面
- 不做历史面试会话列表
- 不做多会话并发管理
- 不做语音输入、草稿自动保存、快捷键增强
- 不做复习页、画像页、技术栈成长页
- 不修改现有 Supabase 数据库结构
- 不要求第一版支持从后端按 `application_id` 查询最近未完成会话

## 方案概述

采用“详情页内嵌面试面板 + 站内 BFF 转发 + 本地 `sessionId` 恢复”的方案。

- 用户进入投递详情页
- 页面读取本地 `interview-session:{applicationId}`，若存在则尝试恢复会话
- 用户点击“开始模拟面试”后，前端调用本站 `/api/interviews/start`
- BFF 校验登录用户与投递归属，再转发到 `JobAgent`
- 面试面板在当前页内展示题目、进度、研究主题、回答输入区和即时反馈
- 用户提交答案后，BFF 继续转发到 `JobAgent`
- 若返回 `follow_up` 或 `next_question`，前端切换到下一题
- 若返回 `session_completed`，面板展示总结并将 AI 结果追加写回当前投递最新时间线节点的 `remark`

这个方案比前端直连 `JobAgent` 多一层很薄的适配，但能把服务地址、字段命名和未来鉴权变动隔离在站内接口层，后续产品化成本更低。

## 页面结构

### 顶部详情区

保持现有结构不变：

- 返回列表
- 当前投递状态 badge
- 公司名、岗位名、投递时间、来源链接
- 投递备注

### 下方主体区

继续保留左右双栏布局：

左栏：

- 时间线
- 时间线节点面试记录编辑

右栏：

- 当前已有的“跟进操作”卡片
- 在该区域下方新增“模拟面试”卡片

第一版不跳出详情页，不新增新标签页，也不引入全屏对话框。

## 面试面板交互

### 默认态

当不存在本地会话时，面试面板显示：

- 标题：`模拟面试`
- 一段说明文案，说明会基于当前投递的公司和岗位发起面试
- 当前固定参数摘要：
  - 公司：`application.company_name`
  - 岗位：`application.job_title`
  - 题量：固定 `3`
- 一个主按钮：`开始模拟面试`

### 恢复态

当页面加载时发现本地存在 `sessionId`：

- 面板先进入恢复中状态
- 调用本站 `GET /api/interviews/session/{sessionId}`
- 恢复成功：
  - 直接展示当前题目
  - 保留当前进度
- 恢复失败：
  - 删除本地 `sessionId`
  - 回退到默认态

### 进行中态

面板展示四块内容：

1. 顶部摘要
- 公司
- 岗位
- 当前进度 `answeredCount / totalQuestions`
- `researchSummary.topics`

2. 当前题目卡片
- `question`
- `topic`
- `questionKind`
- `evidenceLabel`
- 可选展示 `difficulty`

3. 回答输入区
- 一个 `textarea`
- 一个提交按钮

4. 即时反馈区
- 展示上一题提交后的 `score`
- 展示 `shortFeedback`

当题目是追问时，应显式标注“追问”，避免用户误以为已经进入下一主问题。

### 完成态

会话完成后展示：

- 平均分 `averageScore`
- 题目主题列表 `topics`
- 记忆沉淀结果 `memoryUpdate`
- remark 回写结果

若 remark 同步成功，显示“已同步到当前投递面试记录”；若失败，只显示同步失败提示，不回滚面试完成态。

## 参数来源与字段映射

第一版启动会话时，参数固定来自当前投递记录：

- `user_id` = 当前登录用户 id
- `application_id` = 当前详情页投递 id
- `company` = `application.company_name`
- `role` = `application.job_title`
- `question_count` = `3`

若 `company_name` 或 `job_title` 为空，第一版直接阻止启动，并提示“当前投递缺少公司或岗位信息，无法发起模拟面试”。

前端不直接消费 `JobAgent` 原始结构，而是统一使用站内视图模型：

### `InterviewQuestionView`

- `id`
- `topic`
- `question`
- `questionKind`
- `evidenceLabel`
- `difficulty`
- `expectedSignals`

### `InterviewSessionView`

- `sessionId`
- `applicationId`
- `company`
- `role`
- `currentQuestion`
- `progress`
- `completed`
- `researchSummary`
- `turns`
- `sessionSummary`

### `InterviewAnswerResultView`

- `decision`
- `evaluation`
- `currentQuestion`
- `nextQuestion`
- `progress`
- `sessionSummary`
- `memoryUpdate`
- `remarkSync`

这层映射由 `Resume-Submission-Assistant` 的 BFF 负责，前端组件只依赖本站结构。

## BFF 接口设计

### `POST /api/interviews/start`

用途：

- 从当前投递详情页发起新会话

前端请求体：

- `applicationId`

BFF 职责：

- 读取当前登录用户
- 读取并校验该投递归属于当前用户
- 校验投递存在 `company_name` 与 `job_title`
- 按固定参数组装 `JobAgent` 请求
- 转发到 `POST {JOB_AGENT_BASE_URL}/api/interview-sessions`
- 把返回结构映射为 `InterviewSessionView`

### `GET /api/interviews/session/{sessionId}`

用途：

- 恢复本地已保存的活跃会话

前端请求参数：

- `sessionId`
- 查询串带上 `applicationId`

BFF 职责：

- 读取当前登录用户
- 调用 `GET {JOB_AGENT_BASE_URL}/api/interview-sessions/{sessionId}`
- 校验返回中的 `user_id` 与当前用户匹配
- 校验返回中的 `application_id` 与当前详情页 `applicationId` 一致
- 将结果映射为 `InterviewSessionView`

### `POST /api/interviews/session/{sessionId}/answer`

用途：

- 提交当前答案

前端请求体：

- `applicationId`
- `answer`

BFF 职责：

- 读取当前登录用户
- 校验投递归属
- 转发到 `POST {JOB_AGENT_BASE_URL}/api/interview-sessions/{sessionId}/answers`
- 将 `follow_up / next_question / session_completed` 三种结果映射为统一前端响应
- 当 `decision = session_completed` 时，立刻触发 remark 追加回写

## 本地恢复设计

第一版只做按投递维度恢复，不做全局会话索引。

本地键格式：

- `interview-session:{applicationId}` -> `sessionId`

规则：

- 启动成功后写入本地
- 页面进入时读取本地并尝试恢复
- 恢复失败时删除本地 key
- 会话完成后删除本地 key

这样可以避免不同投递之间串会话，同时不引入额外的前端状态管理复杂度。

## 组件边界

### [`components/ApplicationDetailClient.tsx`](/mnt/e/JavaProject/Resume-Submission-Assistant/components/ApplicationDetailClient.tsx)

- 继续作为投递详情页主客户端容器
- 负责把当前 `application` 传给面试面板
- 保持现有更新时间线记录、更新状态、删除投递逻辑
- 在右侧栏新增面试面板挂载位

### `components/InterviewPanel.tsx`

- 面试 UI 主组件
- 管理本地恢复、发起会话、提交答案、展示完成态
- 不直接访问 `JobAgent`
- 只调用前端 `lib/interview-client.ts`

### `lib/interview-client.ts`

- 封装对本站 `/api/interviews/*` 的调用
- 负责处理 JSON 解析与错误消息抽取

### `types/interview.ts`

- 定义前端消费的面试类型
- 作为 `InterviewPanel` 和 BFF 之间的契约

### `app/api/interviews/start/route.ts`

- 启动会话 BFF

### `app/api/interviews/session/[sessionId]/route.ts`

- 恢复会话 BFF

### `app/api/interviews/session/[sessionId]/answer/route.ts`

- 提交答案与完成态回写 remark 的 BFF

## 前端状态流转

第一版面试面板维护 6 个明确状态：

- `idle`
- `restoring`
- `starting`
- `active`
- `submitting`
- `completed`

转移规则：

- 页面进入且存在本地 `sessionId`：`idle -> restoring`
- 恢复成功：`restoring -> active`
- 恢复失败：`restoring -> idle`
- 点击开始：`idle -> starting -> active`
- 提交答案且返回 `follow_up` 或 `next_question`：`active -> submitting -> active`
- 提交答案且返回 `session_completed`：`active -> submitting -> completed`

第一版不引入复杂 reducer；状态足够少，直接用局部 state 即可。

## remark 回写策略

会话完成后，BFF 需要把 AI 总结追加到当前投递最新时间线节点的 `remark`。

第一版不覆盖原 `remark`，只做追加，避免用户已有手写记录丢失。

回写规则：

- 当前最新 `remark` 为空：直接写入 AI 总结
- 当前最新 `remark` 非空：保留原文，追加两个换行后再写 AI 总结
- 回写失败：不影响面试完成态，只在返回结果里标记 `remarkSync.failed`

建议的追加格式：

```md
## 模拟面试总结（AI）
- 公司：美团
- 岗位：Java 后端
- 总题数：3
- 已完成：3
- 平均分：78

### 题目主题
- redis consistency
- mq reliability
- transaction isolation

### 记忆沉淀
- 分类：strength
- 主题：
  - redis consistency
  - transaction isolation

### AI总结
- 本轮表现：回答有结构，能覆盖主流程
- 待加强：异常兜底、边界条件、落地细节表达不足
```

第一版使用纯文本或 markdown 追加即可，不做富文本渲染升级。

## 错误处理

- 未登录：沿用现有逻辑跳转 `/login`
- 当前投递不属于登录用户：BFF 返回 `403`
- 当前投递缺少公司或岗位：BFF 返回 `400`
- `JobAgent` 创建会话失败：前端停留在默认态并提示“模拟面试暂不可用”
- 会话恢复失败：删除本地 `sessionId`，回退到默认态
- 提交答案失败：保留当前输入，提示重试
- remark 回写失败：面试保持完成态，仅提示“模拟面试已完成，但同步投递记录失败”

## 测试范围

### BFF 接口测试

- 仅当前用户可对自己的投递发起面试
- 缺少 `company_name` 或 `job_title` 时返回 `400`
- 启动接口能正确把投递字段映射为 `JobAgent` 参数
- 恢复接口会校验 `user_id` 与 `application_id`
- 完成态下会触发 remark 追加回写
- remark 回写失败不会影响 `session_completed` 主流程

### 前端组件测试

- 有本地 `sessionId` 时会自动进入恢复流程
- 恢复失败会清掉本地 key 并回到默认态
- 点击开始后会切到进行中态
- `follow_up`、`next_question`、`session_completed` 三种结果都能正确切换 UI
- 完成态会清除本地 `sessionId`
- remark 同步成功与失败两种提示都能正确显示

### 页面集成测试

- 详情页原有投递信息、时间线操作、删除投递逻辑不回归
- 新面试面板能稳定嵌入右侧栏，不破坏现有布局

## 验收标准

- 用户能在投递详情页点击“开始模拟面试”直接开练
- 发起请求固定使用当前投递的公司名和岗位名，不需要额外填写表单
- 刷新页面后，只要本地存在有效 `sessionId`，就能恢复到当前题目
- 提交答案后，页面能根据追问、下一题、完成三种结果正确切换
- 会话完成后，页面展示总结、主题和记忆沉淀结果
- AI 总结会被追加到当前投递最新时间线节点的 `remark`
- remark 同步失败不会导致已完成的面试结果丢失
