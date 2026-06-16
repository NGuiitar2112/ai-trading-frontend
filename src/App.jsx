import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://dime-production-eea8.up.railway.app";

const STOCKS = [
  { symbol: "RKLB", name: "Rocket Lab", sector: "Space" },
  { symbol: "ASTS", name: "AST SpaceMobile", sector: "Space" },
  { symbol: "IRDM", name: "Iridium", sector: "Space" },
  { symbol: "PL", name: "Planet Labs", sector: "Space" },
  { symbol: "LMT", name: "Lockheed Martin", sector: "Defense" },
  { symbol: "NOC", name: "Northrop Grumman", sector: "Defense" },
  { symbol: "BA", name: "Boeing", sector: "Aerospace" },
  { symbol: "NVDA", name: "NVIDIA", sector: "AI/Chip" },
  { symbol: "AVGO", name: "Broadcom", sector: "AI/Chip" },
  { symbol: "AMD", name: "AMD", sector: "AI/Chip" },
  { symbol: "INTC", name: "Intel", sector: "Chip" },
  { symbol: "TSM", name: "TSMC", sector: "Chip" },
  { symbol: "PLTR", name: "Palantir", sector: "AI" },
  { symbol: "AI", name: "C3.ai", sector: "AI" },
  { symbol: "AAPL", name: "Apple", sector: "Tech" },
  { symbol: "MSFT", name: "Microsoft", sector: "Tech" },
  { symbol: "GOOGL", name: "Alphabet", sector: "Tech" },
  { symbol: "META", name: "Meta", sector: "Tech" },
  { symbol: "AMZN", name: "Amazon", sector: "Tech" },
  { symbol: "SNOW", name: "Snowflake", sector: "Cloud" },
  { symbol: "CRM", name: "Salesforce", sector: "Cloud" },
  { symbol: "ORCL", name: "Oracle", sector: "Cloud" },
  { symbol: "TSLA", name: "Tesla", sector: "EV" },
  { symbol: "RIVN", name: "Rivian", sector: "EV" },
  { symbol: "NIO", name: "NIO", sector: "EV" },
  { symbol: "JPM", name: "JPMorgan", sector: "Finance" },
  { symbol: "BAC", name: "Bank of America", sector: "Finance" },
  { symbol: "GS", name: "Goldman Sachs", sector: "Finance" },
  { symbol: "COIN", name: "Coinbase", sector: "Crypto" },
  { symbol: "SPY", name: "S&P 500 ETF", sector: "ETF" },
  { symbol: "QQQ", name: "Nasdaq ETF", sector: "ETF" },
  { symbol: "ARKK", name: "ARK Innovation", sector: "ETF" },
  { symbol: "JEPQ", name: "JPM Nasdaq Income", sector: "ETF" },
  { symbol: "SCHD", name: "Schwab Dividend", sector: "ETF" },
  { symbol: "QYLD", name: "Nasdaq Covered Call", sector: "ETF" },
];

const SECTORS = ["ทั้งหมด","Space","AI/Chip","AI","Tech","Cloud","EV","Finance","ETF","Defense","Crypto","Aerospace","Chip"];
const TABS = [
  { id: "dashboard", label: "🏠 Home" },
  { id: "agent", label: "🤖 Agent" },
  { id: "market", label: "🌍 ตลาด" },
  { id: "chart", label: "📊 กราฟ" },
  { id: "ai", label: "🤖 AI" },
  { id: "portfolio", label: "💼 พอร์ต" },
  { id: "paper", label: "📈 Paper" },
  { id: "chat", label: "💬 Chat" },
  { id: "news", label: "📰 ข่าว" },
  { id: "alerts", label: "🔔 แจ้งเตือน" },
  { id: "options", label: "🎯 Options" },
  { id: "dev", label: "⚙️ Dev" },
  { id: "secretary", label: "🗂️ เลขา" },
];

const SIGNAL_CONFIG = {
  STRONG_BUY:  { label: "ซื้อแรง", color: "#10B981", bg: "rgba(16,185,129,0.15)", emoji: "🚀" },
  BUY:         { label: "ซื้อ",    color: "#34D399", bg: "rgba(52,211,153,0.12)",  emoji: "📈" },
  HOLD:        { label: "ถือ",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  emoji: "⏸️" },
  SELL:        { label: "ขาย",     color: "#F87171", bg: "rgba(248,113,113,0.12)", emoji: "📉" },
  STRONG_SELL: { label: "ขายแรง", color: "#EF4444", bg: "rgba(239,68,68,0.15)",   emoji: "🔴" },
};

// TradingView
function TradingViewChart({ symbol }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol, interval: "D",
      timezone: "Asia/Bangkok", theme: "dark", style: "1",
      locale: "th_TH", toolbar_bg: "#0D1527",
      backgroundColor: "rgba(8,13,26,1)",
      gridColor: "rgba(255,255,255,0.05)",
      studies: ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies"],
      container_id: "tv_main",
    });
    const w = document.createElement("div");
    w.style.cssText = "height:100%;width:100%";
    ref.current.appendChild(w);
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [symbol]);
  return <div ref={ref} id="tv_main" style={{ height:"100%", width:"100%" }} />;
}

