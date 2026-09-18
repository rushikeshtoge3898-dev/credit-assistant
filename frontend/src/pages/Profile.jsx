import { useState, useEffect } from "react";
import api, { creditAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { User, Shield, IndianRupee, Save, CheckCircle2, AlertCircle, Award } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Form states
  const [creditScore, setCreditScore] = useState("");
  const [income, setIncome] = useState("");
  const [debt, setDebt] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("");
  const [activeLoans, setActiveLoans] = useState("0");
  const [missedPayments, setMissedPayments] = useState("0");
  const [financialGoal, setFinancialGoal] = useState("");

  const fetchProfile = async () => {
    try {
      let p;
      try {
        p = await creditAPI.getProfile();
      } catch (err) {
        const fallbackRes = await api.get("/credit/profile");
        p = fallbackRes.data;
      }
      setProfile(p);
      if (p) {
        setCreditScore(p.credit_score ?? "");
        setIncome(p.monthly_income ?? "");
        setDebt(p.total_debt ?? "");
        setLimit(p.credit_limit ?? "");
        setBalance(p.credit_card_balance ?? "");
        setActiveLoans(p.active_loans ?? 0);
        setMissedPayments(p.missed_payments ?? 0);
        setFinancialGoal(p.financial_goal ?? "");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      monthly_income: parseFloat(income) || 0,
      total_debt: parseFloat(debt) || 0,
      credit_limit: parseFloat(limit) || 0,
      credit_card_balance: parseFloat(balance) || 0,
      active_loans: parseInt(activeLoans) || 0,
      missed_payments: parseInt(missedPayments) || 0,
      financial_goal: financialGoal,
    };

    if (creditScore !== "" && !isNaN(parseInt(creditScore))) {
      payload.credit_score = parseInt(creditScore);
    }

    try {
      try {
        await creditAPI.updateProfile(payload);
      } catch (err) {
        await api.put("/credit/profile", payload);
      }

      setMessage("Credit profile updated successfully!");
      fetchProfile();
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update profile. Please ensure values are valid.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading your profile settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-7 h-7 text-indigo-400" />
          Financial Profile & Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust your monthly income, liabilities, limits, and credit improvement milestones.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* User Information Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          Account Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Registered Name:</span>
            <div className="font-semibold text-slate-200 mt-0.5">{user?.name}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Email Address:</span>
            <div className="font-semibold text-slate-200 mt-0.5">{user?.email}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Mobile Number:</span>
            <div className="font-semibold text-slate-200 mt-0.5">{user?.phone_number || "Not provided"}</div>
          </div>
        </div>
      </div>

      {/* Financial Parameters Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-emerald-400" />
          Financial Indicators (Used for CIBIL & DTI Calculations)
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Keep these updated so your credit analytics and AI coaching remain accurate.
        </p>

        <form onSubmit={handleUpdate} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Current CIBIL Score (300 - 900)
              </label>
              <input
                type="number"
                min={300}
                max={900}
                placeholder="e.g. 750 (Optional)"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Monthly In-Hand Income (₹)
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Total Debt / Loan Principal (₹)
              </label>
              <input
                type="number"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Total Sanctioned Credit Card Limit (₹)
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Current Card Outstanding Balance (₹)
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Active Loans Count
              </label>
              <input
                type="number"
                min="0"
                value={activeLoans}
                onChange={(e) => setActiveLoans(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Past Missed / Overdue Payments
              </label>
              <input
                type="number"
                min="0"
                value={missedPayments}
                onChange={(e) => setMissedPayments(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Primary Financial Goal
            </label>
            <input
              type="text"
              value={financialGoal}
              onChange={(e) => setFinancialGoal(e.target.value)}
              placeholder="e.g. Achieve 780+ CIBIL score for Home Loan eligibility"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Financial Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
