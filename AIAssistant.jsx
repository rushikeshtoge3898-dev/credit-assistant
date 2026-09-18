import { useState, useEffect, useRef } from "react";
import api, { aiAPI, recommendationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { guestData } from "../services/guestData";
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  Circle,
  Compass,
  Zap,
  Info,
  Layers,
  AlertCircle
} from "lucide-react";

export default function AIAssistant() {
  const { isGuest } = useAuth();
  const { currentLanguage, t } = useLanguage();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t(
        "ai.welcomeMessage",
        "Hello! I am your **AI Credit & Financial Advisor**, specialized in the Indian banking and CIBIL credit scoring ecosystem.\n\nI have access to your credit profile, debt-to-income ratio, and card utilization. Ask me anything about boosting your score, clearing debt, or loan eligibility!"
      ),
      suggestions: [
        "How can I reach a 750+ CIBIL score?",
        "How does credit utilization affect my approval chances?",
        "Should I close my unused credit card?",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);
  const [dbRecs, setDbRecs] = useState([]);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "diagnostic"
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadInitialData = async () => {
    try {
      if (isGuest) {
        setDbRecs(guestData.getGuestRecommendations());
        const guestProfile = guestData.getGuestProfile();
        setDiagnostic({
          summary: "Simulated guest profile demonstrates active Indian credit tradelines with clean repayment history and moderate card utilization.",
          health_grade: "Good",
          cibil_health_score: guestProfile?.credit_score ?? null,
          key_positive_factors: [
            "100% on-time repayment history across active accounts",
            "Low debt-to-income leverage within safe limits",
            "No recent defaults or charge-offs reported to bureaus"
          ],
          critical_risk_factors: [
            "Monitor revolving card balance to maintain sub-30% utilization"
          ],
          immediate_action_items: [
            "Clear credit card dues before statement billing date",
            "Set auto-debit on total bill amount"
          ],
          long_term_strategy: [
            "Maintain credit accounts for at least 3+ years to establish seasoned history",
            "Diversify credit mix with a secured vehicle or home loan when needed"
          ],
          educational_disclaimer: "Educational credit advisory model based on CIBIL TransUnion scoring methodology."
        });
        return;
      }

      // 1. Load persistent recommendations from DB
      try {
        const recList = await recommendationsAPI.getRecommendations();
        setDbRecs(recList);
      } catch (e) {
        // Continue if empty
      }

      // 2. Load quick analysis / recommendations preview
      try {
        const res = await api.get("/ai/recommendations");
        if (res.data) {
          setDiagnostic({
            summary: res.data.summary,
            health_grade: res.data.cibil_health_status || "Good",
            cibil_health_score: res.data.cibil_health_score ?? null,
            key_positive_factors: res.data.strengths || [
              "Consistently on-time payment track record across tradelines",
              "Balanced debt-to-income leverage within normal limits"
            ],
            critical_risk_factors: res.data.risk_factors || [
              "Monitor revolving card balance to maintain sub-30% utilization"
            ],
            immediate_action_items: res.data.actionable_steps || [
              "Clear credit card dues before statement billing date",
              "Set auto-debit on total bill amount"
            ],
            long_term_strategy: [
              "Maintain credit accounts for at least 3+ years to establish seasoned history",
              "Diversify credit mix with a secured vehicle or home loan when needed"
            ],
            educational_disclaimer: "Educational estimate based on CIBIL TransUnion scoring methodology."
          });
        }
      } catch (e) {
        console.log("Initial recommendation fetch:", e);
      }
    } catch (err) {
      console.error("Failed to load initial advisor data:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [isGuest]);

  const handleRunDiagnostic = async () => {
    setAnalyzing(true);
    setError("");
    try {
      let analysisData;
      if (isGuest) {
        const guestProfile = guestData.getGuestProfile();
        analysisData = {
          summary: "Guest profile shows an active HDFC credit card with 29% utilization and an SBI auto loan. Payment behavior is pristine with zero missed dues.",
          health_grade: "Good",
          cibil_health_score: guestProfile?.credit_score ?? null,
          key_positive_factors: [
            "Clean payment track record with 0 defaults",
            "Utilization kept safely below the 30% threshold",
            "Healthy credit mix of revolving and installment debt"
          ],
          critical_risk_factors: [
            "Avoid opening multiple new loan or card applications simultaneously"
          ],
          immediate_action_items: [
            "Keep credit utilization under 20% for faster score gains",
            "Request annual credit report check for inaccuracies"
          ],
          long_term_strategy: [
            "Maintain oldest credit card to build average credit age past 5 years",
            "Increase credit limit without increasing spending to lower utilization"
          ],
          educational_disclaimer: "Educational estimate based on CIBIL TransUnion scoring methodology."
        };
      } else {
        try {
          analysisData = await aiAPI.analyzeCredit();
        } catch (e) {
          const fb = await api.post("/api/ai/analyze-credit");
          analysisData = fb.data;
        }

        // Refresh DB recommendations
        try {
          const recList = await recommendationsAPI.getRecommendations();
          setDbRecs(recList);
        } catch (e) {}
      }

      setDiagnostic(analysisData);

      // Add AI report announcement in chat
      const summaryMsg = {
        role: "assistant",
        content: `**New AI Credit Diagnostic Complete!**\n\n- **Health Grade**: ${analysisData.health_grade}\n- **Summary**: ${analysisData.summary}\n\nReview your positive factors, risk items, and long-term roadmap on the diagnostic panel. Ask me below if you need step-by-step guidance!`,
        suggestions: analysisData.immediate_action_items?.slice(0, 3) || [
          "How do I clear card balance fastest?",
          "What is the best way to handle loans?"
        ],
      };
      setMessages((prev) => [...prev, summaryMsg]);
    } catch (err) {
      console.error("Diagnostic error:", err);
      setError("AI diagnostic encountered an issue. Backend fallback advice is available in chat.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleRecItem = async (rec) => {
    try {
      const nextVal = !rec.is_completed;
      try {
        await recommendationsAPI.updateRecommendation(rec.id, { is_completed: nextVal });
      } catch (e) {
        await api.put(`/api/recommendations/${rec.id}`, { is_completed: nextVal });
      }
      setDbRecs((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, is_completed: nextVal } : r))
      );
    } catch (err) {
      console.error("Toggle recommendation failed:", err);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let resData;
      try {
        resData = await aiAPI.chat(textToSend, history, currentLanguage);
      } catch (err) {
        const fallbackRes = await api.post("/ai/chat", {
          message: textToSend,
          history: history,
          language: currentLanguage,
        });
        resData = fallbackRes.data;
      }

      const aiMessage = {
        role: "assistant",
        content: resData.response,
        suggestions: resData.suggested_actions || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered a temporary communication glitch with the primary AI engine. Your credit data is safe. Please ask again or click 'Run AI Credit Diagnostic' to refresh.",
          suggestions: ["How to improve my CIBIL score?", "Tips for lower card utilization"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format markdown helper
  const renderFormattedText = (text) => {
    return text.split("\n").map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={line.startsWith("- ") || line.startsWith("* ") ? "ml-4 my-1" : "my-1"}>
          {parts.map((p, pIdx) => {
            if (p.startsWith("**") && p.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {p.slice(2, -2)}
                </strong>
              );
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            {t("ai.title", "AI Credit Advisor")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("ai.subtitle", "Powered by Google Gemini with domain awareness of Indian banking, RBI norms, and CIBIL scoring.")}
          </p>
        </div>

        <button
          onClick={handleRunDiagnostic}
          disabled={analyzing}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
          <span>{analyzing ? t("ai.analyzing", "Analyzing Credit Data...") : t("ai.runDiagnostic", "Run AI Credit Diagnostic")}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible on small screens) */}
      <div className="flex lg:hidden bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-md">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "chat"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t("ai.chatTab", "Interactive Chat")}
        </button>
        <button
          onClick={() => setActiveTab("diagnostic")}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === "diagnostic"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t("ai.diagnosticTab", "Diagnostic Report")}
        </button>
      </div>

      {/* Main Grid: Chat Assistant (A) + Comprehensive AI Diagnostic Panel (B - G) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Assistant (A) */}
        <div className={`lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col h-[650px] sm:h-[700px] shadow-2xl relative overflow-hidden ${activeTab === "diagnostic" ? "hidden lg:flex" : "flex"}`}>
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Interactive Credit Advisor Chat</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Gemini 2.0 / Flash Active
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-xs shadow-lg"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div className="space-y-1">
                      {renderFormattedText(m.content)}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {!isUser && m.suggestions && m.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5 ml-10">
                      {m.suggestions.map((sugg, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sugg)}
                          className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 border border-slate-700/80 transition-all cursor-pointer text-left"
                        >
                          &ldquo;{sugg}&rdquo;
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 font-mono text-[11px]">Gemini is reasoning through your credit profile...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Ask about your CIBIL score, cards, EMI relief, or dispute processes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Diagnostic Report Panel (C - G) */}
        <div className={`lg:col-span-5 space-y-6 ${activeTab === "chat" ? "hidden lg:block" : "block"}`}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Header & Grade */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  CIBIL Diagnostic Report
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time structured evaluation</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {diagnostic?.health_grade || "Good"}
              </span>
            </div>

            {/* C. AI Credit-Health Summary */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Executive Credit Health Summary
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {diagnostic?.summary ||
                  "Your credit profile demonstrates stable fundamentals with positive payment timeliness. Bringing revolving card utilization below 30% remains the primary lever to cross into the prime 750+ tier."}
              </p>
            </div>

            {/* D. Positive Factors */}
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Key Positive Factors
              </div>
              <ul className="space-y-1.5">
                {(diagnostic?.key_positive_factors || diagnostic?.strengths || [
                  "100% on-time repayment history across active accounts",
                  "Low debt-to-income leverage within safe limits",
                  "No recent defaults or charge-offs reported to bureaus"
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* E. Risk Factors */}
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Critical Risk Factors & Cautions
              </div>
              <ul className="space-y-1.5">
                {(diagnostic?.critical_risk_factors || diagnostic?.risk_factors || [
                  "High card utilization creates a temporary drag on CIBIL score",
                  "Multiple inquiries within a short window can trigger minor score drops"
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* F. Immediate Actions (Interactive Checklist) */}
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Immediate Action Items
                </span>
                {dbRecs.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dbRecs.filter((r) => r.is_completed).length}/{dbRecs.length} Done
                  </span>
                )}
              </div>

              {dbRecs.length > 0 ? (
                <div className="space-y-2">
                  {dbRecs.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleToggleRecItem(rec)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                        rec.is_completed
                          ? "bg-slate-950/30 border-slate-800/40 opacity-60 line-through text-slate-500"
                          : "bg-slate-950/80 border-slate-800 text-slate-200 hover:border-indigo-500/40"
                      }`}
                    >
                      {rec.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="text-[11px] leading-tight">
                        <div className="font-semibold text-slate-200">{rec.title}</div>
                        {rec.description && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{rec.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(diagnostic?.immediate_action_items || [
                    "Pay down credit card outstanding balance before billing cycle cut-off",
                    "Request limit enhancement without applying for fresh cards"
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* G. Long-Term Strategy */}
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                <Compass className="w-4 h-4 text-purple-400" />
                Long-Term Credit Strategy
              </div>
              <ul className="space-y-1.5">
                {(diagnostic?.long_term_strategy || [
                  "Maintain oldest active credit cards to establish a 4+ year credit age",
                  "Aim for a balanced credit mix of secured home/auto loans alongside revolving credit",
                  "Check CIBIL score reports semi-annually to dispute unauthorized inquiries or clerical errors"
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                {diagnostic?.educational_disclaimer ||
                  "Educational credit advisory model reflecting CIBIL TransUnion standards. Does not constitute formal legal or financial advice."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