// Storage helpers
const storage = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sector, setSector] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(STOCKS[0]);
  const [watchlist, setWatchlist] = useState(() => storage.get("watchlist", ["RKLB","AVGO","ASTS","NVDA","JEPQ","SCHD"]));
  const [prices, setPrices] = useState({});
  const [news, setNews] = useState([]);
  const [highImpactNews, setHighImpactNews] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [notif, setNotif] = useState(null);

  // Portfolio
  const [portfolio, setPortfolio] = useState(() => storage.get("portfolio", [
    { id: 1, symbol: "AVGO", name: "Broadcom", shares: 0.5, buyPrice: 409, sector: "AI/Chip" },
    { id: 2, symbol: "JEPQ", name: "JPM Nasdaq Income", shares: 10, buyPrice: 55, sector: "ETF" },
    { id: 3, symbol: "SCHD", name: "Schwab Dividend", shares: 8, buyPrice: 28, sector: "ETF" },
  ]));
  const [addSymbol, setAddSymbol] = useState("");
  const [addShares, setAddShares] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "สวัสดีครับ! ผมคือ AI Trading Assistant 🚀\nถามได้เลยว่า 'NVDA น่าซื้อไหม?' หรือ 'ตอนนี้ตลาดเป็นยังไง?'" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertSymbol, setAlertSymbol] = useState("");
  const [alertCondition, setAlertCondition] = useState("above");
  const [alertPrice, setAlertPrice] = useState("");

  // Options
  const [optType, setOptType] = useState("call");
  const [strike, setStrike] = useState(100);
  const [expiry, setExpiry] = useState("14");
  const [contracts, setContracts] = useState(1);
  const [simPrice, setSimPrice] = useState(100);
  const [optBal, setOptBal] = useState(1000);
  const [positions, setPositions] = useState([]);

  // Dashboard
  const [dashLoading, setDashLoading] = useState(false);

  // Dev Mode
  const [devCode, setDevCode] = useState("");
  const [devResult, setDevResult] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devTab, setDevTab] = useState("code");
  const [apiLogs, setApiLogs] = useState([]);

  const runDevCode = async () => {
    setDevLoading(true);
    setDevResult("");
    try {
      const res = await fetch(`${API_BASE}/api/dev/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: devCode }),
      });
      const d = await res.json();
      setDevResult(d.result || d.error || "ไม่มีผลลัพธ์");
    } catch(e) { setDevResult("❌ " + e.message); }
    setDevLoading(false);
  };

  const fetchApiLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/logs?limit=30`);
      setApiLogs(await res.json());
    } catch {}
  };

  // Secretary
  const [secMessages, setSecMessages] = useState([
    { role: "assistant", content: "สวัสดีครับ! ผมคือเลขา AI 🗂️\nช่วยงานได้ทุกอย่างเลยครับ เช่น:\n• จด Todo และ Reminder\n• สรุปข้อมูลและวางแผน\n• ค้นหาและวิเคราะห์\n• ร่างข้อความและเอกสาร\n• ติดตามงานและแจ้งเตือน\n\nจะให้ช่วยอะไรดีครับ?" }
  ]);
  const [secInput, setSecInput] = useState("");
  const [secLoading, setSecLoading] = useState(false);
  const [todos, setTodos] = useState(() => storage.get("todos", []));
  const [showTodos, setShowTodos] = useState(false);
  const secEndRef = useRef(null);

  // Collaboration State
  const [collabStatus, setCollabStatus] = useState(null);
  const [collabLoading, setCollabLoading] = useState(false);

  const fetchCollabStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/collab/status`);
      setCollabStatus(await res.json());
    } catch {}
  };

  const sendToCollab = async (message) => {
    try {
      const portfolioCtx = portfolioData.map(p =>
        `${p.symbol}: $${p.curPrice?.toFixed(2)} (${p.pnl>=0?"+":""}${p.pnlPct?.toFixed(2)}%)`
      ).join(", ");
      const res = await fetch(`${API_BASE}/api/collab/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: portfolioCtx }),
      });
      const d = await res.json();
      setSecMessages(prev => [...prev, { role: "assistant", content: 
        `🗂️ เลขารับเรื่องแล้วครับ!\n\n` +
        `📋 Task: ${d.task?.title || "กำลังวิเคราะห์..."}\n` +
        `${d.task?.needsApproval ? "⏳ รอการอนุมัติจากคุณ" : "✅ ส่งให้ Dev แล้ว"}\n\n` +
        `💬 ${d.reply || ""}` 
      }]);
      fetchCollabStatus();
    } catch {}
  };

  const approveTask = async (id, approved, feedback = "") => {
    setCollabLoading(true);
    try {
      await fetch(`${API_BASE}/api/collab/approve/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, feedback }),
      });
      showNotif(approved ? "✅ อนุมัติแล้ว!" : "❌ ปฏิเสธแล้ว", approved ? "#10B981" : "#EF4444");
      fetchCollabStatus();
    } catch {}
    setCollabLoading(false);
  };

  const devPropose = async () => {
    setCollabLoading(true);
    try {
      await fetch(`${API_BASE}/api/collab/dev-propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "ระบบ Trading Platform ที่ใช้อยู่" }),
      });
      showNotif("💡 Dev กำลังคิดไอเดีย...", "#A855F7");
      setTimeout(fetchCollabStatus, 5000);
    } catch {}
    setCollabLoading(false);
  };

  useEffect(() => {
    if (tab === "secretary") {
      fetchCollabStatus();
      const iv = setInterval(fetchCollabStatus, 10000);
      return () => clearInterval(iv);
    }
  }, [tab]);

  useEffect(() => { storage.set("todos", todos); }, [todos]);
  useEffect(() => { secEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [secMessages]);
  useEffect(() => { if (tab === "dev") fetchApiLogs(); }, [tab]);

  const sendSecretary = async () => {
    if (!secInput.trim() || secLoading) return;
    const userMsg = secInput.trim();
    setSecInput("");
    setSecMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSecLoading(true);

    try {
      // Build rich context
      const portfolioCtx = portfolioData.map(p =>
        `${p.symbol}: ${p.shares}หุ้น ซื้อ$${p.buyPrice} ตอนนี้$${p.curPrice?.toFixed(2)} (${p.pnl>=0?"+":""}${p.pnlPct?.toFixed(2)}%)`
      ).join(", ");

      const todosCtx = todos.length > 0
        ? `Todo ที่มี: ${todos.filter(t=>!t.done).map(t=>t.text).join(", ")}`
        : "ไม่มี Todo";

      const res = await fetch(`${API_BASE}/api/secretary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: { portfolio: portfolioCtx, todos: todosCtx },
          history: secMessages.slice(-8),
        }),
      });
      const d = await res.json();

      // Handle special actions from secretary
      if (d.action === "ADD_TODO" && d.todo) {
        setTodos(prev => [...prev, { id: Date.now(), text: d.todo, done: false, createdAt: new Date().toISOString() }]);
      }
      if (d.action === "CLEAR_TODOS") {
        setTodos(prev => prev.filter(t => t.done));
      }

      setSecMessages(prev => [...prev, { role: "assistant", content: d.reply }]);
    } catch {
      setSecMessages(prev => [...prev, { role: "assistant", content: "⚠️ Backend ออฟไลน์ครับ" }]);
    }
    setSecLoading(false);
  };

  // AI Agent
  const [agentStatus, setAgentStatus] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentRunning, setAgentRunning] = useState({});

  const fetchAgentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/status`);
      const d = await res.json();
      setAgentStatus(d);
      setAgentLogs(d.logs || []);
    } catch {}
  };

  const toggleAgent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/toggle`, { method: "POST" });
      const d = await res.json();
      setAgentStatus(prev => ({ ...prev, isRunning: d.isRunning }));
      showNotif(d.isRunning ? "🟢 Agent เปิดแล้ว" : "⚫ Agent ปิดแล้ว", d.isRunning ? "#10B981" : "#64748B");
    } catch {}
  };

  const runAgent = async (type) => {
    setAgentRunning(prev => ({ ...prev, [type]: true }));
    try {
      await fetch(`${API_BASE}/api/agent/run/${type}`, { method: "POST" });
      showNotif(`⚡ กำลังรัน ${type}...`, "#A855F7");
      setTimeout(fetchAgentStatus, 5000);
    } catch {}
    setTimeout(() => setAgentRunning(prev => ({ ...prev, [type]: false })), 3000);
  };

  useEffect(() => {
    if (tab === "agent") {
      fetchAgentStatus();
      const iv = setInterval(fetchAgentStatus, 10000);
      return () => clearInterval(iv);
    }
  }, [tab]);
  const [topMovers, setTopMovers] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setDashLoading(true);
    try {
      // ดึงราคาหุ้น watchlist
      const syms = watchlist.length > 0 ? watchlist : ["NVDA","AAPL","TSLA","RKLB","AVGO"];
      const res = await fetch(`${API_BASE}/api/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: STOCKS.map(s => s.symbol) }),
      });
      const data = await res.json();
      const priceMap = {};
      data.forEach(item => { if (item?.price) priceMap[item.symbol] = item; });
      setPrices(prev => ({ ...prev, ...priceMap }));

      // Top movers
      const sorted = data
        .filter(d => d?.changePct)
        .sort((a,b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, 6);
      setTopMovers(sorted);

      // Market sentiment จาก SPY QQQ
      const spy = priceMap["SPY"];
      const qqq = priceMap["QQQ"];
      if (spy && qqq) {
        const avg = (spy.changePct + qqq.changePct) / 2;
        setMarketSentiment({
          label: avg > 0.5 ? "📈 Bull" : avg < -0.5 ? "📉 Bear" : "➡️ Sideways",
          color: avg > 0.5 ? "#10B981" : avg < -0.5 ? "#EF4444" : "#F59E0B",
          pct: avg.toFixed(2),
          spy: spy.changePct?.toFixed(2),
          qqq: qqq.changePct?.toFixed(2),
        });
      }
    } catch(e) { console.error(e); }
    setDashLoading(false);
  }, [watchlist]);

  useEffect(() => {
    if (tab === "dashboard") fetchDashboard();
  }, [tab]);

  // Paper Trading
  const [paperData, setPaperData] = useState(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const fetchPaperPortfolio = async () => {
    setPaperLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/paper/portfolio`);
      setPaperData(await res.json());
    } catch {}
    setPaperLoading(false);
  };

  const runBacktest = async (stock) => {
    setBacktestLoading(true);
    setBacktestResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stock),
      });
      setBacktestResult(await res.json());
    } catch {}
    setBacktestLoading(false);
  };

  const runPortfolioAdvisor = async () => {
    setAdvisorLoading(true);
    setAdvisorResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/portfolio-advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings: portfolio }),
      });
      setAdvisorResult(await res.json());
    } catch {}
    setAdvisorLoading(false);
  };

  const showNotif = (msg, color = "#10B981") => {
    setNotif({ msg, color });
    setTimeout(() => setNotif(null), 3000);
  };

  // Save portfolio to localStorage
  useEffect(() => { storage.set("portfolio", portfolio); }, [portfolio]);
  useEffect(() => { storage.set("watchlist", watchlist); }, [watchlist]);

  // Check backend
  useEffect(() => {
    fetch(`${API_BASE}/`)
      .then(r => r.json())
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // Fetch prices via backend
  const fetchPrices = useCallback(async (syms) => {
    try {
      const res = await fetch(`${API_BASE}/api/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: syms }),
      });
      const data = await res.json();
      const results = {};
      data.forEach(item => { if (item?.price) results[item.symbol] = item; });
      return results;
    } catch { return {}; }
  }, []);

  useEffect(() => {
    const syms = STOCKS.map(s => s.symbol);
    fetchPrices(syms).then(setPrices);
    const iv = setInterval(() => fetchPrices(syms).then(setPrices), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const p = prices[selected.symbol]?.price || 100;
    setSimPrice(p);
    setStrike(Math.round(p * 1.03));
  }, [selected, prices]);

  // Portfolio calculations
  const portfolioData = portfolio.map(pos => {
    const cur = prices[pos.symbol]?.price || pos.buyPrice;
    const curVal = cur * pos.shares;
    const costVal = pos.buyPrice * pos.shares;
    const pnl = curVal - costVal;
    const pnlPct = ((cur - pos.buyPrice) / pos.buyPrice) * 100;
    return { ...pos, curPrice: cur, curVal, costVal, pnl, pnlPct };
  });
  const totalValue = portfolioData.reduce((s, p) => s + p.curVal, 0);
  const totalCostBasis = portfolioData.reduce((s, p) => s + p.costVal, 0);
  const totalPnL = totalValue - totalCostBasis;
  const totalPnLPct = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  const addPortfolio = () => {
    if (!addSymbol || !addShares || !addPrice) { showNotif("❌ ใส่ข้อมูลให้ครบ", "#EF4444"); return; }
    const stock = STOCKS.find(s => s.symbol === addSymbol.toUpperCase());
    const newPos = {
      id: Date.now(),
      symbol: addSymbol.toUpperCase(),
      name: stock?.name || addSymbol.toUpperCase(),
      shares: Number(addShares),
      buyPrice: Number(addPrice),
      sector: stock?.sector || "Other",
    };
    setPortfolio([...portfolio, newPos]);
    setAddSymbol(""); setAddShares(""); setAddPrice(""); setShowAddForm(false);
    showNotif(`✅ เพิ่ม ${newPos.symbol} เข้าพอร์ตแล้ว`);
  };

  // Fetch news
  const fetchNews = async (symbol) => {
    setNewsLoading(true); setNews([]);
    try {
      const res = await fetch(`${API_BASE}/api/news/${symbol}`);
      const data = await res.json();
      setNews(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch { setNews([]); }
    setNewsLoading(false);
  };

  const fetchHighImpactNews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/news/high-impact`);
      const data = await res.json();
      setHighImpactNews(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => { if (backendOnline) fetchHighImpactNews(); }, [backendOnline]);

  // AI analyze
  const handleAnalyze = async (stock = selected) => {
    setAiLoading(true); setTab("ai"); setAiResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: stock.symbol, name: stock.name, sector: stock.sector }),
      });
      setAiResult(await res.json());
    } catch { setAiResult({ error: "⚠️ Backend ออฟไลน์" }); }
    setAiLoading(false);
  };

  // Manual scan
  const handleScan = async () => {
    setScanLoading(true); setScanResults([]);
    try {
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks: STOCKS.slice(0, 10) }),
      });
      const d = await res.json();
      setScanResults(d.results || []);
    } catch {}
    setScanLoading(false);
  };

  // AI Chat
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      // Build context from portfolio and prices
      const portfolioContext = portfolioData.map(p =>
        `${p.symbol}: ซื้อที่ $${p.buyPrice} ตอนนี้ $${p.curPrice?.toFixed(2)} (${p.pnlPct?.toFixed(2)}%)`
      ).join(", ");

      const priceContext = Object.entries(prices).slice(0, 10).map(([sym, p]) =>
        `${sym}: $${p.price?.toFixed(2)} (${p.changePct?.toFixed(2)}%)`
      ).join(", ");

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          portfolioContext,
          priceContext,
          history: chatMessages.slice(-6),
        }),
      });
      const d = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: d.reply || "ขอโทษครับ ไม่สามารถตอบได้" }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "⚠️ Backend ออฟไลน์ครับ" }]);
    }
    setChatLoading(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Alerts
  const loadAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts`);
      setAlerts(await res.json());
    } catch {}
  };
  useEffect(() => { if (backendOnline) loadAlerts(); }, [backendOnline]);

  const addAlert = async () => {
    if (!alertSymbol || !alertPrice) { showNotif("❌ ใส่ข้อมูลให้ครบ", "#EF4444"); return; }
    try {
      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: alertSymbol.toUpperCase(), condition: alertCondition, price: Number(alertPrice) }),
      });
      const d = await res.json();
      if (d.success) { showNotif(`✅ ตั้งแจ้งเตือน ${alertSymbol.toUpperCase()}`); setAlertSymbol(""); setAlertPrice(""); loadAlerts(); }
    } catch {}
  };

  const toggleWL = (sym) => {
    const next = watchlist.includes(sym) ? watchlist.filter(s => s !== sym) : [...watchlist, sym];
    setWatchlist(next);
    showNotif(watchlist.includes(sym) ? `ลบ ${sym} ออก` : `เพิ่ม ${sym} ⭐`, watchlist.includes(sym) ? "#EF4444" : "#F59E0B");
  };

  const curPrice = prices[selected.symbol]?.price || 0;
  const curChange = prices[selected.symbol]?.changePct || 0;
  const premium = Math.max(1, Math.round((optType==="call" ? Math.max(0,curPrice-strike)+curPrice*0.03 : Math.max(0,strike-curPrice)+curPrice*0.03)*0.8*100)/100);
  const totalOptCost = premium * contracts * 100;
  const pnl = (optType==="call" ? Math.max(0,simPrice-strike) : Math.max(0,strike-simPrice)) * contracts * 100 - totalOptCost;
  const filtered = STOCKS.filter(s => (sector==="ทั้งหมด"||s.sector===sector) && (s.symbol.toLowerCase().includes(search.toLowerCase())||s.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#080D1A", color:"#E2E8F0", fontFamily:"'Inter',-apple-system,sans-serif" }}>
      {notif && <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:notif.color, color:"#fff", padding:"10px 20px", borderRadius:12, fontWeight:700, zIndex:9999, fontSize:13, whiteSpace:"nowrap", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>{notif.msg}</div>}

      {/* Header */}
      <div style={{ padding:"12px 14px 8px", background:"#0D1527", borderBottom:"1px solid rgba(0,212,255,0.1)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>🚀</span>
            <div>
              <div style={{ fontSize:15, fontWeight:800 }}>AI <span style={{ color:"#00D4FF" }}>Trade</span></div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:backendOnline?"#10B981":"#EF4444" }} />
                <span style={{ fontSize:9, color:"#475569" }}>{backendOnline?"Online":"Offline"}</span>
                <span style={{ fontSize:9, color:"#475569" }}>•</span>
                <span style={{ fontSize:9, color:totalPnL>=0?"#10B981":"#EF4444", fontWeight:600 }}>พอร์ต {totalPnL>=0?"+":""}{totalPnL.toFixed(0)}$</span>
              </div>
            </div>
          </div>
          <div onClick={()=>setTab("chart")} style={{ background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", borderRadius:10, padding:"5px 10px", cursor:"pointer", textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:800, color:"#00D4FF" }}>{selected.symbol}</div>
            <div style={{ fontSize:11, fontWeight:700, color:curChange>=0?"#10B981":"#EF4444" }}>
              {curPrice>0?`$${curPrice.toFixed(2)}`:"..."} {curChange!==0&&`${curChange>=0?"▲":"▼"}${Math.abs(curChange).toFixed(2)}%`}
            </div>
          </div>
          {installPrompt && (
            <button onClick={()=>installPrompt.prompt()} style={{ padding:"5px 10px", borderRadius:8, background:"rgba(0,212,255,0.15)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              📲 ติดตั้งแอพ
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:"#0D1527", borderBottom:"1px solid rgba(255,255,255,0.05)", position:"sticky", top:60, zIndex:40, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, minWidth:52, padding:"10px 2px", background:"transparent", border:"none", borderBottom:tab===t.id?"2px solid #00D4FF":"2px solid transparent", color:tab===t.id?"#00D4FF":"#475569", fontSize:9, fontWeight:tab===t.id?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>


      {/* ====== DASHBOARD ====== */}
      {tab==="dashboard" && (
        <div style={{ padding:"12px 12px 80px" }}>

          {/* Market Sentiment */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>📡 ภาพรวมตลาดวันนี้</div>
            {marketSentiment ? (
              <div style={{ background:`linear-gradient(135deg,${marketSentiment.color}15,${marketSentiment.color}08)`, border:`1px solid ${marketSentiment.color}33`, borderRadius:14, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:marketSentiment.color }}>{marketSentiment.label}</div>
                  <div style={{ fontSize:12, color:"#64748B", marginTop:4 }}>
                    SPY {marketSentiment.spy >= 0 ? "▲" : "▼"}{Math.abs(marketSentiment.spy)}% &nbsp;•&nbsp; QQQ {marketSentiment.qqq >= 0 ? "▲" : "▼"}{Math.abs(marketSentiment.qqq)}%
                  </div>
                </div>
                <div style={{ fontSize:32, fontWeight:800, color:marketSentiment.color }}>
                  {marketSentiment.pct >= 0 ? "+" : ""}{marketSentiment.pct}%
                </div>
              </div>
            ) : (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 16px", textAlign:"center", color:"#475569", fontSize:13 }}>
                {dashLoading ? "⏳ กำลังโหลด..." : <button onClick={fetchDashboard} style={{ padding:"8px 20px", borderRadius:8, background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:12, fontWeight:700, cursor:"pointer" }}>🔄 โหลดข้อมูล</button>}
              </div>
            )}
          </div>

          {/* Portfolio Summary */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>💼 พอร์ตของฉัน</div>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, color:"#64748B" }}>มูลค่ารวม</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>${totalValue.toFixed(2)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#64748B" }}>กำไร/ขาดทุน</div>
                  <div style={{ fontSize:18, fontWeight:800, color:totalPnL>=0?"#10B981":"#EF4444" }}>
                    {totalPnL>=0?"+":""}{totalPnL.toFixed(2)}$
                  </div>
                  <div style={{ fontSize:12, color:totalPnLPct>=0?"#10B981":"#EF4444", fontWeight:600 }}>
                    {totalPnLPct>=0?"+":""}{totalPnLPct.toFixed(2)}%
                  </div>
                </div>
              </div>
              {/* Holdings mini list */}
              {portfolioData.slice(0,3).map(pos=>(
                <div key={pos.symbol} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#00D4FF" }}>{pos.symbol}</span>
                    <span style={{ fontSize:11, color:"#475569" }}>{pos.shares} หุ้น</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>${pos.curVal.toFixed(2)}</div>
                    <div style={{ fontSize:11, color:pos.pnl>=0?"#10B981":"#EF4444", fontWeight:600 }}>{pos.pnl>=0?"+":""}{pos.pnlPct.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
              <button onClick={()=>setTab("portfolio")} style={{ width:"100%", marginTop:10, padding:"8px", borderRadius:9, background:"rgba(0,212,255,0.06)", border:"1px solid rgba(0,212,255,0.15)", color:"#00D4FF", fontSize:12, fontWeight:600, cursor:"pointer" }}>ดูพอร์ตทั้งหมด →</button>
            </div>
          </div>

          {/* Top Movers */}
          {topMovers.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>⚡ Top Movers วันนี้</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {topMovers.map(m=>{
                  const stock = STOCKS.find(s=>s.symbol===m.symbol);
                  return (
                    <div key={m.symbol} onClick={()=>{const s=STOCKS.find(x=>x.symbol===m.symbol);if(s){setSelected(s);setTab("chart");}}}
                      style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${m.changePct>=0?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`, borderRadius:11, padding:"10px 12px", cursor:"pointer" }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#E2E8F0" }}>{m.symbol}</div>
                      <div style={{ fontSize:11, color:"#475569", marginBottom:4 }}>{stock?.name}</div>
                      <div style={{ fontSize:16, fontWeight:800 }}>${m.price?.toFixed(2)}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:m.changePct>=0?"#10B981":"#EF4444" }}>
                        {m.changePct>=0?"▲":"▼"}{Math.abs(m.changePct).toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Watchlist Quick View */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>⭐ Watchlist</div>
            {watchlist.slice(0,5).map(sym=>{
              const p = prices[sym];
              const stock = STOCKS.find(s=>s.symbol===sym);
              return (
                <div key={sym} onClick={()=>{if(stock){setSelected(stock);setTab("chart");}}}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", marginBottom:6, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, cursor:"pointer" }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight:800, color:"#00D4FF" }}>{sym}</span>
                    <span style={{ marginLeft:6, fontSize:11, color:"#475569" }}>{stock?.name}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{p?`$${p.price?.toFixed(2)}`:"—"}</div>
                    {p && <div style={{ fontSize:11, fontWeight:600, color:p.changePct>=0?"#10B981":"#EF4444" }}>{p.changePct>=0?"▲":"▼"}{Math.abs(p.changePct).toFixed(2)}%</div>}
                  </div>
                </div>
              );
            })}
            <button onClick={()=>setTab("market")} style={{ width:"100%", padding:"8px", borderRadius:9, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"#64748B", fontSize:12, fontWeight:600, cursor:"pointer" }}>ดูหุ้นทั้งหมด →</button>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>⚡ Quick Actions</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"🔍 สแกน AI", sub:"หาสัญญาณตอนนี้", action:()=>{setTab("ai");handleScan();}, color:"#00D4FF" },
                { label:"💬 ถาม AI", sub:"ปรึกษาการลงทุน", action:()=>setTab("chat"), color:"#A855F7" },
                { label:"📰 ข่าวด่วน", sub:"High Impact วันนี้", action:()=>setTab("news"), color:"#F59E0B" },
                { label:"🤖 AI Agent", sub:"ดู Agent ทำงาน Live", action:()=>setTab("agent"), color:"#A855F7" },
                { label:"📈 Paper Trade", sub:"ดูผล AI เทรด", action:()=>{setTab("paper");fetchPaperPortfolio();}, color:"#10B981" },
              ].map(btn=>(
                <button key={btn.label} onClick={btn.action} style={{ padding:"12px", borderRadius:11, background:`${btn.color}0D`, border:`1px solid ${btn.color}33`, cursor:"pointer", textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:btn.color }}>{btn.label}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{btn.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Refresh button */}
          <button onClick={fetchDashboard} disabled={dashLoading} style={{ width:"100%", padding:11, borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748B", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {dashLoading?"⏳ กำลังโหลด...":"🔄 รีเฟรชข้อมูล"}
          </button>
        </div>
      )}


      {/* ====== AI AGENT ====== */}
      {tab==="agent" && (
        <div style={{ padding:"12px 12px 80px" }}>

          {/* Agent Status Card */}
          <div style={{ background: agentStatus?.isRunning ? "rgba(16,185,129,0.07)" : "rgba(100,116,139,0.07)", border:`1px solid ${agentStatus?.isRunning ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.2)"}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:agentStatus?.isRunning ? "#10B981" : "#64748B", boxShadow:agentStatus?.isRunning ? "0 0 8px #10B981" : "none" }} />
                  <span style={{ fontSize:15, fontWeight:800, color:agentStatus?.isRunning ? "#10B981" : "#64748B" }}>
                    {agentStatus?.isRunning ? "AI Agent ทำงานอยู่" : "AI Agent หยุดอยู่"}
                  </span>
                </div>
                <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>
                  Actions ทั้งหมด: {agentStatus?.totalActions || 0} | Cycle: #{agentStatus?.cycle || 0}
                </div>
              </div>
              <button onClick={toggleAgent} style={{ padding:"9px 16px", borderRadius:10, background:agentStatus?.isRunning ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", border:agentStatus?.isRunning ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)", color:agentStatus?.isRunning ? "#EF4444" : "#10B981", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {agentStatus?.isRunning ? "หยุด" : "เปิด"}
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
              {[
                ["🔔", "Signals", agentStatus?.stats?.signals || 0, "#A855F7"],
                ["📰", "News", agentStatus?.stats?.newsAlerts || 0, "#F59E0B"],
                ["📈", "Trades", agentStatus?.stats?.paperTrades || 0, "#10B981"],
                ["💰", "Alerts", agentStatus?.stats?.priceAlerts || 0, "#00D4FF"],
              ].map(([emoji, label, val, color]) => (
                <div key={label} style={{ background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                  <div style={{ fontSize:14 }}>{emoji}</div>
                  <div style={{ fontSize:16, fontWeight:800, color }}>{val}</div>
                  <div style={{ fontSize:9, color:"#475569" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Agents */}
          <div style={{ fontSize:11, color:"#475569", fontWeight:600, marginBottom:10, letterSpacing:0.5 }}>⚡ รัน Agent ด้วยตัวเอง</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            {[
              { id:"signal", emoji:"🔍", name:"Signal Hunter", desc:"สแกนสัญญาณทุกหุ้น", color:"#A855F7" },
              { id:"news", emoji:"📰", name:"News Watcher", desc:"ตรวจข่าวสำคัญ", color:"#F59E0B" },
              { id:"trader", emoji:"📈", name:"Smart Trader", desc:"ซื้อขาย Paper Trade", color:"#10B981" },
              { id:"all", emoji:"🚀", name:"รันทั้งหมด", desc:"Signal+News+Trade", color:"#00D4FF" },
            ].map(agent => (
              <button key={agent.id} onClick={() => runAgent(agent.id)} disabled={agentRunning[agent.id]}
                style={{ padding:"12px", background:`${agent.color}0D`, border:`1px solid ${agent.color}33`, borderRadius:12, cursor:agentRunning[agent.id]?"not-allowed":"pointer", textAlign:"left", opacity:agentRunning[agent.id]?0.6:1 }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{agentRunning[agent.id] ? "⏳" : agent.emoji}</div>
                <div style={{ fontSize:13, fontWeight:700, color:agent.color }}>{agent.name}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{agentRunning[agent.id] ? "กำลังทำงาน..." : agent.desc}</div>
              </button>
            ))}
          </div>

          {/* Agent Schedule */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>⏰ ตารางทำงานอัตโนมัติ</div>
            {[
              ["🔍 Signal Hunter", "ทุก 1 ชั่วโมง", "สแกนทุกหุ้น หาสัญญาณ STRONG BUY/SELL", "#A855F7"],
              ["📰 News Watcher", "ทุก 30 นาที", "ตรวจข่าว High Impact + ข่าวหุ้นที่ถือ", "#F59E0B"],
              ["📈 Smart Trader", "ทุก 2 ชั่วโมง", "ซื้อ/ขาย Paper Trade อัตโนมัติ", "#10B981"],
              ["💰 Price Watcher", "ทุก 1 นาที", "เช็ค Alert ราคาที่ตั้งไว้", "#00D4FF"],
            ].map(([name, schedule, desc, color]) => (
              <div key={name} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:color, marginTop:4, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                    <span style={{ fontSize:12, fontWeight:700, color }}>{name}</span>
                    <span style={{ fontSize:10, color:"#475569", background:"rgba(255,255,255,0.05)", padding:"1px 6px", borderRadius:4 }}>{schedule}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748B" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Logs */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700 }}>📋 Agent Logs (Live)</div>
            <button onClick={fetchAgentStatus} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:11, cursor:"pointer" }}>🔄 รีเฟรช</button>
          </div>

          {agentLogs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:"#475569" }}>
              <div style={{ fontSize:28 }}>📋</div>
              <div style={{ fontSize:12, marginTop:8 }}>ยังไม่มี Log — Agent จะเริ่มทำงานเร็วๆ นี้</div>
            </div>
          ) : agentLogs.map(log => {
            const typeConfig = {
              SIGNAL: { color:"#A855F7", emoji:"📊" },
              NEWS:   { color:"#F59E0B", emoji:"📰" },
              TRADE:  { color:"#10B981", emoji:"📈" },
              ALERT:  { color:"#00D4FF", emoji:"🔔" },
              INFO:   { color:"#64748B", emoji:"ℹ️" },
              ERROR:  { color:"#EF4444", emoji:"❌" },
            }[log.type] || { color:"#64748B", emoji:"•" };

            return (
              <div key={log.id} style={{ display:"flex", gap:8, padding:"8px 10px", marginBottom:5, background:"rgba(255,255,255,0.02)", border:`1px solid ${typeConfig.color}22`, borderLeft:`3px solid ${typeConfig.color}`, borderRadius:"0 8px 8px 0" }}>
                <span style={{ fontSize:14, flexShrink:0 }}>{typeConfig.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:typeConfig.color, background:`${typeConfig.color}15`, padding:"1px 5px", borderRadius:4 }}>{log.type}</span>
                    {log.symbol !== "SYSTEM" && <span style={{ fontSize:11, fontWeight:700, color:"#00D4FF" }}>{log.symbol}</span>}
                    <span style={{ fontSize:9, color:"#475569", marginLeft:"auto" }}>{log.timeTH}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#94A3B8", lineHeight:1.5, wordBreak:"break-word" }}>{log.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* ====== DEV MODE ====== */}
      {tab==="dev" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 115px)" }}>
          {/* Dev Sub Tabs */}
          <div style={{ display:"flex", gap:0, background:"#0D1527", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            {[["code","💻 Code"],["api","📡 API Logs"],["config","⚙️ Config"],["system","🖥️ System"]].map(([id,label])=>(
              <button key={id} onClick={()=>setDevTab(id)} style={{ flex:1, padding:"10px 4px", background:"transparent", border:"none", borderBottom:devTab===id?"2px solid #00D4FF":"2px solid transparent", color:devTab===id?"#00D4FF":"#475569", fontSize:11, fontWeight:devTab===id?700:400, cursor:"pointer" }}>{label}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>

            {/* CODE TAB */}
            {devTab==="code" && (
              <div>
                <div style={{ fontSize:12, color:"#475569", marginBottom:8, fontWeight:600 }}>💻 Code Runner — แก้ไขระบบได้เลย</div>
                <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                  {[
                    ["ดูราคา NVDA", `fetch("${API_BASE}/api/price/NVDA").then(r=>r.json()).then(d=>JSON.stringify(d,null,2))`],
                    ["ดู Agent Status", `fetch("${API_BASE}/api/agent/status").then(r=>r.json()).then(d=>JSON.stringify(d,null,2))`],
                    ["ดู Paper Portfolio", `fetch("${API_BASE}/api/paper/portfolio").then(r=>r.json()).then(d=>JSON.stringify(d,null,2))`],
                    ["Test Telegram", `fetch("${API_BASE}/api/test-telegram").then(r=>r.json()).then(d=>JSON.stringify(d))`],
                    ["Reset Paper", `fetch("${API_BASE}/api/paper/reset",{method:"POST"}).then(r=>r.json()).then(d=>JSON.stringify(d))`],
                  ].map(([label, code])=>(
                    <button key={label} onClick={()=>setDevCode(code)} style={{ padding:"5px 9px", borderRadius:7, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>{label}</button>
                  ))}
                </div>
                <textarea
                  value={devCode}
                  onChange={e=>setDevCode(e.target.value)}
                  placeholder="// พิมพ์ JavaScript ได้เลย
// ตัวอย่าง:
fetch(`${API_BASE}/api/price/AAPL`)
  .then(r=>r.json())
  .then(d=>JSON.stringify(d,null,2))"
                  style={{ width:"100%", height:140, padding:"10px 12px", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(0,212,255,0.2)", borderRadius:10, color:"#00D4FF", fontSize:12, fontFamily:"monospace", outline:"none", resize:"vertical", lineHeight:1.6 }}
                />
                <button onClick={runDevCode} disabled={devLoading||!devCode.trim()} style={{ width:"100%", padding:11, marginTop:8, borderRadius:10, background:devLoading?"rgba(100,116,139,0.2)":"linear-gradient(135deg,#0f2744,#0a1a30)", border:"1px solid rgba(0,212,255,0.3)", color:devLoading?"#64748B":"#00D4FF", fontSize:13, fontWeight:700, cursor:devLoading?"not-allowed":"pointer" }}>
                  {devLoading?"⏳ กำลังรัน...":"▶️ Run Code"}
                </button>
                {devResult && (
                  <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10 }}>
                    <div style={{ fontSize:10, color:"#475569", marginBottom:6 }}>📤 Result:</div>
                    <pre style={{ fontSize:11, color:"#10B981", fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0, lineHeight:1.6 }}>{devResult}</pre>
                  </div>
                )}
              </div>
            )}

            {/* API LOGS TAB */}
            {devTab==="api" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:12, color:"#475569", fontWeight:600 }}>📡 API & Agent Logs</div>
                  <button onClick={fetchApiLogs} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:11, cursor:"pointer" }}>🔄 Refresh</button>
                </div>
                {apiLogs.map((log,i)=>{
                  const colors = { SIGNAL:"#A855F7", NEWS:"#F59E0B", TRADE:"#10B981", ALERT:"#00D4FF", INFO:"#475569", ERROR:"#EF4444" };
                  const c = colors[log.type] || "#475569";
                  return (
                    <div key={i} style={{ display:"flex", gap:8, padding:"6px 8px", marginBottom:4, background:"rgba(255,255,255,0.02)", borderLeft:`2px solid ${c}`, borderRadius:"0 6px 6px 0" }}>
                      <span style={{ fontSize:9, color:c, fontWeight:700, minWidth:42 }}>{log.type}</span>
                      <span style={{ fontSize:10, color:"#00D4FF", fontWeight:700, minWidth:40 }}>{log.symbol}</span>
                      <span style={{ fontSize:10, color:"#94A3B8", flex:1, wordBreak:"break-all" }}>{log.message}</span>
                      <span style={{ fontSize:9, color:"#334155", flexShrink:0 }}>{log.timeTH}</span>
                    </div>
                  );
                })}
                {apiLogs.length===0 && <div style={{ textAlign:"center", padding:"30px 0", color:"#475569", fontSize:12 }}>ยังไม่มี logs</div>}
              </div>
            )}

            {/* CONFIG TAB */}
            {devTab==="config" && (
              <div>
                <div style={{ fontSize:12, color:"#475569", marginBottom:12, fontWeight:600 }}>⚙️ System Config</div>
                {[
                  ["🌐 Backend URL", API_BASE, "#00D4FF"],
                  ["📊 หุ้นที่ติดตาม", `${STOCKS.length} ตัว`, "#10B981"],
                  ["💼 พอร์ตจริง", `${portfolio.length} ตัว มูลค่า $${totalValue.toFixed(2)}`, "#A855F7"],
                  ["⭐ Watchlist", `${watchlist.length} ตัว: ${watchlist.join(", ")}`, "#F59E0B"],
                  ["🎯 Options Balance", `$${optBal.toFixed(2)}`, "#10B981"],
                  ["💾 Local Storage", "Portfolio + Watchlist + Todos", "#64748B"],
                ].map(([label, value, color])=>(
                  <div key={label} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, marginBottom:8 }}>
                    <div style={{ fontSize:11, color:"#64748B", marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12, fontWeight:600, color, wordBreak:"break-all" }}>{value}</div>
                  </div>
                ))}

                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:12, color:"#475569", marginBottom:8, fontWeight:600 }}>🛠️ Quick Actions</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                      ["🔄 รัน Signal Scan", ()=>runAgent("signal")],
                      ["📰 รัน News Check", ()=>runAgent("news")],
                      ["📈 รัน Smart Trade", ()=>runAgent("trader")],
                      ["🤖 Toggle Agent", toggleAgent],
                      ["🗑️ Clear Watchlist", ()=>{ setWatchlist([]); showNotif("ล้าง Watchlist แล้ว","#EF4444"); }],
                      ["💾 Export Portfolio", ()=>{
                        const data = JSON.stringify(portfolio, null, 2);
                        navigator.clipboard?.writeText(data);
                        showNotif("Copy Portfolio JSON แล้ว!","#10B981");
                      }],
                    ].map(([label, fn])=>(
                      <button key={label} onClick={fn} style={{ padding:"10px 8px", borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#94A3B8", fontSize:11, fontWeight:600, cursor:"pointer", textAlign:"left" }}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM TAB */}
            {devTab==="system" && (
              <div>
                <div style={{ fontSize:12, color:"#475569", marginBottom:12, fontWeight:600 }}>🖥️ System Monitor</div>
                {agentStatus && (
                  <>
                    <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12, padding:14, marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#10B981", marginBottom:8 }}>🤖 Agent System</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {[
                          ["Status", agentStatus.isRunning?"🟢 Running":"⚫ Stopped"],
                          ["Cycle", `#${agentStatus.cycle}`],
                          ["Total Actions", agentStatus.totalActions],
                          ["Active Alerts", agentStatus.activeAlerts],
                          ["Signals Sent", agentStatus.stats?.signals],
                          ["Paper Trades", agentStatus.stats?.paperTrades],
                          ["News Alerts", agentStatus.stats?.newsAlerts],
                          ["Price Alerts", agentStatus.stats?.priceAlerts],
                        ].map(([l,v])=>(
                          <div key={l} style={{ background:"rgba(0,0,0,0.2)", borderRadius:7, padding:"6px 8px" }}>
                            <div style={{ fontSize:9, color:"#475569" }}>{l}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:"#475569", marginBottom:6 }}>Last Run: {agentStatus.lastRun ? new Date(agentStatus.lastRun).toLocaleString("th-TH") : "ยังไม่ได้รัน"}</div>
                  </>
                )}
                <button onClick={()=>{ fetchAgentStatus(); fetchApiLogs(); showNotif("🔄 Refresh แล้ว"); }} style={{ width:"100%", padding:11, borderRadius:10, background:"rgba(0,212,255,0.06)", border:"1px solid rgba(0,212,255,0.15)", color:"#00D4FF", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  🔄 Refresh System Status
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== เลขา AI ====== */}
      {tab==="secretary" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 115px)" }}>
          {/* Header */}
          <div style={{ padding:"10px 14px", background:"#0D1527", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800 }}>🗂️ <span style={{ color:"#A855F7" }}>เลขา AI</span></div>
              <div style={{ fontSize:10, color:"#475569" }}>ช่วยงานทั่วไป • จด Todo • วางแผน • ค้นหา</div>
            </div>
            <button onClick={()=>setShowTodos(!showTodos)} style={{ padding:"6px 10px", borderRadius:8, background:showTodos?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.04)", border:showTodos?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.07)", color:showTodos?"#A855F7":"#64748B", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              📋 Todo ({todos.filter(t=>!t.done).length})
            </button>
          </div>

          {/* Todo Panel */}
          {showTodos && (
            <div style={{ padding:"10px 14px", background:"rgba(168,85,247,0.05)", borderBottom:"1px solid rgba(168,85,247,0.15)", maxHeight:200, overflowY:"auto" }}>
              <div style={{ fontSize:11, color:"#A855F7", fontWeight:700, marginBottom:8 }}>📋 Todo List</div>
              {todos.length===0 ? (
                <div style={{ fontSize:12, color:"#475569" }}>ยังไม่มี Todo — บอกเลขาให้จดได้เลยครับ</div>
              ) : todos.map(todo=>(
                <div key={todo.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <button onClick={()=>setTodos(todos.map(t=>t.id===todo.id?{...t,done:!t.done}:t))} style={{ width:18, height:18, borderRadius:4, background:todo.done?"rgba(16,185,129,0.3)":"rgba(255,255,255,0.06)", border:todo.done?"1px solid #10B981":"1px solid rgba(255,255,255,0.1)", cursor:"pointer", fontSize:10, color:"#10B981" }}>
                    {todo.done?"✓":""}
                  </button>
                  <span style={{ fontSize:12, color:todo.done?"#475569":"#E2E8F0", textDecoration:todo.done?"line-through":"none", flex:1 }}>{todo.text}</span>
                  <button onClick={()=>setTodos(todos.filter(t=>t.id!==todo.id))} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:14 }}>×</button>
                </div>
              ))}
              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <button onClick={()=>setTodos(prev=>[...prev,{id:Date.now(),text:secInput||"Task ใหม่",done:false,createdAt:new Date().toISOString()}])} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.25)", color:"#A855F7", fontSize:11, cursor:"pointer" }}>+ เพิ่ม</button>
                <button onClick={()=>setTodos(todos.filter(t=>!t.done))} style={{ padding:"5px 10px", borderRadius:7, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444", fontSize:11, cursor:"pointer" }}>ล้างที่ทำแล้ว</button>
              </div>
            </div>
          )}

          {/* Quick Commands */}
          <div style={{ padding:"8px 12px", display:"flex", gap:6, overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            {["📋 ดู Todo ทั้งหมด","📊 สรุปพอร์ตวันนี้","💡 แนะนำหุ้นน่าซื้อ","⏰ เตือนฉัน...","📝 ร่างแผนการลงทุน","🔍 วิเคราะห์ตลาด"].map(q=>(
              <button key={q} onClick={()=>setSecInput(q)} style={{ padding:"6px 10px", borderRadius:8, whiteSpace:"nowrap", background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.15)", color:"#A855F7", fontSize:11, cursor:"pointer" }}>{q}</button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
            {secMessages.map((msg,i)=>(
              <div key={i} style={{ marginBottom:12, display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
                {msg.role==="assistant" && (
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(168,85,247,0.2)", border:"1px solid rgba(168,85,247,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, marginRight:8, flexShrink:0 }}>🗂️</div>
                )}
                <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", background:msg.role==="user"?"rgba(168,85,247,0.15)":"rgba(255,255,255,0.05)", border:msg.role==="user"?"1px solid rgba(168,85,247,0.3)":"1px solid rgba(255,255,255,0.08)", fontSize:13, color:"#E2E8F0", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {secLoading && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(168,85,247,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🗂️</div>
                <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#A855F7", animation:`pulse ${0.6+i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={secEndRef} />
          </div>

          {/* Pending Approvals */}
          {collabStatus?.pendingApprovals?.length > 0 && (
            <div style={{ padding:"8px 12px", background:"rgba(245,158,11,0.06)", borderTop:"1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize:11, color:"#F59E0B", fontWeight:700, marginBottom:6 }}>
                ⏳ รออนุมัติ ({collabStatus.pendingApprovals.length})
              </div>
              {collabStatus.pendingApprovals.slice(0,3).map(task=>(
                <div key={task.id} style={{ background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"10px 12px", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:11, padding:"1px 6px", borderRadius:4, background:task.proposedBy==="dev"?"rgba(0,212,255,0.15)":"rgba(168,85,247,0.15)", color:task.proposedBy==="dev"?"#00D4FF":"#A855F7", fontWeight:700 }}>
                      {task.proposedBy==="dev"?"💻 Dev เสนอ":"🗂️ เลขาส่ง"}
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#E2E8F0" }}>{task.title}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:8, lineHeight:1.5 }}>{task.description?.slice(0,100)}{task.description?.length > 100 ? "..." : ""}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>approveTask(task.id, true)} disabled={collabLoading}
                      style={{ flex:1, padding:"7px", borderRadius:8, background:"rgba(16,185,129,0.15)", border:"1px solid rgba(16,185,129,0.3)", color:"#10B981", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      ✅ อนุมัติ
                    </button>
                    <button onClick={()=>approveTask(task.id, false, "ไม่อนุมัติ")} disabled={collabLoading}
                      style={{ flex:1, padding:"7px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#EF4444", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      ❌ ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:"10px 12px", background:"#0D1527", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display:"flex", gap:6, marginBottom:6 }}>
              <button onClick={()=>setSecInput("ช่วยพัฒนา: ")} style={{ padding:"5px 9px", borderRadius:7, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>
                💻 สั่ง Dev
              </button>
              <button onClick={devPropose} disabled={collabLoading} style={{ padding:"5px 9px", borderRadius:7, background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)", color:"#A855F7", fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>
                💡 Dev เสนอไอเดีย
              </button>
              {collabStatus && (
                <span style={{ fontSize:10, color:"#475569", alignSelf:"center", marginLeft:"auto" }}>
                  Queue: {collabStatus.stats?.queued || 0} | Done: {collabStatus.stats?.completed || 0}
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
              <textarea
                value={secInput}
                onChange={e=>setSecInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendSecretary(); }}}
                placeholder="บอกเลขาได้เลย เช่น 'เพิ่มฟีเจอร์ X' หรือ 'ช่วยพัฒนาระบบ Y'"
                rows={2}
                style={{ flex:1, padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#E2E8F0", fontSize:13, outline:"none", resize:"none", lineHeight:1.5 }}
              />
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <button onClick={sendSecretary} disabled={secLoading||!secInput.trim()} style={{ width:42, height:42, borderRadius:10, background:secInput.trim()?"linear-gradient(135deg,#7C3AED,#5B21B6)":"rgba(100,116,139,0.2)", border:"none", color:"#fff", fontSize:16, cursor:secInput.trim()?"pointer":"not-allowed" }}>➤</button>
                <button onClick={()=>sendToCollab(secInput)} disabled={!secInput.trim()} title="ส่งให้ Dev" style={{ width:42, height:42, borderRadius:10, background:secInput.trim()?"rgba(0,212,255,0.15)":"rgba(100,116,139,0.1)", border:secInput.trim()?"1px solid rgba(0,212,255,0.3)":"1px solid transparent", color:"#00D4FF", fontSize:14, cursor:secInput.trim()?"pointer":"not-allowed" }}>💻</button>
              </div>
            </div>
            <div style={{ fontSize:9, color:"#334155", marginTop:4, textAlign:"right" }}>➤ = คุยกับเลขา &nbsp;|&nbsp; 💻 = ส่งให้ Dev ทำ</div>
          </div>
        </div>
      )}

      {/* ====== MARKET ====== */}
      {tab==="market" && (
        <div style={{ padding:"12px 12px 80px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 14px" }}>
            <span style={{ color:"#475569" }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา เช่น NVDA, Tesla..."
              style={{ flex:1, background:"transparent", border:"none", color:"#E2E8F0", fontSize:14, outline:"none" }} />
          </div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:12, paddingBottom:4 }}>
            {SECTORS.map(s=>(
              <button key={s} onClick={()=>setSector(s)} style={{ padding:"5px 12px", borderRadius:20, whiteSpace:"nowrap", background:sector===s?"rgba(0,212,255,0.12)":"rgba(255,255,255,0.04)", border:sector===s?"1px solid #00D4FF":"1px solid rgba(255,255,255,0.06)", color:sector===s?"#00D4FF":"#64748B", fontSize:11, fontWeight:sector===s?700:400, cursor:"pointer" }}>{s}</button>
            ))}
          </div>
          {watchlist.length>0 && sector==="ทั้งหมด" && !search && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#475569", fontWeight:600, letterSpacing:0.5, marginBottom:8 }}>⭐ WATCHLIST</div>
              <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
                {watchlist.map(sym=>{
                  const p=prices[sym];
                  return <div key={sym} onClick={()=>{const s=STOCKS.find(x=>x.symbol===sym);if(s){setSelected(s);setTab("chart");}}} style={{ minWidth:85, background:"rgba(0,212,255,0.06)", border:"1px solid rgba(0,212,255,0.15)", borderRadius:10, padding:"8px 10px", cursor:"pointer" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#00D4FF" }}>{sym}</div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{p?`$${p.price.toFixed(2)}`:"—"}</div>
                    <div style={{ fontSize:10, fontWeight:600, color:(p?.changePct||0)>=0?"#10B981":"#EF4444" }}>{p?`${p.changePct>=0?"▲":"▼"}${Math.abs(p.changePct).toFixed(2)}%`:"—"}</div>
                  </div>;
                })}
              </div>
            </div>
          )}
          <div style={{ fontSize:10, color:"#475569", fontWeight:600, marginBottom:8 }}>{filtered.length} หุ้น</div>
          {filtered.map(stock=>{
            const p=prices[stock.symbol];
            const isSelected=selected.symbol===stock.symbol;
            const inPortfolio=portfolio.some(x=>x.symbol===stock.symbol);
            return (
              <div key={stock.symbol} onClick={()=>{setSelected(stock);setTab("chart");}} style={{ display:"flex", alignItems:"center", padding:"10px 12px", marginBottom:5, background:isSelected?"rgba(0,212,255,0.06)":"rgba(255,255,255,0.02)", border:isSelected?"1px solid rgba(0,212,255,0.2)":"1px solid rgba(255,255,255,0.05)", borderRadius:12, cursor:"pointer" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:14, fontWeight:800, color:isSelected?"#00D4FF":"#E2E8F0" }}>{stock.symbol}</span>
                    <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,0.05)", color:"#64748B" }}>{stock.sector}</span>
                    {inPortfolio && <span style={{ fontSize:9, padding:"1px 5px", borderRadius:4, background:"rgba(0,212,255,0.1)", color:"#00D4FF" }}>💼</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:1 }}>{stock.name}</div>
                </div>
                <div style={{ textAlign:"right", marginRight:8 }}>
                  <div style={{ fontSize:15, fontWeight:700 }}>{p?`$${p.price.toFixed(2)}`:<span style={{ color:"#475569",fontSize:12 }}>loading</span>}</div>
                  {p&&<div style={{ fontSize:11, fontWeight:600, color:p.changePct>=0?"#10B981":"#EF4444" }}>{p.changePct>=0?"▲":"▼"}{Math.abs(p.changePct).toFixed(2)}%</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <button onClick={e=>{e.stopPropagation();toggleWL(stock.symbol);}} style={{ width:28,height:28,borderRadius:7, background:watchlist.includes(stock.symbol)?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.04)", border:watchlist.includes(stock.symbol)?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.06)", color:watchlist.includes(stock.symbol)?"#F59E0B":"#475569", fontSize:12, cursor:"pointer" }}>⭐</button>
                  <button onClick={e=>{e.stopPropagation();setSelected(stock);handleAnalyze(stock);}} style={{ width:28,height:28,borderRadius:7, background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.2)", color:"#A855F7", fontSize:11, cursor:"pointer" }}>🤖</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====== CHART ====== */}
      {tab==="chart" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 115px)" }}>
          <div style={{ padding:"8px 14px", background:"#0D1527", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontSize:16, fontWeight:800, color:"#00D4FF" }}>{selected.symbol}</span>
                <span style={{ fontSize:11, color:"#475569", marginLeft:6 }}>{selected.name}</span>
                <div style={{ display:"flex", gap:8, marginTop:1 }}>
                  <span style={{ fontSize:17, fontWeight:800 }}>{curPrice>0?`$${curPrice.toFixed(2)}`:"—"}</span>
                  <span style={{ fontSize:12, fontWeight:700, alignSelf:"center", color:curChange>=0?"#10B981":"#EF4444" }}>{curChange>=0?"▲":"▼"}{Math.abs(curChange).toFixed(2)}%</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={()=>toggleWL(selected.symbol)} style={{ padding:"6px 9px", borderRadius:8, background:watchlist.includes(selected.symbol)?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.04)", border:watchlist.includes(selected.symbol)?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.06)", color:watchlist.includes(selected.symbol)?"#F59E0B":"#64748B", fontSize:11, cursor:"pointer" }}>⭐</button>
                <button onClick={()=>handleAnalyze()} style={{ padding:"6px 9px", borderRadius:8, background:"rgba(168,85,247,0.12)", border:"1px solid rgba(168,85,247,0.3)", color:"#A855F7", fontSize:11, fontWeight:700, cursor:"pointer" }}>🤖</button>
                <button onClick={()=>{fetchNews(selected.symbol);setTab("news");}} style={{ padding:"6px 9px", borderRadius:8, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:11, cursor:"pointer" }}>📰</button>
              </div>
            </div>
          </div>
          <div style={{ flex:1, minHeight:0 }}><TradingViewChart symbol={selected.symbol} /></div>
          <div style={{ padding:"6px 10px", background:"#0D1527", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", gap:5, overflowX:"auto" }}>
            {STOCKS.map(s=>(
              <button key={s.symbol} onClick={()=>setSelected(s)} style={{ padding:"5px 9px", borderRadius:7, whiteSpace:"nowrap", background:selected.symbol===s.symbol?"rgba(0,212,255,0.12)":"rgba(255,255,255,0.04)", border:selected.symbol===s.symbol?"1px solid #00D4FF":"1px solid rgba(255,255,255,0.06)", color:selected.symbol===s.symbol?"#00D4FF":"#64748B", fontSize:10, fontWeight:700, cursor:"pointer" }}>{s.symbol}</button>
            ))}
          </div>
        </div>
      )}

      {/* ====== AI ====== */}
      {tab==="ai" && (
        <div style={{ padding:"12px 12px 80px" }}>
          <button onClick={handleScan} disabled={scanLoading} style={{ width:"100%", padding:12, marginBottom:12, background:scanLoading?"rgba(100,116,139,0.15)":"linear-gradient(135deg,#0f2744,#0a1a30)", border:"1px solid rgba(0,212,255,0.25)", borderRadius:12, color:scanLoading?"#64748B":"#00D4FF", fontSize:13, fontWeight:700, cursor:scanLoading?"not-allowed":"pointer" }}>
            {scanLoading?"⏳ กำลังสแกน 10 หุ้น...":"🔍 สแกนหาสัญญาณ (กดเมื่อต้องการ)"}
          </button>
          {scanResults.length>0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:"#00D4FF", fontWeight:700, marginBottom:8 }}>📊 ผลสแกน {scanResults.length} หุ้น</div>
              {scanResults.map(r=>{
                const cfg=SIGNAL_CONFIG[r.signal]||SIGNAL_CONFIG.HOLD;
                return (
                  <div key={r.symbol} onClick={()=>{const s=STOCKS.find(x=>x.symbol===r.symbol);if(s){setSelected(s);setAiResult(r);}}}
                    style={{ background:cfg.bg, border:`1px solid ${cfg.color}33`, borderRadius:12, padding:"12px 14px", marginBottom:8, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:15, fontWeight:800 }}>{r.symbol}</span>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:cfg.bg, color:cfg.color, fontWeight:700, border:`1px solid ${cfg.color}44` }}>{cfg.emoji} {cfg.label}</span>
                        {r.shouldAlert && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"rgba(245,158,11,0.2)", color:"#F59E0B" }}>🔔</span>}
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{r.confidence}%</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                      {[["เข้า",r.entry,"#10B981"],["Stop",r.stopLoss,"#EF4444"],["เป้า",r.target1,"#00D4FF"]].map(([l,v,c])=>(
                        <div key={l} style={{ background:"rgba(0,0,0,0.2)", borderRadius:7, padding:"5px 8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:"#64748B" }}>{l}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:"#94A3B8", marginTop:5 }}>💡 {r.reason}</div>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={()=>handleAnalyze()} disabled={aiLoading} style={{ width:"100%", padding:12, marginBottom:10, background:aiLoading?"rgba(100,116,139,0.15)":"linear-gradient(135deg,#1a0a3d,#0d0624)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:12, color:aiLoading?"#64748B":"#A855F7", fontSize:13, fontWeight:700, cursor:aiLoading?"not-allowed":"pointer" }}>
            {aiLoading?`⏳ วิเคราะห์ ${selected.symbol}...`:`🔮 วิเคราะห์ ${selected.symbol} พร้อมจุดเข้า/ออก`}
          </button>
          {aiResult && !aiResult.error && (()=>{
            const cfg=SIGNAL_CONFIG[aiResult.signal]||SIGNAL_CONFIG.HOLD;
            return (
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:14, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <span style={{ fontSize:17, fontWeight:800 }}>{aiResult.symbol}</span>
                    <span style={{ marginLeft:8, fontSize:11, padding:"3px 10px", borderRadius:8, background:cfg.bg, color:cfg.color, fontWeight:700 }}>{cfg.emoji} {cfg.label}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:800 }}>${aiResult.price?.toFixed(2)}</div>
                    <div style={{ fontSize:11, color:cfg.color, fontWeight:700 }}>มั่นใจ {aiResult.confidence}%</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  {[["🎯 จุดเข้า",aiResult.entry,"rgba(16,185,129,0.1)","rgba(16,185,129,0.25)","#10B981"],["🛑 Stop Loss",aiResult.stopLoss,"rgba(239,68,68,0.1)","rgba(239,68,68,0.25)","#EF4444"],["✅ เป้า 1",aiResult.target1,"rgba(0,212,255,0.08)","rgba(0,212,255,0.2)","#00D4FF"],["✅ เป้า 2",aiResult.target2,"rgba(0,212,255,0.08)","rgba(0,212,255,0.2)","#00D4FF"]].map(([l,v,bg,bd,c])=>(
                    <div key={l} style={{ background:bg, border:`1px solid ${bd}`, borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, color:"#64748B", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:17, fontWeight:800, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {[["RSI",aiResult.rsi],["เทรนด์",aiResult.trend],["ข่าว",aiResult.newsImpact],aiResult.indicators?["แนวรับ",`$${aiResult.indicators.support}`]:null,aiResult.indicators?["แนวต้าน",`$${aiResult.indicators.resistance}`]:null].filter(Boolean).map(([l,v])=>(
                    <div key={l} style={{ background:"rgba(255,255,255,0.05)", borderRadius:7, padding:"4px 9px" }}>
                      <span style={{ fontSize:10, color:"#64748B" }}>{l}: </span>
                      <span style={{ fontSize:11, fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:12, color:"#CBD5E1", lineHeight:1.7, background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 10px" }}>💡 {aiResult.reason}</div>
                {aiResult.shouldAlert && <div style={{ marginTop:8, padding:"6px 12px", background:"rgba(245,158,11,0.1)", borderRadius:8, border:"1px solid rgba(245,158,11,0.3)", fontSize:11, color:"#F59E0B", textAlign:"center" }}>🔔 ส่งแจ้งเตือน Telegram แล้ว!</div>}
              </div>
            );
          })()}
          {aiResult?.error && <div style={{ padding:14, background:"rgba(239,68,68,0.08)", borderRadius:12, color:"#EF4444", fontSize:13 }}>{aiResult.error}</div>}
          <div style={{ fontSize:10, color:"#475569", fontWeight:600, marginBottom:8 }}>⚡ วิเคราะห์ด่วน</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["RKLB","NVDA","AAPL","TSLA","AVGO","META","PLTR","ASTS"].map(sym=>(
              <button key={sym} onClick={()=>{const s=STOCKS.find(x=>x.symbol===sym);if(s){setSelected(s);handleAnalyze(s);}}} style={{ padding:"7px 11px", borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", color:"#94A3B8", fontSize:11, fontWeight:600, cursor:"pointer" }}>🤖 {sym}</button>
            ))}
          </div>
        </div>
      )}

      {/* ====== PORTFOLIO ====== */}
      {tab==="portfolio" && (
        <div style={{ padding:"12px 12px 80px" }}>
          {/* Summary */}
          <div style={{ background:"linear-gradient(135deg,rgba(0,212,255,0.08),rgba(168,85,247,0.08))", border:"1px solid rgba(0,212,255,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:11, color:"#64748B" }}>มูลค่าพอร์ตรวม</div>
                <div style={{ fontSize:24, fontWeight:800, color:"#E2E8F0" }}>${totalValue.toFixed(2)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#64748B" }}>กำไร/ขาดทุนรวม</div>
                <div style={{ fontSize:20, fontWeight:800, color:totalPnL>=0?"#10B981":"#EF4444" }}>
                  {totalPnL>=0?"+":""}{totalPnL.toFixed(2)}$
                </div>
                <div style={{ fontSize:12, color:totalPnLPct>=0?"#10B981":"#EF4444", fontWeight:600 }}>
                  {totalPnLPct>=0?"+":""}{totalPnLPct.toFixed(2)}%
                </div>
              </div>
            </div>
            {/* Mini bar chart */}
            <div style={{ display:"flex", gap:4, marginTop:4 }}>
              {portfolioData.map(p=>(
                <div key={p.symbol} style={{ flex:p.curVal, background:p.pnl>=0?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)", borderRadius:3, height:6, minWidth:4 }} title={p.symbol} />
              ))}
            </div>
          </div>

          {/* Holdings */}
          <div style={{ fontSize:11, color:"#475569", fontWeight:600, marginBottom:10 }}>💼 Positions ({portfolio.length})</div>
          {portfolioData.map(pos=>(
            <div key={pos.id} onClick={()=>{const s=STOCKS.find(x=>x.symbol===pos.symbol);if(s){setSelected(s);setTab("chart");}}}
              style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${pos.pnl>=0?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`, borderRadius:13, padding:"12px 14px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <span style={{ fontSize:15, fontWeight:800, color:"#E2E8F0" }}>{pos.symbol}</span>
                  <span style={{ marginLeft:6, fontSize:10, color:"#64748B" }}>{pos.shares} หุ้น</span>
                  <div style={{ fontSize:11, color:"#475569", marginTop:1 }}>{pos.name}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:15, fontWeight:800 }}>${pos.curVal.toFixed(2)}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:pos.pnl>=0?"#10B981":"#EF4444" }}>
                    {pos.pnl>=0?"+":""}{pos.pnl.toFixed(2)}$ ({pos.pnlPct>=0?"+":""}{pos.pnlPct.toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {[["ราคาซื้อ",`$${pos.buyPrice}`,"#94A3B8"],["ราคาตอนนี้",`$${pos.curPrice?.toFixed(2)}`,"#E2E8F0"],["ต้นทุน",`$${pos.costVal.toFixed(2)}`,"#94A3B8"]].map(([l,v,c])=>(
                  <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:7, padding:"5px 8px" }}>
                    <div style={{ fontSize:9, color:"#475569" }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                <button onClick={e=>{e.stopPropagation();setPortfolio(portfolio.filter(p=>p.id!==pos.id));showNotif(`ลบ ${pos.symbol} ออกพอร์ต`,"#EF4444");}} style={{ padding:"4px 10px", borderRadius:7, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444", fontSize:11, cursor:"pointer" }}>ลบ</button>
              </div>
            </div>
          ))}

          {/* Add Position */}
          {/* Portfolio Advisor */}
          <button onClick={runPortfolioAdvisor} disabled={advisorLoading||portfolio.length===0} style={{ width:"100%", padding:12, marginBottom:10, background:advisorLoading?"rgba(100,116,139,0.15)":"linear-gradient(135deg,rgba(168,85,247,0.15),rgba(0,212,255,0.1))", border:"1px solid rgba(168,85,247,0.3)", borderRadius:12, color:advisorLoading?"#64748B":"#A855F7", fontSize:13, fontWeight:700, cursor:advisorLoading||portfolio.length===0?"not-allowed":"pointer" }}>
            {advisorLoading?"⏳ AI กำลังวิเคราะห์พอร์ต...":"🧠 AI วิเคราะห์พอร์ตและแนะนำปรับ"}
          </button>

          {advisorResult && (
            <div style={{ background:"rgba(168,85,247,0.05)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:13, padding:14, marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#A855F7" }}>🧠 AI Advisor</div>
                <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:"rgba(168,85,247,0.15)", color:"#A855F7" }}>{advisorResult.overallHealth}</span>
              </div>
              <div style={{ fontSize:12, color:"#CBD5E1", lineHeight:1.7, marginBottom:10 }}>{advisorResult.summary}</div>
              {advisorResult.actions?.map((action, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", background:"rgba(255,255,255,0.04)", borderRadius:8, marginBottom:6 }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:800, color:"#00D4FF" }}>{action.symbol}</span>
                    <span style={{ marginLeft:8, fontSize:11, padding:"2px 6px", borderRadius:4, background:action.action.includes("ขาย")?"rgba(239,68,68,0.12)":action.action.includes("เพิ่ม")?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)", color:action.action.includes("ขาย")?"#EF4444":action.action.includes("เพิ่ม")?"#10B981":"#F59E0B", fontWeight:700 }}>{action.action}</span>
                    <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>{action.reason}</div>
                  </div>
                  <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(255,255,255,0.05)", color:action.priority==="สูง"?"#EF4444":"#64748B" }}>{action.priority}</span>
                </div>
              ))}
              {advisorResult.addRecommendations?.length > 0 && (
                <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(16,185,129,0.06)", borderRadius:8, border:"1px solid rgba(16,185,129,0.15)" }}>
                  <div style={{ fontSize:11, color:"#10B981", fontWeight:700, marginBottom:4 }}>➕ แนะนำให้เพิ่ม</div>
                  <div style={{ fontSize:12, color:"#CBD5E1" }}>{advisorResult.addRecommendations.join(", ")}</div>
                </div>
              )}
              {advisorResult.riskWarnings?.length > 0 && (
                <div style={{ marginTop:8, padding:"8px 10px", background:"rgba(239,68,68,0.06)", borderRadius:8, border:"1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize:11, color:"#EF4444", fontWeight:700, marginBottom:4 }}>⚠️ ความเสี่ยง</div>
                  {advisorResult.riskWarnings.map((w,i)=><div key={i} style={{ fontSize:12, color:"#CBD5E1" }}>• {w}</div>)}
                </div>
              )}
            </div>
          )}

          {!showAddForm ? (
            <button onClick={()=>setShowAddForm(true)} style={{ width:"100%", padding:12, borderRadius:12, background:"rgba(0,212,255,0.06)", border:"1px dashed rgba(0,212,255,0.3)", color:"#00D4FF", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              + เพิ่มหุ้นในพอร์ต
            </button>
          ) : (
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>➕ เพิ่มหุ้น</div>
              {[["หุ้น (เช่น AAPL)",addSymbol,v=>setAddSymbol(v.toUpperCase()),"text"],["จำนวนหุ้น",addShares,setAddShares,"number"],["ราคาที่ซื้อ ($)",addPrice,setAddPrice,"number"]].map(([ph,val,fn,type])=>(
                <input key={ph} type={type} value={val} onChange={e=>fn(e.target.value)} placeholder={ph}
                  style={{ width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#E2E8F0", fontSize:14, outline:"none", marginBottom:8 }} />
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <button onClick={()=>setShowAddForm(false)} style={{ padding:11, borderRadius:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748B", fontSize:13, cursor:"pointer" }}>ยกเลิก</button>
                <button onClick={addPortfolio} style={{ padding:11, borderRadius:9, background:"linear-gradient(135deg,#10B981,#059669)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>เพิ่ม</button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ====== PAPER TRADING ====== */}
      {tab==="paper" && (
        <div style={{ padding:"12px 12px 80px" }}>
          {/* Header */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <button onClick={fetchPaperPortfolio} disabled={paperLoading} style={{ flex:1, padding:11, background:"linear-gradient(135deg,#0f2744,#0a1a30)", border:"1px solid rgba(0,212,255,0.25)", borderRadius:11, color:"#00D4FF", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {paperLoading?"⏳ กำลังโหลด...":"🔄 โหลดสถานะ Paper Trading"}
            </button>
            <button onClick={async()=>{ await fetch(`${API_BASE}/api/paper/reset`,{method:"POST"}); fetchPaperPortfolio(); showNotif("🔄 รีเซ็ตแล้ว"); }} style={{ padding:"11px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:11, color:"#EF4444", fontSize:12, fontWeight:700, cursor:"pointer" }}>รีเซ็ต</button>
          </div>

          {paperData && (
            <>
              {/* Summary */}
              <div style={{ background:"linear-gradient(135deg,rgba(0,212,255,0.08),rgba(168,85,247,0.08))", border:"1px solid rgba(0,212,255,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:11, color:"#64748B" }}>มูลค่าพอร์ต (จำลอง)</div>
                    <div style={{ fontSize:22, fontWeight:800 }}>${Number(paperData.totalValue).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"#64748B" }}>ผลตอบแทน</div>
                    <div style={{ fontSize:20, fontWeight:800, color:Number(paperData.totalReturn)>=0?"#10B981":"#EF4444" }}>
                      {Number(paperData.totalReturn)>=0?"+":""}{paperData.totalReturn}%
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["เงินสด",`$${Number(paperData.cash).toFixed(0)}`,"#E2E8F0"],["หุ้นในมือ",`$${Number(paperData.holdingsValue).toFixed(0)}`,"#00D4FF"],["เทรดทั้งหมด",paperData.trades?.length||0,"#A855F7"]].map(([l,v,c])=>(
                    <div key={l} style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#64748B" }}>{l}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings */}
              {Object.keys(paperData.holdings).length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#475569", fontWeight:600, marginBottom:8 }}>💼 ถือครองอยู่</div>
                  {Object.entries(paperData.holdings).map(([sym, h])=>(
                    <div key={sym} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${h.pnl>=0?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`, borderRadius:11, padding:"10px 12px", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                      <div>
                        <span style={{ fontSize:14, fontWeight:800, color:"#00D4FF" }}>{sym}</span>
                        <span style={{ marginLeft:6, fontSize:11, color:"#64748B" }}>{h.shares} หุ้น</span>
                        <div style={{ fontSize:11, color:"#64748B" }}>ซื้อ ${h.buyPrice?.toFixed(2)} → ตอนนี้ ${h.curPrice?.toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:800, color:h.pnl>=0?"#10B981":"#EF4444" }}>{h.pnl>=0?"+":""}${h.pnl?.toFixed(2)}</div>
                        <div style={{ fontSize:11, color:"#94A3B8" }}>${h.curVal?.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trade History */}
              {paperData.trades?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:"#475569", fontWeight:600, marginBottom:8 }}>📋 ประวัติเทรด (ล่าสุด)</div>
                  {paperData.trades.slice(-10).reverse().map((t,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, marginBottom:5 }}>
                      <div>
                        <span style={{ fontSize:12, fontWeight:700, color:t.type==="BUY"?"#10B981":t.type==="SELL"?"#F87171":"#EF4444" }}>
                          {t.type==="BUY"?"🟢 ซื้อ":t.type==="SELL"?"🔴 ขาย":"🛑 Stop"}
                        </span>
                        <span style={{ marginLeft:6, fontSize:12, fontWeight:700 }}>{t.symbol}</span>
                        <span style={{ marginLeft:6, fontSize:11, color:"#64748B" }}>{t.shares} หุ้น @ ${t.price?.toFixed(2)}</span>
                      </div>
                      {t.pnl && <span style={{ fontSize:12, fontWeight:700, color:Number(t.pnl)>=0?"#10B981":"#EF4444" }}>{Number(t.pnl)>=0?"+":""}${t.pnl}</span>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!paperData && !paperLoading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#475569" }}>
              <div style={{ fontSize:40 }}>📈</div>
              <div style={{ fontSize:14, marginTop:12, fontWeight:600 }}>Paper Trading</div>
              <div style={{ fontSize:12, marginTop:6, color:"#334155" }}>AI เทรดด้วยเงินจำลอง $10,000<br/>ทุก 2 ชั่วโมง</div>
              <button onClick={fetchPaperPortfolio} style={{ marginTop:16, padding:"12px 24px", borderRadius:12, background:"linear-gradient(135deg,#00D4FF22,#7C3AED22)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF", fontSize:13, fontWeight:700, cursor:"pointer" }}>โหลดสถานะ</button>
            </div>
          )}

          {/* Backtest Section */}
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>🧪 Backtest {selected.symbol}</div>
            <button onClick={()=>runBacktest(selected)} disabled={backtestLoading} style={{ width:"100%", padding:11, background:backtestLoading?"rgba(100,116,139,0.15)":"linear-gradient(135deg,#1a0a3d,#0d0624)", border:"1px solid rgba(168,85,247,0.25)", borderRadius:10, color:backtestLoading?"#64748B":"#A855F7", fontSize:13, fontWeight:700, cursor:backtestLoading?"not-allowed":"pointer" }}>
              {backtestLoading?`⏳ กำลัง Backtest...`:`🔬 Backtest ${selected.symbol} ย้อนหลัง 6 เดือน`}
            </button>
            {backtestResult && (
              <div style={{ marginTop:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  {[["Win Rate",`${backtestResult.winRate}%`,"#10B981"],["Total Trades",backtestResult.totalTrades,"#00D4FF"],["Avg Return",`${backtestResult.avgReturn}%`,"#F59E0B"],["Max Drawdown",`-${backtestResult.maxDrawdown}%`,"#EF4444"],["Best Trade",backtestResult.bestTrade,"#10B981"],["Sharpe Ratio",backtestResult.sharpeRatio,"#A855F7"]].map(([l,v,c])=>(
                    <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:10, color:"#64748B" }}>{l}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"10px 12px", background:"rgba(0,212,255,0.04)", borderRadius:9, border:"1px solid rgba(0,212,255,0.1)" }}>
                  <div style={{ fontSize:11, color:"#64748B", marginBottom:4 }}>ความเสี่ยง: <span style={{ color:"#E2E8F0", fontWeight:700 }}>{backtestResult.riskLevel}</span></div>
                  <div style={{ fontSize:12, color:"#CBD5E1", lineHeight:1.6 }}>💡 {backtestResult.recommendation}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== CHAT ====== */}
      {tab==="chat" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 115px)" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ marginBottom:12, display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
                {msg.role==="assistant" && <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(168,85,247,0.2)", border:"1px solid rgba(168,85,247,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0 }}>🤖</div>}
                <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:msg.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", background:msg.role==="user"?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.05)", border:msg.role==="user"?"1px solid rgba(0,212,255,0.3)":"1px solid rgba(255,255,255,0.08)", fontSize:13, color:"#E2E8F0", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(168,85,247,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🤖</div>
                <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#64748B", animation:`pulse ${0.6+i*0.2}s infinite` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding:"8px 12px 0", display:"flex", gap:6, overflowX:"auto" }}>
            {["NVDA น่าซื้อไหม?","ตลาดวันนี้เป็นยังไง?","พอร์ตผมควรปรับไหม?","AVGO $409 คืนทุนเมื่อไหร่?","หุ้น Space ตัวไหนดีสุด?"].map(q=>(
              <button key={q} onClick={()=>{setChatInput(q);}} style={{ padding:"6px 10px", borderRadius:8, whiteSpace:"nowrap", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#94A3B8", fontSize:11, cursor:"pointer" }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:"10px 12px", background:"#0D1527", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8, alignItems:"center" }}>
            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}
              placeholder="ถาม AI ได้เลย เช่น NVDA น่าซื้อไหม?"
              style={{ flex:1, padding:"10px 14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#E2E8F0", fontSize:13, outline:"none" }}
            />
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{ width:40, height:40, borderRadius:10, background:chatInput.trim()?"linear-gradient(135deg,#7C3AED,#5B21B6)":"rgba(100,116,139,0.2)", border:"none", color:"#fff", fontSize:16, cursor:chatInput.trim()?"pointer":"not-allowed", flexShrink:0 }}>➤</button>
          </div>
        </div>
      )}

      {/* ====== NEWS ====== */}
      {tab==="news" && (
        <div style={{ padding:"12px 12px 80px" }}>
          {highImpactNews.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#EF4444", marginBottom:8 }}>🔴 ข่าว High Impact วันนี้</div>
              {highImpactNews.map((item,i)=>(
                <div key={i} style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"10px 14px", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{item.event}</div>
                  <div style={{ display:"flex", gap:12, marginTop:4, fontSize:11, color:"#64748B" }}>
                    <span>🌍 {item.country}</span><span>⏰ {item.time}</span>
                    {item.actual && <span style={{ color:"#10B981" }}>Actual: {item.actual}</span>}
                    {item.estimate && <span>Est: {item.estimate}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>📰 ข่าว {selected.symbol}</div>
            <button onClick={()=>fetchNews(selected.symbol)} style={{ padding:"7px 12px", borderRadius:8, background:"rgba(0,212,255,0.08)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:12, fontWeight:700, cursor:"pointer" }}>🔄 โหลด</button>
          </div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:14, paddingBottom:4 }}>
            {STOCKS.slice(0,10).map(s=>(
              <button key={s.symbol} onClick={()=>{setSelected(s);fetchNews(s.symbol);}} style={{ padding:"6px 10px", borderRadius:8, whiteSpace:"nowrap", background:selected.symbol===s.symbol?"rgba(0,212,255,0.12)":"rgba(255,255,255,0.04)", border:selected.symbol===s.symbol?"1px solid #00D4FF":"1px solid rgba(255,255,255,0.06)", color:selected.symbol===s.symbol?"#00D4FF":"#64748B", fontSize:11, fontWeight:700, cursor:"pointer" }}>{s.symbol}</button>
            ))}
          </div>
          {newsLoading && <div style={{ textAlign:"center", padding:"40px 0", color:"#475569" }}><div style={{ fontSize:24 }}>⏳</div></div>}
          {!newsLoading && news.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#475569" }}>
              <div style={{ fontSize:32 }}>📭</div>
              <div style={{ fontSize:13, marginTop:8 }}>กดโหลดข่าวก่อนเลย</div>
              <button onClick={()=>fetchNews(selected.symbol)} style={{ marginTop:12, padding:"10px 20px", borderRadius:10, background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.2)", color:"#00D4FF", fontSize:13, fontWeight:700, cursor:"pointer" }}>โหลดข่าว {selected.symbol}</button>
            </div>
          )}
          {news.map((item,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:600, lineHeight:1.5, marginBottom:6 }}>{item.headline}</div>
              {item.summary && <div style={{ fontSize:11, color:"#64748B", lineHeight:1.6, marginBottom:6 }}>{item.summary.slice(0,150)}{item.summary.length>150?"...":""}</div>}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, color:"#475569" }}>{item.source} • {new Date(item.datetime*1000).toLocaleDateString("th-TH")}</span>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#00D4FF", textDecoration:"none", padding:"4px 8px", borderRadius:6, background:"rgba(0,212,255,0.08)" }}>อ่านเพิ่ม →</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== ALERTS ====== */}
      {tab==="alerts" && (
        <div style={{ padding:"12px 12px 80px" }}>
          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#10B981", marginBottom:4 }}>🤖 AI Signal Alert</div>
            <div style={{ fontSize:11, color:"#64748B", lineHeight:1.7 }}>ตรวจสอบ {STOCKS.length} หุ้น ทุก 1 ชั่วโมง แจ้ง Telegram เฉพาะ STRONG BUY/SELL</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>➕ ตั้งแจ้งเตือนราคา</div>
            <input value={alertSymbol} onChange={e=>setAlertSymbol(e.target.value.toUpperCase())} placeholder="หุ้น เช่น NVDA, AAPL..."
              style={{ width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#E2E8F0", fontSize:14, outline:"none", marginBottom:8 }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[["above","🚀 ขึ้นถึง"],["below","📉 ลงถึง"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setAlertCondition(v)} style={{ flex:1, padding:"9px 4px", borderRadius:9, background:alertCondition===v?(v==="above"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)"):"rgba(255,255,255,0.04)", border:alertCondition===v?(v==="above"?"1px solid #10B981":"1px solid #EF4444"):"1px solid rgba(255,255,255,0.07)", color:alertCondition===v?(v==="above"?"#10B981":"#EF4444"):"#64748B", fontSize:11, cursor:"pointer", fontWeight:700 }}>{l}</button>
                ))}
              </div>
              <input type="number" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)} placeholder="ราคา ($)"
                style={{ padding:"10px 12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#E2E8F0", fontSize:14, outline:"none" }} />
            </div>
            <button onClick={addAlert} style={{ width:"100%", padding:12, borderRadius:10, background:"linear-gradient(135deg,#10B981,#059669)", border:"none", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>🔔 ตั้งแจ้งเตือน</button>
          </div>
          {alerts.map(alert=>(
            <div key={alert.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontSize:15, fontWeight:800, color:"#00D4FF" }}>{alert.symbol}</span>
                <span style={{ marginLeft:8, fontSize:11, padding:"2px 7px", borderRadius:5, background:alert.condition==="above"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:alert.condition==="above"?"#10B981":"#EF4444", fontWeight:700 }}>
                  {alert.condition==="above"?"🚀 ขึ้นถึง":"📉 ลงถึง"} ${alert.price}
                </span>
              </div>
              <button onClick={async()=>{await fetch(`${API_BASE}/api/alerts/${alert.id}`,{method:"DELETE"});showNotif("ลบแล้ว","#F59E0B");loadAlerts();}} style={{ width:32,height:32,borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444", fontSize:14, cursor:"pointer" }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* ====== OPTIONS ====== */}
      {tab==="options" && (
        <div style={{ padding:"12px 12px 80px" }}>
          <div style={{ background:"rgba(0,212,255,0.06)", border:"1px solid rgba(0,212,255,0.15)", borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between" }}>
            <div><div style={{ fontSize:10, color:"#475569" }}>เงินจำลอง</div><div style={{ fontSize:20, fontWeight:800, color:"#00D4FF" }}>${optBal.toLocaleString("en",{minimumFractionDigits:2})}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:"#475569" }}>Positions</div><div style={{ fontSize:20, fontWeight:800 }}>{positions.length}</div></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {["call","put"].map(t=>(
              <button key={t} onClick={()=>setOptType(t)} style={{ padding:12, background:optType===t?(t==="call"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)"):"rgba(255,255,255,0.03)", border:`1.5px solid ${optType===t?(t==="call"?"#10B981":"#EF4444"):"rgba(255,255,255,0.07)"}`, borderRadius:12, cursor:"pointer", color:optType===t?(t==="call"?"#10B981":"#EF4444"):"#64748B", fontSize:14, fontWeight:700 }}>
                {t==="call"?"📈 CALL":"📉 PUT"}<div style={{ fontSize:10, fontWeight:400, marginTop:2 }}>{t==="call"?"เดาขึ้น":"เดาลง"}</div>
              </button>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#475569", marginBottom:6, fontWeight:600 }}>หุ้น</div>
            <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:4 }}>
              {STOCKS.slice(0,10).map(s=>(
                <button key={s.symbol} onClick={()=>setSelected(s)} style={{ padding:"6px 9px", borderRadius:9, whiteSpace:"nowrap", background:selected.symbol===s.symbol?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.04)", border:selected.symbol===s.symbol?"1px solid #00D4FF":"1px solid rgba(255,255,255,0.06)", color:selected.symbol===s.symbol?"#00D4FF":"#64748B", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  {s.symbol}<br/><span style={{ fontSize:9, fontWeight:400 }}>{prices[s.symbol]?`$${prices[s.symbol].price.toFixed(0)}`:"—"}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>Strike Price</span>
              <span style={{ fontSize:12, color:"#00D4FF", fontWeight:700 }}>${strike}</span>
            </div>
            <input type="range" min={Math.round(curPrice*0.85)} max={Math.round(curPrice*1.2)} value={strike} onChange={e=>setStrike(Number(e.target.value))} style={{ width:"100%", accentColor:"#00D4FF" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:10, color:"#475569", marginBottom:5, fontWeight:600 }}>หมดอายุ</div>
              <div style={{ display:"flex", gap:4 }}>
                {["7","14","30"].map(d=>(
                  <button key={d} onClick={()=>setExpiry(d)} style={{ flex:1, padding:"8px 2px", background:expiry===d?"rgba(0,212,255,0.1)":"rgba(255,255,255,0.04)", border:expiry===d?"1px solid #00D4FF":"1px solid rgba(255,255,255,0.06)", borderRadius:8, color:expiry===d?"#00D4FF":"#64748B", fontSize:11, cursor:"pointer" }}>{d}D</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#475569", marginBottom:5, fontWeight:600 }}>Contracts</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={()=>setContracts(Math.max(1,contracts-1))} style={{ width:32,height:32,borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#fff", fontSize:16, cursor:"pointer" }}>-</button>
                <span style={{ flex:1, textAlign:"center", fontSize:17, fontWeight:800, color:"#00D4FF" }}>{contracts}</span>
                <button onClick={()=>setContracts(contracts+1)} style={{ width:32,height:32,borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", color:"#fff", fontSize:16, cursor:"pointer" }}>+</button>
              </div>
            </div>
          </div>
          <div style={{ background:"rgba(0,212,255,0.03)", border:"1px solid rgba(0,212,255,0.1)", borderRadius:12, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#475569", fontWeight:600, marginBottom:6 }}>🎮 จำลองราคา</div>
            <input type="range" min={Math.round(curPrice*0.7)} max={Math.round(curPrice*1.5)} value={simPrice} onChange={e=>setSimPrice(Number(e.target.value))} style={{ width:"100%", accentColor:"#00D4FF", marginBottom:8 }} />
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"#64748B" }}>ราคา: ${simPrice} | Premium: ${premium}</span>
              <span style={{ fontSize:16, fontWeight:800, color:pnl>=0?"#10B981":"#EF4444" }}>{pnl>=0?"+":""}${pnl.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={()=>{
            if(totalOptCost>optBal){showNotif("❌ เงินไม่พอ!","#EF4444");return;}
            setPositions([...positions,{id:Date.now(),stock:selected.symbol,type:optType,strike,premium,contracts,totalCost:totalOptCost}]);
            setOptBal(b=>Math.round((b-totalOptCost)*100)/100);
            showNotif(`✅ ซื้อ ${optType.toUpperCase()} ${selected.symbol}`);
          }} disabled={totalOptCost>optBal} style={{ width:"100%", padding:13, borderRadius:12, border:"none", background:totalOptCost>optBal?"rgba(100,116,139,0.2)":optType==="call"?"linear-gradient(135deg,#10B981,#059669)":"linear-gradient(135deg,#EF4444,#DC2626)", color:"#fff", fontSize:14, fontWeight:800, marginBottom:12, cursor:totalOptCost>optBal?"not-allowed":"pointer" }}>
            {totalOptCost>optBal?"💸 เงินไม่พอ":`ซื้อ ${optType.toUpperCase()} — $${totalOptCost.toFixed(2)}`}
          </button>
          {positions.map(pos=>{
            const posPnL=(pos.type==="call"?Math.max(0,simPrice-pos.strike):Math.max(0,pos.strike-simPrice))*pos.contracts*100-pos.totalCost;
            return (
              <div key={pos.id} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${posPnL>=0?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}`, borderRadius:12, padding:12, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:800, color:"#00D4FF" }}>{pos.stock}</span>
                  <span style={{ marginLeft:6, fontSize:10, padding:"2px 5px", borderRadius:4, background:pos.type==="call"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:pos.type==="call"?"#10B981":"#EF4444" }}>{pos.type.toUpperCase()}</span>
                  <div style={{ fontSize:11, color:"#64748B", marginTop:2 }}>Strike ${pos.strike} • {pos.contracts}x</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:posPnL>=0?"#10B981":"#EF4444" }}>{posPnL>=0?"+":""}${posPnL.toFixed(2)}</div>
                  <button onClick={()=>{setOptBal(b=>Math.round((b+Math.max(0,pos.totalCost+posPnL))*100)/100);setPositions(positions.filter(p=>p.id!==pos.id));showNotif(posPnL>=0?`🎉 +$${posPnL.toFixed(2)}`:`-$${Math.abs(posPnL).toFixed(2)}`,posPnL>=0?"#10B981":"#EF4444");}} style={{ marginTop:4, padding:"3px 8px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, color:"#EF4444", fontSize:10, cursor:"pointer" }}>ปิด</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; } @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
