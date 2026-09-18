import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, {
  creditAPI,
  accountsAPI,
  recommendationsAPI,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { guestData } from "../services/guestData";
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
  Clock,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Circle,
  Plus,
} from "lucide-react";

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();

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
      if (isGuest) {
        setProfile(guestData.getGuestProfile());
        setAnalytics(guestData.getGuestAnalytics());
        setScoreHistory(guestData.getGuestScoreHistory());
        setAccounts(guestData.getGuestAccounts());
        setRecommendations(guestData.getGuestRecommendations());
        setLoading(false);
        return;
      }
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
            pData = null;
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
          aData = null;
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

      setScoreHistory(Array.isArray(shData) ? shData : []);

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

      setAccounts(Array.isArray(accData) ? accData : []);

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

      setRecommendations(Array.isArray(recData) ? recData : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(
        "Unable to load credit report. Please check server connection and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isGuest]);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedSuccess(false);

    try {
      if (isGuest) {
        guestData.resetGuestData();
        setSeedSuccess(true);
        await fetchDashboardData();
        setTimeout(() => setSeedSuccess(false), 6000);
        setSeeding(false);
        return;
      }

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
      if (isGuest) {
        guestData.updateGuestRecommendation(rec.id, {
          is_completed: nextCompleted,
        });
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === rec.id
              ? { ...r, is_completed: nextCompleted }
              : r
          )
        );
        setUpdatingRecId(null);
        return;
      }

      try {
        await recommendationsAPI.updateRecommendation(rec.id, {
          is_completed: nextCompleted,
        });
      } catch (e) {
        await api.put(`/api/recommendations/${rec.id}`, {
          is_completed: nextCompleted,
        });
      }

      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === rec.id
            ? { ...r, is_completed: nextCompleted }
            : r
        )
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
        <p className="text-sm font-medium">
          Fetching credit health analytics...
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white">
          Connection Issue
        </h3>

        <p className="text-xs text-slate-400">
          {error}
        </p>

        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Check for completely new user
  const hasNoData =
    !profile &&
    accounts.length === 0 &&
    scoreHistory.length === 0;

  // Use actual values only
  const score =
    profile?.credit_score ??
    analytics?.credit_score ??
    null;

  const limit =
    profile?.credit_limit ??
    accounts.reduce(
      (sum, a) => sum + (Number(a.credit_limit) || 0),
      0
    );

  const balance =
    profile?.credit_card_balance ??
    accounts.reduce(
      (sum, a) => sum + (Number(a.current_balance) || 0),
      0
    );

  const utilization =
    analytics?.credit_utilization ??
    (limit > 0
      ? Math.round((balance / limit) * 100)
      : 0);

  const dti = analytics?.debt_to_income ?? 0;

  const missed = profile?.missed_payments ?? 0;

  const riskLevel =
    analytics?.credit_risk ||
    (
      utilization > 50 ||
      dti > 50 ||
      missed >= 3
        ? "High"
        : utilization > 30 ||
          dti > 30 ||
          missed > 0
        ? "Medium"
        : "Low"
    );

  // Score history change
  let scoreChangeText = "No snapshot history";
  let scoreChangeVal = null;

  if (scoreHistory.length >= 2) {
    const latest =
      scoreHistory[scoreHistory.length - 1].credit_score;

    const previous =
      scoreHistory[scoreHistory.length - 2].credit_score;

    scoreChangeVal = latest - previous;

    scoreChangeText =
      scoreChangeVal > 0
        ? `+${scoreChangeVal} points from previous snapshot`
        : scoreChangeVal < 0
        ? `${scoreChangeVal} points from previous snapshot`
        : "No change from previous snapshot";
  } else if (scoreHistory.length === 1) {
    scoreChangeVal = 0;
    scoreChangeText = "Initial baseline snapshot";
  }

  // Credit Age
  const validAges = accounts
    .map((a) => Number(a.account_age_months) || 0)
    .filter((m) => m > 0);

  const oldestAccountAgeMonths =
    validAges.length > 0
      ? Math.max(...validAges)
      : 0;

  const avgAccountAgeMonths =
    validAges.length > 0
      ? Math.round(
          validAges.reduce((a, b) => a + b, 0) /
            validAges.length
        )
      : 0;

  const formatTenure = (months) => {
    if (!months || months <= 0) {
      return "New (< 1 yr)";
    }

    const yrs = Math.floor(months / 12);
    const mos = months % 12;

    if (yrs === 0) return `${mos} mos`;
    if (mos === 0) return `${yrs} yrs`;

    return `${yrs}y ${mos}m`;
  };

  // Demo Data - strictly only active in guest mode or when sample data was just seeded
  const isDemoActive = isGuest || seedSuccess;

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">

      {/* Welcome & Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-2xl">

        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-6 relative z-10">

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t("dashboard.cibilAssessment", "TransUnion CIBIL India Assessment")}
              </span>

              {isDemoActive && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-400" />
                  {t("dashboard.demoDataBadge", "DEMO SIMULATION DATA")}
                </span>
              )}

              {seedSuccess && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                  {t("dashboard.sampleDataLoaded", "Sample Indian CIBIL profile loaded!")}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("dashboard.welcome", "Welcome back")}, {user?.name || "Member"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
              {t("dashboard.subtitle", "Here is your Indian credit health overview, utilization tracking, and AI-powered recommendations.")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">

            <button
              onClick={handleSeedData}
              disabled={seeding}
              title="Populate sample credit cards, loans, and score trends"
              className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer disabled:opacity-60"
            >
              <Database className="w-4 h-4 mr-1.5 text-indigo-400" />
              {seeding
                ? t("dashboard.loadingDemoData", "Loading...")
                : t("dashboard.loadDemoData", "Load Demo CIBIL Data")}
            </button>

            <Link
              to="/ai-assistant"
              className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" />
              {t("dashboard.askAIAdvisor", "Ask AI Advisor")}
            </Link>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {hasNoData && (
        <div className="bg-slate-900/90 border border-indigo-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-5">

          <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white">
              No credit data added yet
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              Start by logging your current credit score
              snapshot, adding your credit cards or active
              loans, or load sample data to explore the
              credit health capabilities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">

            <Link
              to="/accounts"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" />
              Add Credit Account
            </Link>

            <Link
              to="/score-history"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Log Credit Score
            </Link>

            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              Load Demo CIBIL Data
            </button>
          </div>
        </div>
      )}

      {/* Top 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">

        {/* Card 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">CIBIL Score</span>
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1.5">
              <span>{score ?? "—"}</span>
              <span className="text-xs text-slate-400 font-mono font-normal">
                / 900
              </span>
            </div>

            <div className="text-xs font-semibold text-emerald-400 mt-1">
              {score === null
                ? "Not available"
                : score >= 750
                ? "Prime / Excellent"
                : score >= 700
                ? "Good"
                : score >= 650
                ? "Fair"
                : "Needs Care"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
            {scoreChangeVal !== null &&
              scoreChangeVal !== 0 && (
                <span
                  className={`font-bold inline-flex items-center ${
                    scoreChangeVal > 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {scoreChangeVal > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </span>
              )}

            <span
              className="truncate"
              title={scoreChangeText}
            >
              {scoreChangeText}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">Card Utilization</span>
              <Percent className="w-4 h-4 text-indigo-400 shrink-0" />
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white">
              {utilization}%
            </div>

            <div
              className={`text-xs font-semibold mt-1 ${
                utilization <= 30
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {utilization <= 30
                ? "Optimal (<30%)"
                : "High (>30%)"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Utilization ratio
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">Debt-to-Income</span>
              <IndianRupee className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white">
              {dti}%
            </div>

            <div
              className={`text-xs font-semibold mt-1 ${
                dti <= 35
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {dti <= 35
                ? "Healthy Leverage"
                : "Moderate Leverage"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Annual gross DTI
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">Payment History</span>

              {missed === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              )}
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white">
              {missed === 0
                ? "100%"
                : `${missed} Overdue`}
            </div>

            <div
              className={`text-xs font-semibold mt-1 ${
                missed === 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {missed === 0
                ? "No missed payments"
                : "Missed payment detected"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Payment behaviour
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">Oldest Tradeline</span>
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            </div>

            <div className="text-xl sm:text-2xl font-black text-white">
              {formatTenure(oldestAccountAgeMonths)}
            </div>

            <div className="text-xs font-semibold text-purple-400 mt-1">
              {oldestAccountAgeMonths >= 36
                ? "Seasoned (>3 yrs)"
                : "Building Credit"}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Avg: {formatTenure(avgAccountAgeMonths)}
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5 gap-1">
              <span className="truncate">Active Accounts</span>
              <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white">
              {accounts.length}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400">
                Risk:
              </span>

              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  riskLevel === "Low"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : riskLevel === "Medium"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {riskLevel}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            Credit mix
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col">
          <CibilScoreGauge score={score} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">

          {/* Utilization Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-950/50">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

              <div className="min-w-0">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400 shrink-0" />
                  Credit Card Utilization Breakdown
                </h3>

                <p className="text-xs text-slate-400 mt-0.5">
                  Monitor revolving credit utilization
                </p>
              </div>

              <span
                className={`self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full ${
                  utilization <= 30
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
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
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(5, utilization)
                  )}%`,
                }}
              />

              <div
                className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white/70 shadow-sm"
                title="Recommended 30% Threshold"
              />
            </div>

            {/* Threshold Labels */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px] text-slate-400 mt-2">

              <span>₹0</span>

              <span className="text-emerald-400 font-medium">
                Ideal: ₹
                {(limit * 0.3).toLocaleString("en-IN")}
              </span>

              <span>
                Total Limit: ₹
                {limit.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

              <div>
                <span className="text-slate-400">
                  Current Balance Used:
                </span>

                <div className="text-base font-bold text-white mt-0.5">
                  ₹{balance.toLocaleString("en-IN")}
                </div>
              </div>

              <div>
                <span className="text-slate-400">
                  Available Card Credit:
                </span>

                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹
                  {Math.max(
                    0,
                    limit - balance
                  ).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-950/50 flex-1 flex flex-col justify-between">

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    AI Credit Coach Insights
                  </h3>
                </div>

                <span className="self-start text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  AI Advisor
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {score === null
                  ? "Add your credit profile or score history to receive more personalized credit health insights."
                  : utilization <= 30
                  ? `Your current card utilization is ${utilization}%. Maintaining responsible utilization and timely payments can support healthy credit management.`
                  : `Your current card utilization is ${utilization}%. Consider reducing outstanding revolving balances to improve utilization.`
                }
              </p>

              <div className="mt-3 text-xs bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-slate-300">
                <span className="text-slate-400">
                  Current Score:
                </span>

                <span className="font-bold text-emerald-400">
                  {score ?? "Not available"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

              <span className="text-xs text-slate-400">
                Need personal credit guidance?
              </span>

              <Link
                to="/ai-assistant"
                className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Open AI Advisor
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-950/50">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">

          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Personalized CIBIL Recommendations
            </h3>

            <p className="text-xs text-slate-400 mt-0.5">
              Practical actions based on your available credit data
            </p>
          </div>

          {recommendations.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {
                recommendations.filter(
                  (r) => r.is_completed
                ).length
              }{" "}
              of {recommendations.length} completed
            </span>
          )}
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {recommendations.map((rec) => {
              const isHigh =
                rec.priority === "High";

              const isMed =
                rec.priority === "Medium";

              return (
                <div
                  key={rec.id}
                  onClick={() =>
                    handleToggleRecommendation(rec)
                  }
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                    rec.is_completed
                      ? "bg-slate-950/40 border-slate-800/60 opacity-65"
                      : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/40 shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isHigh
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : isMed
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>

                      <span className="text-[10px] text-slate-500 font-medium truncate">
                        {rec.category}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold ${
                        rec.is_completed
                          ? "line-through text-slate-400"
                          : "text-slate-100"
                      }`}
                    >
                      {rec.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">

                    <span className="text-[11px] text-slate-500">
                      {rec.is_completed
                        ? "Completed"
                        : "Tap to complete"}
                    </span>

                    <button
                      type="button"
                      disabled={
                        updatingRecId === rec.id
                      }
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
            No recommendations generated yet. Click
            "Load Demo CIBIL Data" or run an AI Credit
            Diagnostic.
          </div>
        )}
      </div>

      {/* Credit Health Indicator */}
      <CreditHealthIndicator
        profile={profile}
        analytics={analytics}
      />
    </div>
  );
}