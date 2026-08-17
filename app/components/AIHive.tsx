"use client";

import { FormEvent, useMemo, useState } from "react";

type ProviderId = "doubao" | "qwen" | "hunyuan";
type Provider = {
  id: ProviderId;
  name: string;
  model: string;
  monogram: string;
  color: string;
};
type Answer = {
  provider: ProviderId;
  text: string;
  latency: number;
  demo?: boolean;
  error?: string;
};

const providers: Provider[] = [
  { id: "doubao", name: "豆包", model: "Doubao Seed", monogram: "豆", color: "violet" },
  { id: "qwen", name: "千问", model: "Qwen Plus", monogram: "千", color: "amber" },
  { id: "hunyuan", name: "元宝", model: "腾讯混元", monogram: "元", color: "cyan" },
];

const initialAnswers: Answer[] = [
  {
    provider: "doubao",
    latency: 1.8,
    demo: true,
    text: "如果第一次去成都，我会把三天分成三种节奏：老城烟火、城市文化和近郊自然。第一天从人民公园喝盖碗茶开始，步行到宽窄巷子，傍晚去奎星楼街吃小吃。",
  },
  {
    provider: "qwen",
    latency: 2.1,
    demo: true,
    text: "建议采用「1 天市井 + 1 天人文 + 1 天自然」：Day 1 人民公园—鹤鸣茶社—武侯祠—锦里；Day 2 成都博物馆—文殊院—东郊记忆；Day 3 都江堰或青城山。",
  },
  {
    provider: "hunyuan",
    latency: 2.4,
    demo: true,
    text: "三日游要避免景点堆叠。住宿可选春熙路或天府广场附近，地铁出行更高效。美食建议把火锅、川菜、小吃分开安排，并提前为三星堆或熊猫基地预约。",
  },
];

const demoText: Record<ProviderId, (question: string) => string> = {
  doubao: (question) => `关于「${question}」，我建议先明确目标和限制，再把任务拆成 3 个可执行步骤。第一步收集关键信息，第二步比较两到三种路径，最后用一个小范围测试验证结果。这样能最快得到可靠结论。`,
  qwen: (question) => `针对「${question}」，可以用结构化方法处理：① 定义成功标准；② 列出成本、时间和风险；③ 按优先级执行；④ 一周后复盘。核心不是一次做对，而是建立可验证、可迭代的过程。`,
  hunyuan: (question) => `我的判断是：处理「${question}」时，应同时考虑短期效果与长期维护。建议保留一个主方案和一个备选方案，先做低成本验证，并记录关键数据后再扩大投入。`,
};

function Mark({ provider, small = false }: { provider: Provider; small?: boolean }) {
  return <span className={`provider-mark ${provider.color} ${small ? "small" : ""}`}>{provider.monogram}</span>;
}

