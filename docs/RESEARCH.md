# 群问 AI：方案调研与实现说明

调研日期：2026-08-17

## 结论

“一次搜索，让豆包、千问、元宝分别回答”最稳妥的实现，不是自动操作三款消费级 App，而是在服务端并发调用它们背后的官方模型 API：

- 豆包：火山方舟 `ChatCompletions`，OpenAI 风格接口为 `https://ark.cn-beijing.volces.com/api/v3/chat/completions`。
- 千问：阿里云百炼提供千问官方 API 和 OpenAI 兼容接口；本项目使用 DashScope 兼容地址。
- 元宝：元宝是消费级助手产品，开放能力应接腾讯混元；腾讯云提供 `ChatCompletions` 与 OpenAI 兼容接口。

这种架构能合法、稳定地并发请求，支持限流、超时、计费统计和后续扩展；自动登录或抓取三款 App/网页会面临验证码、登录态、页面变动、服务条款与隐私风险，不适合作为正式产品主路径。

## GitHub 参考

- [Vercel Chatbot](https://github.com/vercel/chatbot)：Next.js App Router、流式聊天、模型网关与持久化的成熟工程结构。
- [big-AGI](https://github.com/enricoros/big-AGI)：其中 Beam 功能验证了多模型并排回答的交互价值，并提供移动优先的多提供商聊天思路。
- [Multi-Model AI Chatbot](https://github.com/arnobt78/Multi-Model-AI-Chat-Bot--React-FullStack)：展示了多家 OpenAI 兼容提供商与失败回退机制。

本项目没有直接复制这些仓库，而是吸收了三个核心做法：服务端统一适配器、`Promise.all` 并发调用、单个提供商失败时局部降级。

## 官方资料

- [火山方舟 ChatCompletions](https://api.volcengine.com/api-explorer/?action=ChatCompletions&groupName=%E5%AF%B9%E8%AF%9D%28Chat%29+API&serviceCode=ark&version=2024-01-01)
- [阿里云百炼平台说明](https://www.alibabacloud.com/help/zh/model-studio/what-is-model-studio)
- [腾讯混元 API 概览](https://cloud.tencent.cn/document/product/1729/101848)

## 当前实现

```text
网页版 / App(PWA)
        │ POST /api/ask
        ▼
服务端统一调度器
   ├─ 火山方舟 → 豆包
   ├─ 阿里百炼 → 千问
   └─ 腾讯混元 → 元宝能力
        │
        ▼
并排原始回答 + 群问总结
```

- `/`：桌面网页版，三栏并排比较答案。
- `/mobile`：独立 App 版交互，可安装为 PWA，使用模型标签切换答案。
- `/api/ask`：三家模型并发请求；缺少密钥或单家失败时，回退到演示结果。
- `.env.example`：三家服务所需配置。密钥只放服务端，不能写入浏览器或提交仓库。

## 产品化下一步

1. 将“群问总结”从前端规则文案升级为一个独立的汇总模型调用，并标出一致点与分歧点。
2. 增加 SSE 流式输出、请求超时和按提供商的重试/熔断策略。
3. 加入账号、额度、历史记录、敏感信息脱敏和成本统计。
4. App 若需上架，再用 Capacitor 封装当前 PWA，或复用接口开发 React Native 客户端。
