import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { creditAPI, goalsAPI } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { Target, Plus, CheckCircle2, Sliders, ArrowRight, Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";

export default function Goals() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulator States
  const [paydownAmount, setPaydownAmount] = useState(20000);
  const [ontimeMonths, setOntimeMonths] = useState(6);
  const [limitIncrease, setLimitIncrease] = useState(50000);
  const [newInquiry, setNewInquiry] = useState(false);

  // New Goal Form
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [targetScore, setTargetScore] = useState(780);
  const [targetDate, setTargetDate] = useState("Dec 2026");
  const [actionPlan, setActionPlan] = useState("Keep utilization below 20% and pay off personal loan");
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchProfileAndGoals = async () => {
    try {
      let pData = null;
      let gData = [];

      try {
        pData = await creditAPI.getProfile();
      } catch (err) {
        const fallbackP = await api.get("/credit/profile");
        pData = fallbackP.data;
      }

      try {
        gData = await goalsAPI.getGoals();
      } catch (err) {
        const fallbackG = await api.get("/credit/goals");
        gData = fallbackG.data;
      }

      setProfile(pData);
      setGoals(gData);
    } catch (err) {
      console.error("Error fetching goals/profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    const payload = {
      target_score: parseInt(targetScore),
      target_date: targetDate,
      action_plan: actionPlan,
    };
    try {
      try {
        await goalsAPI.createGoal(payload);
      } catch (err) {
        await api.post("/credit/goals", payload);
      }
      setShowGoalModal(false);
      fetchProfileAndGoals();
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleToggleGoal = async (goal) => {
    const nextStatus = goal.status === "completed" ? "in_progress" : "completed";
    try {
      try {
        await goalsAPI.updateGoal(goal.id, { status: nextStatus });
      } catch (err) {
        await api.put(`/credit/goals/${goal.id}`, { status: nextStatus });
      }
      fetchProfileAndGoals();
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      try {
        await goalsAPI.deleteGoal(id);
      } catch (err) {
        await api.delete(`/credit/goals/${id}`);
      }
      setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  // Base score
  const hasScore = typeof profile?.credit_score === "number" && profile.credit_score >= 300;
  const baseScore = hasScore ? profile.credit_score : null;
  const currentLimit = profile?.credit_limit || 100000;
  const currentBalance = profile?.credit_card_balance || 30000;

  // Simulator calculations (CIBIL grounded)
  // 1. Paydown bonus: reduction in utilization
  const simulatedBalance = Math.max(0, currentBalance - paydownAmount);
  const simulatedLimit = currentLimit + limitIncrease;
  const simUtil = simulatedLimit > 0 ? (simulatedBalance / simulatedLimit) * 100 : 0;
  const currentUtil = currentLimit > 0 ? (currentBalance / currentLimit) * 100 : 0;

  let utilBonus = 0;
  if (currentUtil > 30 && simUtil <= 30) {
    utilBonus = Math.min(35, Math.round((currentUtil - simUtil) * 1.2));
  } else if (simUtil < currentUtil) {
    utilBonus = Math.min(20, Math.round((currentUtil - simUtil) * 0.8));
  }

  // 2. On-time payments streak bonus (approx 3-5 pts per clean month)
  const ontimeBonus = Math.round(ontimeMonths * 3.5);

  // 3. Hard inquiry dip (-6 to -10 pts)
  const inquiryPenalty = newInquiry ? -8 : 0;

  const totalDelta = utilBonus + ontimeBonus + inquiryPenalty;
  const projectedScore = hasScore ? Math.min(900, Math.max(300, baseScore + totalDelta)) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="w-7 h-7 text-indigo-400" />
            {t("goals.title", "Goals & CIBIL Score Simulator")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("goals.subtitle", "Simulate the impact of paying down debt, increasing limits, and staying on-time.")}
          </p>
        </div>

        <button
          onClick={() => setShowGoalModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t("goals.setNewGoal", "Create Target Goal")}
        </button>
      </div>

      {/* CIBIL Score Simulator Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> {t("goals.whatIfEngine", "What-If Engine")}
              </span>
              <span className="text-xs text-slate-400 font-mono">{t("goals.realTimeModel", "Real-time CIBIL Model")}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{t("goals.whatIfEngine", "Interactive Score Simulator")}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {t("goals.simulatorDesc", "Adjust levers to preview potential credit score transformations before making financial moves.")}
            </p>
          </div>

          {/* Projected Result Gauge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:px-6 flex items-center gap-6 self-stretch sm:self-auto justify-between">
            <div>
              <div className="text-xs text-slate-400">{t("goals.currentBaseline", "Current Score")}</div>
              <div className="text-2xl font-black text-slate-300 font-mono">
                {hasScore ? baseScore : t("dashboard.notAvailable", "Not Available")}
              </div>
            </div>

            <ArrowRight className="w-6 h-6 text-indigo-400" />

            <div>
              <div className="text-xs text-slate-400">{t("goals.projectedScore", "Projected Score (Estimate)")}</div>
              {hasScore ? (
                <div className="text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
                  <span>{projectedScore}</span>
                  <span className="text-xs font-bold text-emerald-400 font-sans">
                    (Est. {totalDelta >= 0 ? `+${totalDelta}` : totalDelta} {t("common.pts", "pts")})
                  </span>
                </div>
              ) : (
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {totalDelta >= 0 ? `+${totalDelta}` : totalDelta} {t("goals.potentialImpact", "pts potential impact")}
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasScore && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>
              {t("dashboard.recordScorePrompt", "Add your first score snapshot in Profile or Score History to view exact numerical projections.")}
            </span>
            <Link
              to="/score-history"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shrink-0"
            >
              {t("dashboard.recordScoreBtn", "Record CIBIL Score")}
            </Link>
          </div>
        )}

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Lever 1: Paydown Credit Card Balance */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {t("goals.paydownDebt", "Pay Down Card Debt")}
              </label>
              <span className="text-sm font-bold text-indigo-400 font-mono">
                ₹{paydownAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={currentBalance}
              step="2000"
              value={paydownAmount}
              onChange={(e) => setPaydownAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>₹0</span>
              <span className="text-slate-400">
                {t("goals.newCurLabel", "New CUR:")} {simUtil.toFixed(1)}% ({currentUtil.toFixed(1)}%)
              </span>
              <span>₹{currentBalance.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Lever 2: On-Time Payments Streak */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {t("goals.ontimeTrack", "On-Time Payment Streak")}
              </label>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {ontimeMonths} {t("goals.monthsCount", "Months")}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={ontimeMonths}
              onChange={(e) => setOntimeMonths(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>1 {t("goals.monthsCount", "mo")}</span>
              <span className="text-slate-400">{t("goals.cleanHistoryDesc", "Builds clean 35% CIBIL history")}</span>
              <span>24 {t("goals.monthsCount", "mos")}</span>
            </div>
          </div>

          {/* Lever 3: Credit Limit Enhancement */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {t("goals.limitExpansion", "Request Limit Increase")}
              </label>
              <span className="text-sm font-bold text-teal-400 font-mono">
                +₹{limitIncrease.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={limitIncrease}
              onChange={(e) => setLimitIncrease(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>₹0</span>
              <span className="text-slate-400">{t("goals.totalLimitEst", "Total Limit:")} ₹{simulatedLimit.toLocaleString("en-IN")}</span>
              <span>₹2,00,000</span>
            </div>
          </div>

          {/* Lever 4: Hard Inquiries */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-1">
                {t("goals.hardInquiry", "Apply for New Loan / Card")}
              </label>
              <p className="text-xs text-slate-400 mb-3">
                {t("goals.hardInquiryDesc", "Applying creates a Hard Enquiry which may dip score by 5-10 points temporarily.")}
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={newInquiry}
                onChange={(e) => setNewInquiry(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-medium text-slate-300">
                {t("goals.simulateInquiryCheck", "Simulate 1 new credit application inquiry")}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Credit Improvement Goals List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
        <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span>{t("goals.activeGoals", "Active Improvement Goals")} ({goals.length})</span>
        </h2>

        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((g) => {
              const isAchieved = g.status === "completed";
              return (
                <div
                  key={g.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    isAchieved
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleGoal(g)}
                      className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
                        isAchieved
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-slate-500 hover:text-indigo-400 bg-slate-900"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {t("goals.targetScore", "Target Score")}: {g.target_score}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{t("goals.byDate", "by")} {g.target_date}</span>
                        {isAchieved && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t("goals.completed", "Achieved")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{g.action_plan}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      {t("common.delete", "Delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-3">
            <p className="text-xs">{t("goals.noGoals", "No target goals created yet. Set a milestone (e.g. 780 for prime home loan approval).")}</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> {t("goals.setNewGoal", "Create Target Goal")}
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs">
            <h3 className="text-lg font-bold text-white mb-4">{t("goals.createGoalModalTitle", "Set CIBIL Improvement Goal")}</h3>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("goals.targetScore", "Target Score (300-900)")}</label>
                <input
                  type="number"
                  min="300"
                  max="900"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("goals.targetDate", "Target Date")}</label>
                <input
                  type="text"
                  placeholder="e.g. Dec 2026 / 6 Months"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("goals.actionPlan", "Strategy / Action Plan")}</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Pay down HDFC credit card balance to under 20% and never miss an EMI."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {savingGoal ? t("goals.savingGoal", "Saving...") : t("goals.setNewGoal", "Save Goal")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