export function AIHive({ mode }: { mode: "desktop" | "mobile" }) {
  const [question, setQuestion] = useState("帮我规划一个成都三日游，兼顾美食和人文景点");
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers);
  const [enabled, setEnabled] = useState<ProviderId[]>(providers.map((p) => p.id));
  const [loading, setLoading] = useState<ProviderId[]>([]);
  const [activeMobile, setActiveMobile] = useState<ProviderId>("doubao");
  const [copied, setCopied] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const synthesis = useMemo(() => {
    if (!answers.length) return "选择至少一个模型，然后开始提问。";
    if (loading.length) return "三位 AI 正在从不同角度思考，综合结论会在回答完成后生成。";
    return "综合来看，最佳方案是先明确目标与约束，再用分阶段、可验证的方式推进。三个回答的共同点是：减少一次性堆叠，优先处理关键路径，并保留调整空间。";
  }, [answers, loading.length]);

  function toggleProvider(id: ProviderId) {
    setEnabled((current) => {
      if (!current.includes(id)) return [...current, id];
      const next = current.filter((item) => item !== id);
      if (activeMobile === id && next.length) setActiveMobile(next[0]);
      return next;
    });
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const clean = question.trim();
    if (!clean || !enabled.length || loading.length) return;
    setAnswers([]);
    setLoading(enabled);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: clean, providers: enabled }),
      });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { answers: Answer[] };
      setAnswers(data.answers);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setAnswers(enabled.map((provider, index) => ({
        provider,
        text: demoText[provider](clean),
        latency: 1.6 + index * 0.4,
        demo: true,
      })));
    } finally {
      setLoading([]);
    }
  }

  async function copyAnswer(answer: Answer) {
    await navigator.clipboard?.writeText(answer.text);
    setCopied(answer.provider);
    setTimeout(() => setCopied(null), 1200);
  }

  const activeAnswer = answers.find((answer) => answer.provider === activeMobile);
  const activeProvider = providers.find((provider) => provider.id === activeMobile)!;
  const mobileLoading = loading.includes(activeMobile);

  return (
    <main className={mode === "mobile" ? "mobile-stage" : "product-shell"}>
      {mode === "desktop" ? (
        <>
          <aside className={`sidebar ${historyOpen ? "open" : ""}`}>
            <div className="brand"><span className="brand-glyph">问</span><span>群问 AI</span></div>
            <button className="new-chat" onClick={() => { setQuestion(""); setAnswers([]); }}>＋ <span>发起新问题</span></button>
            <p className="side-label">今天</p>
            <button className="history-item active">成都三日游怎么规划</button>
            <button className="history-item">对比三款降噪耳机</button>
            <p className="side-label">过去 7 天</p>
            <button className="history-item">帮我优化项目周报</button>
            <button className="history-item">分析这份体检报告</button>
            <div className="side-bottom">
              <button className="side-setting"><span>⌘</span> 模型与密钥</button>
              <a href="/mobile" className="device-switch"><span>▯</span> 查看 App 版</a>
              <div className="profile"><span className="avatar">R</span><span><b>个人空间</b><small>演示模式</small></span><span>···</span></div>
            </div>
          </aside>
          <button className="mobile-menu" aria-label="打开历史记录" onClick={() => setHistoryOpen(!historyOpen)}>☰</button>
        </>
      ) : null}

      <section className={mode === "mobile" ? "phone" : "workspace"}>
        {mode === "mobile" ? (
          <header className="app-header">
            <button aria-label="打开菜单">☰</button>
            <div className="brand compact"><span className="brand-glyph">问</span><span>群问 AI</span></div>
            <a href="/" aria-label="打开网页版">⌗</a>
          </header>
        ) : (
          <header className="topbar">
            <div><h1>成都三日游怎么规划</h1><span className="saved-state">已自动保存</span></div>
            <div className="top-actions"><span className="status-dot" /> 3 个模型在线 <button aria-label="分享">↗</button></div>
          </header>
        )}

        <div className={mode === "mobile" ? "app-content" : "content"}>
          <section className="question-block">
            <p className="eyebrow">你的问题</p>
            <h2>{question || "想问什么？"}</h2>
            <div className="model-row">
              <span>{mode === "mobile" ? "选择回答者" : "同时询问"}</span>
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  className={`model-chip ${enabled.includes(provider.id) ? "selected" : ""}`}
                  onClick={() => toggleProvider(provider.id)}
                >
                  <Mark provider={provider} small /> {provider.name}<span className="check">✓</span>
                </button>
              ))}
            </div>
          </section>

          {mode === "desktop" ? (
            <>
              <section className="answer-grid" aria-live="polite">
                {providers.filter((provider) => enabled.includes(provider.id)).map((provider) => {
                  const answer = answers.find((item) => item.provider === provider.id);
                  const isLoading = loading.includes(provider.id);
                  return (
                    <article className={`answer-card ${provider.color}`} key={provider.id}>
                      <div className="card-head">
                        <div><Mark provider={provider} /><span><b>{provider.name}</b><small>{provider.model}</small></span></div>
                        {answer ? <span className="latency">{answer.demo ? "演示" : `${answer.latency.toFixed(1)}s`}</span> : null}
                      </div>
                      {isLoading ? (
                        <div className="thinking"><i /><i /><i /><span>正在思考...</span></div>
                      ) : answer ? (
                        <div className="answer-body"><p>{answer.text}</p>{answer.error && <small className="error-note">{answer.error}</small>}</div>
                      ) : <div className="empty-answer">等待提问</div>}
                      <div className="card-foot"><button onClick={() => answer && copyAnswer(answer)}>{copied === provider.id ? "已复制" : "复制"}</button><button>好答案 ♡</button></div>
                    </article>
                  );
                })}
              </section>

              <section className="synthesis">
                <div className="spark">✦</div>
                <div><div className="synthesis-title"><b>群问总结</b><span>综合 {answers.length || enabled.length} 个回答</span></div><p>{synthesis}</p><div className="consensus"><span>共同观点</span><b>先规划，再执行</b><b>保留调整空间</b><b>用结果验证</b></div></div>
              </section>
            </>
          ) : (
            <>
              <nav className="answer-tabs">
                {providers.filter((provider) => enabled.includes(provider.id)).map((provider) => (
                  <button key={provider.id} className={activeMobile === provider.id ? "active" : ""} onClick={() => setActiveMobile(provider.id)}>
                    <Mark provider={provider} small /> {provider.name}
                  </button>
                ))}
              </nav>
              <article className={`mobile-answer ${activeProvider.color}`} aria-live="polite">
                <div className="card-head"><div><Mark provider={activeProvider} /><span><b>{activeProvider.name}</b><small>{activeProvider.model}</small></span></div><span className="latency">{activeAnswer?.demo ? "演示" : activeAnswer ? `${activeAnswer.latency.toFixed(1)}s` : ""}</span></div>
                {mobileLoading ? <div className="thinking"><i /><i /><i /><span>正在思考...</span></div> : <p>{activeAnswer?.text || "向上滑动输入问题，三位 AI 会同时回答。"}</p>}
                <div className="card-foot"><button onClick={() => activeAnswer && copyAnswer(activeAnswer)}>▣ {copied ? "已复制" : "复制"}</button><button>♡ 收藏</button><button>↗ 分享</button></div>
              </article>
              <section className="mobile-summary"><div className="spark">✦</div><div><b>群问总结</b><p>{synthesis}</p></div></section>
            </>
          )}
        </div>

        <form className={mode === "mobile" ? "app-composer" : "composer"} onSubmit={ask}>
          <div className="composer-inner">
            <button type="button" className="attach" aria-label="添加附件">＋</button>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="问一个问题，让多位 AI 一起回答…" rows={1} />
            {mode === "desktop" && <span className="shortcut">↵</span>}
            <button className="send" disabled={!question.trim() || !enabled.length || !!loading.length} aria-label="发送问题">↑</button>
          </div>
          <small>{mode === "mobile" ? `${enabled.length} 位 AI 将同时回答` : "AI 可能会犯错，重要信息请交叉验证"}</small>
        </form>

        {mode === "mobile" ? <nav className="bottom-nav"><button className="active"><span>◉</span>对话</button><button><span>⌕</span>发现</button><button><span>▤</span>历史</button><button><span>○</span>我的</button></nav> : null}
      </section>
    </main>
  );
}
