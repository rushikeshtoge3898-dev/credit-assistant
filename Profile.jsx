import { useState, useEffect } from "react";
import api, { creditAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  User,
  Shield,
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Edit2,
  X,
  TrendingUp,
  CreditCard,
  Target,
  Clock,
  Layers,
  Phone,
  Mail
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form states for editable fields
  const [creditScore, setCreditScore] = useState("");
  const [income, setIncome] = useState("");
  const [debt, setDebt] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [activeLoans, setActiveLoans] = useState("0");
  const [missedPayments, setMissedPayments] = useState("0");
  const [financialGoal, setFinancialGoal] = useState("");

  const populateFormFields = (p) => {
    if (p) {
      setCreditScore(p.credit_score !== null && p.credit_score !== undefined ? String(p.credit_score) : "");
      setIncome(p.monthly_income !== null && p.monthly_income !== undefined ? String(p.monthly_income) : "");
      setDebt(p.total_debt !== null && p.total_debt !== undefined ? String(p.total_debt) : "");
      setLimit(p.credit_limit !== null && p.credit_limit !== undefined ? String(p.credit_limit) : "");
      setBalance(p.credit_card_balance !== null && p.credit_card_balance !== undefined ? String(p.credit_card_balance) : "");
      setActiveLoans(p.active_loans !== null && p.active_loans !== undefined ? String(p.active_loans) : "0");
      setMissedPayments(p.missed_payments !== null && p.missed_payments !== undefined ? String(p.missed_payments) : "0");
      setFinancialGoal(p.financial_goal || "");
    } else {
      setCreditScore("");
      setIncome("");
      setDebt("");
      setLimit("");
      setBalance("");
      setActiveLoans("0");
      setMissedPayments("0");
      setFinancialGoal("");
    }
  };

  const fetchProfile = async () => {
    try {
      let p = null;
      try {
        p = await creditAPI.getProfile();
      } catch (err) {
        if (err.response?.status !== 404) {
          const fallbackRes = await api.get("/credit/profile");
          p = fallbackRes.data;
        }
      }
      setProfile(p);
      populateFormFields(p);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleStartEdit = () => {
    populateFormFields(profile);
    setError("");
    setMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    populateFormFields(profile);
    setError("");
    setMessage("");
    setIsEditing(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    // Validate score if entered
    let parsedScore = null;
    if (creditScore !== "" && creditScore !== null && creditScore !== undefined) {
      const num = parseInt(creditScore, 10);
      if (isNaN(num) || num < 300 || num > 900) {
        setError(t("scoreHistory.snapshotError", "Please enter a valid CIBIL score between 300 and 900."));
        setSaving(false);
        return;
      }
      parsedScore = num;
    }

    const payload = {
      monthly_income: parseFloat(income) || 0,
      total_debt: parseFloat(debt) || 0,
      credit_limit: parseFloat(limit) || 0,
      credit_card_balance: parseFloat(balance) || 0,
      active_loans: parseInt(activeLoans, 10) || 0,
      missed_payments: parseInt(missedPayments, 10) || 0,
      financial_goal: financialGoal.trim(),
      credit_score: parsedScore, // Preserves null if empty
    };

    try {
      let updated = null;
      try {
        updated = await creditAPI.updateProfile(payload);
      } catch (err) {
        const fallbackRes = await api.put("/credit/profile", payload);
        updated = fallbackRes.data;
      }

      setProfile(updated || payload);
      populateFormFields(updated || payload);
      setMessage(t("profile.updateSuccess", "Credit profile updated successfully!"));
      setIsEditing(false);
      // Re-fetch to ensure sync with backend
      fetchProfile();
    } catch (err) {
      console.error("Update failed:", err);
      setError(t("profile.updateError", "Failed to update profile. Please ensure values are valid."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">{t("profile.loadingProfile", "Loading your profile settings...")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-indigo-400 shrink-0" />
            <span>{t("profile.title", "Financial Profile & Settings")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isEditing
              ? t("profile.subtitle", "Adjust your monthly income, liabilities, limits, and credit improvement milestones.")
              : t("profile.viewModeSubtitle", "View and manage your saved credit profile and financial indicators.")}
          </p>
        </div>

        {!isEditing && (
          <button
            id="edit-profile-btn"
            type="button"
            onClick={handleStartEdit}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit2 className="w-4 h-4" />
            <span>{t("profile.editProfile", "Edit Profile")}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* User Information Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <h2 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{t("profile.accountDetails", "Account Details")}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              {t("profile.registeredName", "Registered Name:")}
            </span>
            <div className="font-semibold text-slate-200 mt-1 break-words">{user?.name || t("profile.notProvided", "Not provided")}</div>
          </div>
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              {t("profile.emailAddress", "Email Address:")}
            </span>
            <div className="font-semibold text-slate-200 mt-1 break-all">{user?.email || t("profile.notProvided", "Not provided")}</div>
          </div>
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              {t("profile.mobileNumber", "Mobile Number:")}
            </span>
            <div className="font-semibold text-slate-200 mt-1 font-mono">
              {user?.phone_number || t("profile.notProvided", "Not provided")}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Parameters: VIEW MODE vs EDIT MODE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t("profile.indicatorsTitle", "Financial Indicators (Used for CIBIL & DTI Calculations)")}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t("profile.indicatorsDesc", "Keep these updated so your credit analytics and AI coaching remain accurate.")}
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t("profile.editProfile", "Edit Profile")}</span>
            </button>
          ) : (
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {t("goals.inProgress", "Editing Mode")}
            </span>
          )}
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CIBIL Score View */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  {t("profile.currentScore", "Current CIBIL Score")}
                </span>
                <div className="mt-2 text-2xl font-black text-white font-mono">
                  {profile?.credit_score !== null && profile?.credit_score !== undefined ? (
                    <span className="text-emerald-400">{profile.credit_score}</span>
                  ) : (
                    <span className="text-slate-500 text-sm font-normal">{t("profile.notRecorded", "Not Recorded")}</span>
                  )}
                </div>
              </div>

              {/* Monthly Income View */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  {t("profile.monthlyIncome", "Monthly In-Hand Income")}
                </span>
                <div className="mt-2 text-xl font-bold text-white">
                  ₹{Number(profile?.monthly_income || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Total Debt View */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  {t("profile.totalDebt", "Total Debt / Loan Principal")}
                </span>
                <div className="mt-2 text-xl font-bold text-white">
                  ₹{Number(profile?.total_debt || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Credit Limit View */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                  {t("profile.creditLimit", "Sanctioned Credit Limit")}
                </span>
                <div className="mt-2 text-xl font-bold text-teal-400">
                  ₹{Number(profile?.credit_limit || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Card Balance View */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  {t("profile.cardBalance", "Current Card Balance")}
                </span>
                <div className="mt-2 text-xl font-bold text-white">
                  ₹{Number(profile?.credit_card_balance || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Active Loans & Missed Payments */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="uppercase tracking-wider font-medium">{t("profile.activeLoans", "Active Loans")}:</span>
                  <span className="font-bold text-white font-mono">{profile?.active_loans ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
                  <span className="uppercase tracking-wider font-medium">{t("profile.missedPayments", "Missed Payments")}:</span>
                  <span className={`font-bold font-mono ${Number(profile?.missed_payments) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {profile?.missed_payments ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Goal View */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1.5 mb-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                {t("profile.financialGoal", "Primary Financial Goal")}
              </span>
              <div className="text-sm text-slate-200 font-medium leading-relaxed">
                {profile?.financial_goal || <span className="text-slate-500 italic">{t("profile.notProvided", "Not specified yet. Click 'Edit Profile' to set your primary goal.")}</span>}
              </div>
            </div>

            {/* View Mode Edit Trigger Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {t("profile.subtitle", "Want to update your income, limit, or loan figures?")}
              </span>
              <button
                type="button"
                onClick={handleStartEdit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>{t("profile.editProfile", "Edit Profile")}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <form onSubmit={handleUpdate} className="space-y-6 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.currentScore", "Current CIBIL Score (300 - 900)")}
                </label>
                <input
                  type="number"
                  min={300}
                  max={900}
                  placeholder={t("profile.currentScorePlaceholder", "e.g. 750 (Optional)")}
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.monthlyIncome", "Monthly In-Hand Income (₹)")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.totalDebt", "Total Debt / Loan Principal (₹)")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.creditLimit", "Total Sanctioned Credit Card Limit (₹)")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.cardBalance", "Current Card Outstanding Balance (₹)")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.activeLoans", "Active Loans Count")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={activeLoans}
                  onChange={(e) => setActiveLoans(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.missedPayments", "Past Missed / Overdue Payments")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={missedPayments}
                  onChange={(e) => setMissedPayments(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs uppercase tracking-wider">
                  {t("profile.financialGoal", "Primary Financial Goal")}
                </label>
                <input
                  type="text"
                  value={financialGoal}
                  onChange={(e) => setFinancialGoal(e.target.value)}
                  placeholder={t("profile.financialGoalPlaceholder", "e.g. Achieve 780+ CIBIL score for Home Loan eligibility")}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* EDIT MODE ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                id="cancel-edit-btn"
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>{t("common.cancel", "Cancel")}</span>
              </button>

              <button
                id="save-changes-btn"
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t("profile.savingChanges", "Saving Changes...") : t("profile.saveChanges", "Save Changes")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
