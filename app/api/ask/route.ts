type ProviderId = "doubao" | "qwen" | "hunyuan";

const providerConfig: Record<ProviderId, { key?: string; model?: string; url: string }> = {
  doubao: {
    key: process.env.DOUBAO_API_KEY,
    model: process.env.DOUBAO_MODEL,
    url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  },
  qwen: {
    key: process.env.DASHSCOPE_API_KEY,
    model: process.env.QWEN_MODEL || "qwen-plus",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
  hunyuan: {
    key: process.env.HUNYUAN_API_KEY,
    model: process.env.HUNYUAN_MODEL || "hunyuan-turbos-latest",
    url: "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
  },
};

const demoAnswers: Record<ProviderId, (question: string) => string> = {
  doubao: (question) => `关于「${question}」，建议先从体验出发：明确最重要的目标，再把时间分成几个有节奏的阶段。先做优先级最高的部分，过程中预留弹性，往往比把计划排满更有效。`,
  qwen: (question) => `针对「${question}」，可以按四步推进：1. 明确成功标准；2. 列出时间、成本与风险；3. 选择可快速验证的方案；4. 根据反馈迭代。这样既有结构，也能避免过度规划。`,
  hunyuan: (question) => `我的建议是兼顾效率和可持续性。围绕「${question}」先设定主方案与备选方案，从低成本、小范围开始验证，并记录关键结果，再决定是否扩大投入。`,
};

async function askProvider(provider: ProviderId, question: string) {
  const config = providerConfig[provider];
  const started = Date.now();
  if (!config.key || !config.model) {
    await new Promise((resolve) => setTimeout(resolve, 420 + Math.random() * 650));
    return { provider, text: demoAnswers[provider](question), latency: (Date.now() - started) / 1000, demo: true };
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "你是 AIAsk 中的一名独立顾问。请用简洁、可靠的中文回答，给出清晰建议；不确定时明确说明。" },
          { role: "user", content: question },
        ],
        temperature: 0.6,
      }),
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("模型未返回文本");
    return { provider, text, latency: (Date.now() - started) / 1000 };
  } catch (error) {
    return {
      provider,
      text: demoAnswers[provider](question),
      latency: (Date.now() - started) / 1000,
      demo: true,
      error: `实时接口暂不可用，已回退到演示回答（${error instanceof Error ? error.message.slice(0, 80) : "未知错误"}）`,
    };
  }
}

export async function POST(request: Request) {
  const body = await request.json() as { question?: string; providers?: ProviderId[] };
  const question = body.question?.trim();
  const providers = body.providers?.filter((item): item is ProviderId => item in providerConfig) || [];
  if (!question || !providers.length) return Response.json({ error: "问题和模型不能为空" }, { status: 400 });
  if (question.length > 6000) return Response.json({ error: "问题不能超过 6000 字" }, { status: 400 });

  const answers = await Promise.all(providers.map((provider) => askProvider(provider, question)));
  return Response.json({ answers });
}
