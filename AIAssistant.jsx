import { useState, useEffect, useRef } from "react";
import api, { aiAPI, recommendationsAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
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

  // Update initial welcome message and suggestion chips if user switches language before chatting
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [
          {
            role: "assistant",
            content: t(
              "ai.welcomeMessage",
              "Hello! I am your **AI Credit & Financial Advisor**, specialized in the Indian banking and CIBIL credit scoring ecosystem.\n\nI have access to your credit profile, debt-to-income ratio, and card utilization. Ask me anything about boosting your score, clearing debt, or loan eligibility!"
            ),
            suggestions: t("ai.suggestions", [
              "How can I reach a 750+ CIBIL score?",
              "How does credit utilization affect my approval chances?",
              "Should I close my unused credit card?",
            ]),
          },
        ];
      }
      return prev;
    });
  }, [currentLanguage, t]);

  const loadInitialData = async () => {
    try {
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
            key_positive_factors: res.data.strengths || [],
            critical_risk_factors: res.data.risk_factors || [],
            immediate_action_items: res.data.actionable_steps || [],
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
  }, []);

  const handleRunDiagnostic = async () => {
    setAnalyzing(true);
    setError("");
    try {
      let analysisData;
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

      setDiagnostic(analysisData);

      // Add AI report announcement in chat
      const summaryMsg = {
        role: "assistant",
        content: `**${t("ai.diagnosticReport", "CIBIL Diagnostic Report")}**\n\n- **${t("dashboard.healthGrade", "Credit Health")}**: ${analysisData.health_grade}\n- **${t("ai.summaryTitle", "Summary")}**: ${analysisData.summary}\n\n${t("ai.disclaimer", "Review your positive factors, risk items, and long-term roadmap on the diagnostic panel.")}`,
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
        const fallbackRes = await api.post("/api/ai/chat", {
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
      const errorTextByLang = {
        mr: "AI सल्लागार सेवेमध्ये तात्पुरती अडचण आली आहे. तुमचा डेटा सुरक्षित आहे. कृपया पुन्हा विचारून पहा किंवा 'AI क्रेडिट चाचणी चालवा' वर क्लिक करा.",
        hi: "AI सलाहकार सेवा में अस्थायी समस्या आई है। आपका डेटा सुरक्षित है। कृपया पुनः पूछें या 'AI क्रेडिट डायग्नोस्टिक चलाएं' पर क्लिक करें।",
        en: "I encountered a temporary communication glitch with the primary AI engine. Your credit data is safe. Please ask again or click 'Run AI Credit Diagnostic' to refresh.",
      };
      const fallbackSuggestionsByLang = {
        mr: ["CIBIL स्कोर कसा सुधारावा?", "क्रेडिट कार्ड युटिलायझेशन कमी करण्यासाठी टिपा"],
        hi: ["CIBIL स्कोर कैसे सुधारें?", "क्रेडिट कार्ड उपयोग कम करने के टिप्स"],
        en: ["How to improve my CIBIL score?", "Tips for lower card utilization"],
      };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorTextByLang[currentLanguage] || errorTextByLang.en,
          suggestions: fallbackSuggestionsByLang[currentLanguage] || fallbackSuggestionsByLang.en,
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
            <Sparkles className="w-7 h-7 text-indigo-400 shrink-0" />
            <span>{t("ai.title", "AI Credit Advisor")}</span>
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

      {/* Main Grid: Chat Assistant + Comprehensive AI Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Assistant */}
        <div className={`lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col h-[650px] sm:h-[700px] shadow-2xl relative overflow-hidden ${activeTab === "diagnostic" ? "hidden lg:flex" : "flex"}`}>
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>{t("ai.interactiveTitle", "Interactive Credit Advisor Chat")}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t("ai.modelActive", "Gemini 2.0 / Flash Active")}
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
                  <span className="ml-2 font-mono text-[11px]">{t("ai.reasoningMessage", "Gemini is reasoning through your credit profile...")}</span>
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
                placeholder={t("ai.inputPlaceholder", "Ask about your CIBIL score, cards, EMI relief, or dispute processes...")}
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

        {/* Right Column: AI Diagnostic Report Panel */}
        <div className={`lg:col-span-5 space-y-6 ${activeTab === "chat" ? "hidden lg:block" : "block"}`}>
          {!diagnostic ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                {t("ai.noDiagnosticTitle", "No Diagnostic Run Yet")}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {t("ai.noDiagnosticDesc", "Run an AI Credit Diagnostic to analyze your real credit accounts, card utilization, and payment history.")}
              </p>
              <button
                onClick={handleRunDiagnostic}
                disabled={analyzing}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
                <span>{analyzing ? t("ai.analyzing", "Analyzing Credit Data...") : t("ai.runDiagnostic", "Run AI Credit Diagnostic")}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              {/* Header & Grade */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>{t("ai.diagnosticReport", "CIBIL Diagnostic Report")}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{t("ai.structuredEval", "Real-time structured evaluation")}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  {diagnostic.health_grade || "Not Assessed"}
                </span>
              </div>

              {/* AI Credit-Health Summary */}
              {diagnostic.summary && (
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    {t("ai.summaryTitle", "Executive Credit Health Summary")}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {diagnostic.summary}
                  </p>
                </div>
              )}

              {/* Positive Factors */}
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{t("ai.positiveFactors", "Key Positive Factors")}</span>
                </div>
                {(diagnostic.key_positive_factors || diagnostic.strengths || []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {(diagnostic.key_positive_factors || diagnostic.strengths).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 py-1">No positive factors recorded yet.</div>
                )}
              </div>

              {/* Risk Factors */}
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{t("ai.riskFactors", "Critical Risk Factors & Cautions")}</span>
                </div>
                {(diagnostic.critical_risk_factors || diagnostic.risk_factors || []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {(diagnostic.critical_risk_factors || diagnostic.risk_factors).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 py-1">No critical risk factors identified.</div>
                )}
              </div>

              {/* Immediate Actions */}
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>{t("ai.actionItems", "Immediate Action Items")}</span>
                  </span>
                  {dbRecs.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dbRecs.filter((r) => r.is_completed).length}/{dbRecs.length} {t("ai.doneCount", "Done")}
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
                ) : (diagnostic.immediate_action_items || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {diagnostic.immediate_action_items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 py-1">No immediate action items required.</div>
                )}
              </div>

              {/* Long-Term Strategy */}
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>{t("ai.longTermStrategy", "Long-Term Credit Strategy")}</span>
                </div>
                {(diagnostic.long_term_strategy || []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {diagnostic.long_term_strategy.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-500 py-1">No long-term strategy items recorded.</div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  {diagnostic.educational_disclaimer || t("ai.disclaimer", "Educational credit advisory model reflecting CIBIL TransUnion standards. Does not constitute formal legal or financial advice.")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
