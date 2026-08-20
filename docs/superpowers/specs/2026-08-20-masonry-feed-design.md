# 双列瀑布流设计

## 目标

将首页和「我的」页面从等高网格改为真正的双列瀑布流：每张卡片按自身渲染高度排列，下一张卡片紧跟所在列，不再被同一行另一张卡片的高度撑齐。

## 方案

使用 `@shopify/flash-list` v2 的 `FlashList` Masonry 能力，配置 `masonry` 与 `numColumns={2}`。FlashList 根据卡片的实际渲染高度完成列布局，同时继续提供 FlatList 兼容的 `onEndReached`、`ListEmptyComponent` 和 `ListFooterComponent` 能力，因此不需要自建滚动同步或列高度测量逻辑。

卡片封面移除固定 `3:4` 的 `aspectRatio`，优先使用远程图片的实际宽高比；图片尺寸加载前使用按笔记 ID 稳定生成的错落比例，避免统一处理为 `3:4` 的种子图片重新变成等高，同时避免每次刷新随机跳动。图片尺寸由卡片内部异步读取，尺寸变化后 FlashList 重新计算 Masonry 布局；真实的非 `3:4` 图片保留其实际比例。

首页和「我的」复用同一个 `NoteCard`，只替换列表实现和间距样式；API、分页查询、路由、鉴权和数据库均不变。

## 交互与状态

- 首页继续支持发布入口、点击卡片进入详情、下拉/上拉分页、加载中、空态、错误重试和到底提示。
- 「我的」继续使用已有鉴权门禁和个人笔记查询，只将已登录后的笔记网格改为 Masonry。
- 两列之间保持 12px 间距，卡片之间保持 12px 纵向间距。
- 图片尺寸获取失败时继续使用按笔记 ID 生成的兜底比例，不能阻塞卡片展示。

## 影响范围

- 修改 `apps/native/package.json` 增加 `@shopify/flash-list`。
- 修改 `apps/native/components/note-card.tsx` 支持真实图片比例。
- 修改 `apps/native/app/(tabs)/index.tsx` 和 `apps/native/app/(tabs)/me.tsx` 使用 Masonry FlashList。
- 新增针对图片比例解析逻辑的纯函数测试；已有查询和路由测试保持不变。

## 验证标准

- `bun install` 成功更新依赖锁定状态。
- `bunx biome check apps/native/components/note-card.tsx 'apps/native/app/(tabs)/index.tsx' 'apps/native/app/(tabs)/me.tsx'` 通过。
- `bun run check-types` 通过。
- 首页和「我的」页面的卡片不再按行等高，分页和错误态行为保持原样。
