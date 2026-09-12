import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { creditAPI, accountsAPI, recommendationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import CibilScoreGauge from "../components/CibilScoreGauge";
import CreditHealthIndicator from "../components/CreditHealthIndicator";
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  IndianRupee,
  Database,
  Calendar,
  Clock,
  Info,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Circle,
  Plus
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [updatingRecId, setUpdatingRecId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Profile
      let pData = null;
      try {
        pData = await creditAPI.getProfile();
      } catch (err) {
        if (err.response?.status !== 404) {
          try {
            const fb = await api.get("/credit/profile");
            pData = fb.data;
          } catch (e) {
            // Profile does not exist yet for clean user
          }
        }
      }
      setProfile(pData);

      // 2. Fetch Analytics
      let aData = null;
      try {
        aData = await creditAPI.getAnalytics();
      } catch (err) {
        try {
          const fb = await api.get("/credit/analytics");
          aData = fb.data;
        } catch (e) {
          // No analytics for clean user
        }
      }
      setAnalytics(aData);

      // 3. Fetch Score History
      let shData = [];
      try {
        shData = await creditAPI.getScoreHistory();
      } catch (err) {
        try {
          const fb = await api.get("/credit/score-history");
          shData = fb.data;
        } catch (e) {
          shData = [];
        }
      }
      setScoreHistory(shData);

      // 4. Fetch Accounts
      let accData = [];
      try {
        accData = await accountsAPI.getAccounts();
      } catch (err) {
        try {
          const fb = await api.get("/credit/accounts");
          accData = fb.data;
        } catch (e) {
          accData = [];
        }
      }
      setAccounts(accData);

      // 5. Fetch Recommendations
      let recData = [];
      try {
        recData = await recommendationsAPI.getRecommendations();
      } catch (err) {
        try {
          const fb = await api.get("/recommendations");
          recData = fb.data;
        } catch (e) {
          recData = [];
        }
      }
      setRecommendations(recData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load credit report. Please check server connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await creditAPI.seedSampleData();
      setSeedSuccess(true);
      await fetchDashboardData();
      setTimeout(() => setSeedSuccess(false), 6000);
    } catch (err) {
      try {
        await api.post("/credit/seed-sample-data");
        setSeedSuccess(true);
        await fetchDashboardData();
        setTimeout(() => setSeedSuccess(false), 6000);
      } catch (e) {
        console.error("Failed to seed sample data:", e);
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleRecommendation = async (rec) => {
    setUpdatingRecId(rec.id);
    const nextCompleted = !rec.is_completed;
    try {
      try {
        await recommendationsAPI.updateRecommendation(rec.id, { is_completed: nextCompleted });
      } catch (e) {
        await api.put(`/api/recommendations/${rec.id}`, { is_completed: nextCompleted });
      }
      setRecommendations((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, is_completed: nextCompleted } : r))
      );
    } catch (err) {
      console.error("Failed to toggle recommendation:", err);
    } finally {
      setUpdatingRecId(null);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Fetching real-time CIBIL health analytics...</p>
      </div>
    );
  }

  // Error State with Retry
  if (error) {
    return (
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Connection Issue</h3>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  // Check if completely new user with zero data
  const hasNoData = !profile && accounts.length === 0 && scoreHistory.length === 0;

  // Actual values or calculated metrics
  const score = profile?.credit_score ?? 700;
  const limit = profile?.credit_limit ?? (accounts.reduce((sum, a) => sum + (a.credit_limit || 0), 0) || 100000);
  const balance = profile?.credit_card_balance ?? (accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0);
  const utilization = analytics?.credit_utilization ?? (limit > 0 ? Math.round((balance / limit) * 100) : 0);
  const dti = analytics?.debt_to_income ?? 0;
  const missed = profile?.missed_payments ?? 0;
  const riskLevel = analytics?.credit_risk || (utilization > 50 || dti > 50 || missed >= 3 ? "High" : utilization > 30 || dti > 30 || missed > 0 ? "Medium" : "Low");

  // Calculate Actual Score Change from actual score history snapshots (Do not invent)
  let scoreChangeText = "No snapshot history";
  let scoreChangeVal = null;
  if (scoreHistory.length >= 2) {
    const latest = scoreHistory[scoreHistory.length - 1].credit_score;
    const previous = scoreHistory[scoreHistory.length - 2].credit_score;
    scoreChangeVal = latest - previous;
    scoreChangeText = scoreChangeVal > 0 
      ? `+${scoreChangeVal} points from previous snapshot` 
      : scoreChangeVal < 0 
      ? `${scoreChangeVal} points from previous snapshot` 
      : "No change from previous snapshot";
  } else if (scoreHistory.length === 1) {
    scoreChangeVal = 0;
    scoreChangeText = "Initial baseline snapshot";
  }

  // Calculate Credit Age from accounts (opened_date / account_age_months)
  const validAges = accounts.map((a) => a.account_age_months || 0).filter((m) => m > 0);
  const oldestAccountAgeMonths = validAges.length > 0 ? Math.max(...validAges) : 0;
  const avgAccountAgeMonths = validAges.length > 0 ? Math.round(validAges.reduce((a, b) => a + b, 0) / validAges.length) : 0;

  const formatTenure = (months) => {
    if (!months || months <= 0) return "New (< 1 yr)";
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    if (yrs === 0) return `${mos} mos`;
    if (mos === 0) return `${yrs} yrs`;
    return `${yrs}y ${mos}m`;
  };

  // Demo Data check
  const isDemoActive =
    seedSuccess ||
    accounts.some(
      (a) =>
        a.account_name?.toLowerCase().includes("regalia") ||
        a.account_name?.toLowerCase().includes("millennia") ||
        a.account_name?.toLowerCase().includes("sbi car loan")
    );

  return (
    <div className="space-y-8">
      {/* Educational Estimate Disclaimer Banner */}
      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs text-indigo-300 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong className="font-semibold text-white">Educational Credit Estimate:</strong>{" "}
            This score simulation and credit analysis model follows Indian TransUnion CIBIL standards (300–900). It is an educational projection, not an official credit bureau pull.
          </span>
        </div>
        <span className="hidden md:inline-block shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
          Educational Mode
        </span>
      </div>

      {/* Welcome & Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> TransUnion CIBIL India Assessment
              </span>
              {isDemoActive && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-400" /> DEMO SIMULATION DATA
                </span>
              )}
              {seedSuccess && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                  Sample Indian CIBIL profile loaded!
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || "Member"}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Here is your real-time Indian credit health overview, utilization tracking, and AI-powered recommendations to optimize your CIBIL score.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              title="Populate complete Indian credit cards, loans, and score trends"
              className="flex items-center px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer disabled:opacity-60"
            >
              <Database className="w-4 h-4 mr-1.5 text-indigo-400" />
              {seeding ? "Loading..." : "Load Demo CIBIL Data"}
            </button>

            <Link
              to="/ai-assistant"
              className="flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
              Ask AI Advisor
            </Link>
          </div>
        </div>
      </div>

      {/* Empty State for Brand New User */}
      {hasNoData && (
        <div className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white">No credit data added yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start by logging your current CIBIL score snapshot, adding your credit cards or active loans, or load sample Indian bank tradelines to explore full credit health capabilities.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/accounts"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" /> Add Credit Account
            </Link>
            <Link
              to="/score-history"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Log Credit Score
            </Link>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-400" /> Load Demo CIBIL Data
            </button>
          </div>
        </div>
      )}

      {/* Top 6 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: CIBIL Score & Snapshot Change */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>CIBIL Score</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{score}</span>
              <span className="text-xs text-slate-400 font-mono font-normal">/ 900</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-1">
              {score >= 750 ? "Prime / Excellent" : score >= 700 ? "Good" : score >= 650 ? "Fair" : "Needs Care"}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
            {scoreChangeVal !== null && scoreChangeVal !== 0 && (
              <span className={`font-bold inline-flex items-center ${scoreChangeVal > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {scoreChangeVal > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </span>
            )}
            <span className="truncate" title={scoreChangeText}>{scoreChangeText}</span>
          </div>
        </div>

        {/* Card 2: Credit Utilization */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Card Utilization</span>
              <Percent className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {utilization}%
            </div>
            <div className={`text-xs font-semibold mt-1 ${utilization <= 30 ? "text-emerald-400" : "text-amber-400"}`}>
              {utilization <= 30 ? "Optimal (<30%)" : "High (>30%)"}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            CIBIL 30% rule
          </div>
        </div>

        {/* Card 3: Debt-to-Income */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Debt-to-Income</span>
              <IndianRupee className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {dti}%
            </div>
            <div className={`text-xs font-semibold mt-1 ${dti <= 35 ? "text-emerald-400" : "text-amber-400"}`}>
              {dti <= 35 ? "Healthy Leverage" : "Moderate Leverage"}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Annual gross DTI
          </div>
        </div>

        {/* Card 4: Payment History */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Payment History</span>
              {missed === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="text-3xl font-black text-white">
              {missed === 0 ? "100%" : `${missed} Overdue`}
            </div>
            <div className={`text-xs font-semibold mt-1 ${missed === 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {missed === 0 ? "Flawless Track" : "Missed DPD detected"}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            35% CIBIL impact
          </div>
        </div>

        {/* Card 5: Credit Age / Tenure */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Oldest Tradeline</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {formatTenure(oldestAccountAgeMonths)}
            </div>
            <div className="text-xs font-semibold text-purple-400 mt-1">
              {oldestAccountAgeMonths >= 36 ? "Seasoned (>3 yrs)" : "Building Credit"}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Avg: {formatTenure(avgAccountAgeMonths)}
          </div>
        </div>

        {/* Card 6: Active Tradelines & Risk Level */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Active Accounts</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {accounts.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400">Risk:</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                riskLevel === "Low" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : riskLevel === "Medium"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {riskLevel}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Credit Mix Factor
          </div>
        </div>
      </div>

      {/* Main Grid: Gauge & Utilization Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CIBIL Score Gauge */}
        <div className="lg:col-span-5 flex flex-col">
          <CibilScoreGauge score={score} />
        </div>

        {/* Right Column: Credit Utilization Meter & AI Action Plan */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* Card: Detailed Utilization Meter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Credit Card Utilization Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Keep revolving credit below 30% of your total sanctioned card limit
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                utilization <= 30 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {utilization}% Used
              </span>
            </div>

            {/* Visual Bar */}
            <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  utilization <= 30
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : utilization <= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-rose-500 to-rose-400"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, utilization))}%` }}
              />
              {/* 30% Indicator Notch */}
              <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white/70 shadow-sm" title="Recommended 30% Threshold" />
            </div>

            {/* Threshold Labels */}
            <div className="flex justify-between text-[11px] text-slate-400 mt-2">
              <span>₹0</span>
              <span className="text-emerald-400 font-medium">Ideal Threshold: ₹{(limit * 0.3).toLocaleString("en-IN")} (30%)</span>
              <span>Total Limit: ₹{limit.toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Current Balance Used:</span>
                <div className="text-base font-bold text-white mt-0.5">
                  ₹{balance.toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Available Card Credit:</span>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{Math.max(0, limit - balance).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Card: AI Recommendation Preview & Call to Action */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl shadow-slate-950/50 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">AI Credit Coach Insights</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  TransUnion CIBIL
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {utilization <= 30
                  ? `Excellent discipline keeping utilization at ${utilization}%! Timely repayment on reported accounts will maintain upward momentum towards 780+.`
                  : `Your revolving utilization is at ${utilization}%. Bringing outstanding balance down by ₹${Math.max(0, balance - limit * 0.25).toLocaleString("en-IN")} can unlock an estimated 20-35 point CIBIL boost.`}
              </p>

              <div className="mt-3 text-xs bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Target Score Trajectory:</span>
                <span className="font-bold text-emerald-400">780+ in 6 Months</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Need personal debt advice?</span>
              <Link
                to="/ai-assistant"
                className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Open Full AI Advisor <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section (Polished Checklist) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Personalized CIBIL Recommendations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prioritized checklist grounded in RBI credit guidelines and TransUnion scoring criteria
            </p>
          </div>
          {recommendations.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {recommendations.filter((r) => r.is_completed).length} of {recommendations.length} completed
            </span>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const isHigh = rec.priority === "High";
              const isMed = rec.priority === "Medium";
              return (
                <div
                  key={rec.id}
                  onClick={() => handleToggleRecommendation(rec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    rec.is_completed
                      ? "bg-slate-950/40 border-slate-800/60 opacity-65"
                      : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/40 shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isHigh
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : isMed
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {rec.category}
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold ${rec.is_completed ? "line-through text-slate-400" : "text-slate-100"}`}>
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      {rec.is_completed ? "Completed" : "Tap to complete"}
                    </span>
                    <button
                      type="button"
                      disabled={updatingRecId === rec.id}
                      className="text-slate-400 hover:text-white"
                    >
                      {rec.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            No recommendations generated yet. Click &ldquo;Load Demo CIBIL Data&rdquo; or run an AI Credit Diagnostic.
          </div>
        )}
      </div>

      {/* Bottom Section: Educational 4 Pillars */}
      <CreditHealthIndicator profile={profile} analytics={analytics} />
    </div>
  );
}
