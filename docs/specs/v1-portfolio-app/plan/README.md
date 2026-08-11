# V1 作品集 App — 实施计划（Plan）

> 权威需求：`../requirements.md`；技术规格：`../spec.md`。
> 执行方式：P0→P7 垂直交付，每阶段结束 `awaiting-human-review`，用户批准后再进下一阶段。
> 提交策略：user-managed（用户明确指示才 commit）。

## 阶段文件

| 文件 | 阶段 | 可演示检查点 |
|------|------|--------------|
| `P0.md` | 仓库清空 + monorepo 骨架 + Biome/Turbo/TS `check-types` 通过 | 骨架可类型检查 |
| `P1.md` | Alchemy 声明 Worker+D1+R2；本地 dev 健康检查；Drizzle schema+migrate+seed | 健康检查 + 种子数据入本地 D1 |
| `P2.md` | better-auth 注册登录登出；Native 会话；未登录可进首页壳 | 可注册/登录，未登录见首页 |
| `P3.md` | oRPC `notes.list/get` + 双列信息流 + 详情（只读）连真实 D1 种子 | 双列流 + 详情可见种子内容 |
| `P4.md` | R2 上传 + `notes.create` + 发布页；发布后列表可见 | 发布成功，列表可见新笔记 |
| `P5.md` | 点赞 toggle + 登录拦截 + 回首页策略 | 点赞/取消 + 未登录跳登录 |
| `P6.md` | 我的主页 + 设置退出 + 中文 UI 打磨 | 我的/设置/退出 |
| `P7.md` | Alchemy 部署公网 + Native 线上 URL + §2 剧本验收 + README | 公网 + 模拟器走通主路径 |

## 通用约束（每阶段均适用）

- 不动 DEC 冻结项；禁止实现 NG-\*；不引入 Kysely/评论/搜索/AI/双轨 IaC。
- 修改前看 `git status` 与相关 diff；保持改动聚焦。
- 验证：`bun run check-types` + 对改动文件 scoped Biome；native 依赖变更后 `bunx expo install --check`；服务端改动用 `alchemy dev` 临时端口实测。
- 每阶段结束：列出关键改动、已运行检查、未运行项及原因，等待用户批准。
