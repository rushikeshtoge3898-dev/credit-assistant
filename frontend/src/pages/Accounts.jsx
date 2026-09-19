import { useState, useEffect } from "react";
import api, { accountsAPI, paymentsAPI } from "../services/api";
import BankSelector from "../components/BankSelector";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Clock
} from "lucide-react";

export default function Accounts() {
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form states for Add/Edit Account
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("State Bank of India");
  const [accountType, setAccountType] = useState("credit_card");
  const [accountNumber, setAccountNumber] = useState("XXXX-1234");
  const [balance, setBalance] = useState("");
  const [limit, setLimit] = useState("");
  const [emi, setEmi] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("Current");
  const [openedDate, setOpenedDate] = useState("");
  const [accountAgeMonths, setAccountAgeMonths] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  // Form states for Log Payment
  const [payMonth, setPayMonth] = useState("Sep 2026");
  const [payAmount, setPayAmount] = useState("");
  const [payStatus, setPayStatus] = useState("On-Time");
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      let accData = [];
      let payData = [];

      try {
        accData = await accountsAPI.getAccounts();
      } catch (err) {
        const fallbackAcc = await api.get("/credit/accounts");
        accData = fallbackAcc.data;
      }

      try {
        payData = await paymentsAPI.getPayments();
      } catch (err) {
        const fallbackPay = await api.get("/credit/payments");
        payData = fallbackPay.data;
      }

      setAccounts(accData);
      setPayments(payData);
    } catch (err) {
      console.error("Failed to fetch accounts/payments:", err);
      setError(t("accounts.loadingAccounts", "Unable to load credit tradelines. Please check your connection and retry."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetAccountForm = () => {
    setAccountName("");
    setBankName("State Bank of India");
    setAccountType("credit_card");
    setAccountNumber("XXXX-1234");
    setBalance("");
    setLimit("");
    setEmi("0");
    setPaymentStatus("Current");
    setOpenedDate("");
    setAccountAgeMonths("");
    setEditingAccount(null);
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setAccountName(acc.account_name || "");
    setBankName(acc.bank_name || "State Bank of India");
    setAccountType(acc.account_type || "credit_card");
    setAccountNumber(acc.account_number_masked || "XXXX-1234");
    setBalance(acc.current_balance !== undefined ? String(acc.current_balance) : "");
    setLimit(acc.credit_limit !== undefined ? String(acc.credit_limit) : "");
    setEmi(acc.monthly_emi !== undefined ? String(acc.monthly_emi) : "0");
    setPaymentStatus(acc.payment_status || "Current");
    setOpenedDate(acc.opened_date || "");
    setAccountAgeMonths(acc.account_age_months !== undefined && acc.account_age_months !== null ? String(acc.account_age_months) : "");
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);

    const payload = {
      account_name: accountName,
      bank_name: bankName,
      account_type: accountType,
      account_number_masked: accountNumber,
      current_balance: parseFloat(balance) || 0,
      credit_limit: parseFloat(limit) || 0,
      monthly_emi: parseFloat(emi) || 0,
      payment_status: paymentStatus,
      opened_date: openedDate || null,
      account_age_months: accountAgeMonths ? parseInt(accountAgeMonths) : null,
    };

    try {
      if (editingAccount) {
        // Edit flow: PUT /api/accounts/{id}
        try {
          await accountsAPI.updateAccount(editingAccount.id, payload);
        } catch (err) {
          await api.put(`/credit/accounts/${editingAccount.id}`, payload);
        }
      } else {
        // Create flow: POST /api/accounts
        try {
          await accountsAPI.createAccount(payload);
        } catch (err) {
          await api.post("/credit/accounts", payload);
        }
      }

      setShowAddModal(false);
      resetAccountForm();
      fetchData();
    } catch (err) {
      console.error("Failed to save account:", err);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm(t("accounts.deleteConfirm", "Are you sure you want to remove this account?"))) return;
    try {
      try {
        await accountsAPI.deleteAccount(id);
      } catch (err) {
        await api.delete(`/credit/accounts/${id}`);
      }
      setAccounts(accounts.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);

    const payload = {
      month_year: payMonth,
      amount_paid: parseFloat(payAmount) || 0,
      status: payStatus,
    };

    try {
      try {
        await paymentsAPI.createPayment(payload);
      } catch (err) {
        await api.post("/credit/payments", payload);
      }

      setShowPaymentModal(false);
      setPayAmount("");
      fetchData();
    } catch (err) {
      console.error("Failed to log payment:", err);
    } finally {
      setSavingPayment(false);
    }
  };

  const formatTenure = (months, date) => {
    if (months) {
      const yrs = Math.floor(months / 12);
      const rem = months % 12;
      if (yrs === 0) return `${rem} ${t("goals.monthsCount", "mos")}`;
      if (rem === 0) return `${yrs} ${t("dashboard.avgTenure", "yrs")}`;
      return `${yrs}y ${rem}m`;
    }
    if (date) return `${t("accounts.openedDate", "Opened")}: ${date}`;
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">{t("accounts.loadingAccounts", "Loading your credit accounts and payment tracker...")}</p>
      </div>
    );
  }

  const totalOutstanding = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);
  const totalLimit = accounts.reduce((acc, a) => acc + (a.credit_limit || 0), 0);
  const totalEmi = accounts.reduce((acc, a) => acc + (a.monthly_emi || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            {t("accounts.title", "Credit Accounts & Loans")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("accounts.subtitle", "Manage your credit cards, personal loans, home loans, and monthly payment track.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-emerald-400" /> {t("accounts.logPayment", "Log Payment")}
          </button>
          <button
            onClick={() => {
              resetAccountForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("accounts.addAccount", "Add Credit Account")}
          </button>
        </div>
      </div>

      {/* Aggregate Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{t("accounts.totalOutstanding", "Total Outstanding Balance")}</div>
          <div className="text-xl font-bold text-white mt-1">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{t("accounts.totalSanctionedLimit", "Total Sanctioned Limit")}</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            ₹{totalLimit.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">{t("accounts.monthlyEmi", "Monthly EMI Obligations")}</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            ₹{totalEmi.toLocaleString("en-IN")} / mo
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>{t("accounts.activeTradelines", "Active Credit Tradelines")} ({accounts.length})</span>
        </h2>

        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {
              const isCard = acc.account_type === "credit_card";
              const typeLabel =
                acc.account_type === "credit_card"
                  ? t("accounts.creditCard", "Credit Card")
                  : acc.account_type === "personal_loan"
                  ? t("accounts.personalLoan", "Personal Loan")
                  : acc.account_type === "home_loan"
                  ? t("accounts.homeLoan", "Home Loan")
                  : acc.account_type === "auto_loan"
                  ? t("accounts.autoLoan", "Auto Loan")
                  : t("accounts.loanTradeline", "Loan / Tradeline");

              const utilPercent =
                acc.credit_limit > 0
                  ? Math.round((acc.current_balance / acc.credit_limit) * 100)
                  : 0;
              const tenure = formatTenure(acc.account_age_months, acc.opened_date);

              return (
                <div
                  key={acc.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  {/* Top Header with Bank & Actions */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-400">{acc.bank_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                              {typeLabel}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white leading-tight mt-0.5">{acc.account_name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t("common.edit", "Edit")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title={t("common.delete", "Delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">{acc.account_number_masked}</span>
                      <div className="flex items-center gap-1.5">
                        {tenure && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700" title={acc.opened_date ? `${t("accounts.openedDate", "Opened")}: ${acc.opened_date}` : "N/A"}>
                            {tenure}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {acc.payment_status === "Current" ? t("accounts.statusClean", "Current") :
                           acc.payment_status === "Grace Period" ? t("accounts.statusGrace", "Grace Period") :
                           acc.payment_status === "Overdue" ? t("accounts.statusOverdue", "Overdue") :
                           acc.payment_status === "Settled" ? t("accounts.statusSettled", "Settled") :
                           acc.payment_status === "Closed" ? t("accounts.statusClosed", "Closed") :
                           acc.payment_status || t("accounts.statusClean", "Current")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{t("accounts.currentBalance", "Outstanding")}:</span>
                        <span className="font-bold text-white">₹{acc.current_balance?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{isCard ? t("accounts.creditLimit", "Credit Limit:") : t("accounts.loanTradeline", "Principal Loan:")}</span>
                        <span className="font-bold text-slate-300">₹{acc.credit_limit?.toLocaleString("en-IN")}</span>
                      </div>
                      {acc.monthly_emi > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{t("accounts.monthlyPayment", "Monthly EMI")}:</span>
                          <span className="font-bold text-indigo-400">₹{acc.monthly_emi?.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      {acc.opened_date && (
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                          <span>{t("accounts.tenure", "Opened")}:</span>
                          <span>{acc.opened_date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Utilization Bar for Cards */}
                  {isCard && acc.credit_limit > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{t("accounts.utilization", "Card Utilization")}</span>
                        <span className={utilPercent <= 30 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {utilPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${utilPercent <= 30 ? "bg-emerald-400" : "bg-amber-400"}`}
                          style={{ width: `${Math.min(100, utilPercent)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-4">
            <p className="text-sm font-medium text-slate-300">{t("accounts.noAccounts", "No credit accounts added yet.")}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t("accounts.noAccountsDesc", "Add your existing credit cards or loans to calculate utilization, DTI, and credit age accurately.")}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  resetAccountForm();
                  setShowAddModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {t("accounts.addAccount", "Add Credit Account")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Timeline Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {t("accounts.timelineTitle", "CIBIL Payment History Timeline (35% Factor)")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("accounts.timelineSubtitle", "Banks report your on-time vs delayed monthly payments to TransUnion CIBIL")}
            </p>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {payments.map((p) => {
              const isGood = p.status === "On-Time";
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center ${
                    isGood
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  }`}
                >
                  <Calendar className="w-4 h-4 mb-1 text-slate-400" />
                  <div className="text-xs font-bold text-white">{p.month_year}</div>
                  <div className="text-[11px] font-semibold mt-1 flex items-center gap-1">
                    {isGood ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                    {p.status === "On-Time" ? t("accounts.onTime", "On-Time") : p.status === "Delayed" ? t("accounts.delayed", "Delayed") : t("accounts.missed", "Missed")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">₹{p.amount_paid?.toLocaleString("en-IN")}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-3">
            <p className="text-xs">{t("accounts.noPayments", "No payment history records recorded yet.")}</p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> {t("accounts.logFirstPayment", "Log First Payment")}
            </button>
          </div>
        )}
      </div>

      {/* Add or Edit Account Modal */}
      {(showAddModal || editingAccount) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingAccount ? t("accounts.editAccountModalTitle", "Edit Credit Account / Loan") : t("accounts.addAccountModalTitle", "Add Credit Account / Loan")}
            </h3>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("accounts.accountName", "Account Name")}</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Regalia Gold / SBI Car Loan"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <BankSelector
                    value={bankName}
                    onChange={setBankName}
                    label={t("accounts.bankName", "Bank / Lender")}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.accountType", "Account Type")}</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  >
                    <option value="credit_card">{t("accounts.creditCard", "Credit Card")}</option>
                    <option value="personal_loan">{t("accounts.personalLoan", "Personal Loan")}</option>
                    <option value="home_loan">{t("accounts.homeLoan", "Home Loan")}</option>
                    <option value="auto_loan">{t("accounts.autoLoan", "Auto Loan")}</option>
                    <option value="other">{t("accounts.loanTradeline", "Other / Tradeline")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.accountNumber", "Masked Number")}</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="XXXX-1234"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.paymentStatus", "Payment Status")}</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  >
                    <option value="Current">{t("accounts.statusClean", "Current (Clean)")}</option>
                    <option value="Grace Period">{t("accounts.statusGrace", "Grace Period")}</option>
                    <option value="Overdue">{t("accounts.statusOverdue", "Overdue (30+ DPD)")}</option>
                    <option value="Settled">{t("accounts.statusSettled", "Settled")}</option>
                    <option value="Closed">{t("accounts.statusClosed", "Closed")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.currentBalance", "Current Balance (₹)")}</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="25000"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.creditLimit", "Limit / Principal (₹)")}</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="100000"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.monthlyPayment", "Monthly EMI (₹)")}</label>
                  <input
                    type="number"
                    value={emi}
                    onChange={(e) => setEmi(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">{t("accounts.tenure", "Account Age (Months)")}</label>
                  <input
                    type="number"
                    value={accountAgeMonths}
                    onChange={(e) => setAccountAgeMonths(e.target.value)}
                    placeholder="e.g. 36 (3 years)"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("accounts.openedDateOptional", "Opened Date (Optional)")}</label>
                <input
                  type="text"
                  value={openedDate}
                  onChange={(e) => setOpenedDate(e.target.value)}
                  placeholder="e.g. 2023-01 or Jan 2023"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAccountForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  {savingAccount ? t("accounts.savingAccount", "Saving...") : editingAccount ? t("common.save", "Save Changes") : t("accounts.addAccount", "Add Account")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">{t("accounts.logPaymentModalTitle", "Log Monthly Payment")}</h3>

            <form onSubmit={handleCreatePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("accounts.billingMonth", "Billing Month")}</label>
                <input
                  type="text"
                  placeholder="e.g. Sep 2026"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("accounts.paymentAmount", "Amount Paid (₹)")}</label>
                <input
                  type="number"
                  placeholder="15000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">{t("accounts.paymentStatus", "Payment Status")}</label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
                >
                  <option value="On-Time">{t("accounts.onTime", "On-Time (Paid before due date)")}</option>
                  <option value="Delayed">{t("accounts.delayed", "Delayed / Grace Period")}</option>
                  <option value="Missed">{t("accounts.missed", "Missed Payment")}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  {savingPayment ? t("accounts.savingPayment", "Logging Payment...") : t("accounts.logPayment", "Log Payment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
