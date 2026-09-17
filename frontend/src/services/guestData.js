// Dedicated in-memory & local-storage demo data provider for Guest Mode.
// Strictly isolated from real user database records and JWT sessions.

const DEFAULT_PROFILE = {
  credit_score: 725,
  monthly_income: 75000,
  total_debt: 180000,
  credit_limit: 120000,
  credit_card_balance: 32000,
  active_loans: 2,
  missed_payments: 0,
  financial_goal: "Reach 780+ CIBIL score for Home Loan eligibility",
};

const DEFAULT_ACCOUNTS = [
  {
    id: 101,
    account_name: "HDFC Millennia Credit Card",
    bank_name: "HDFC Bank",
    account_type: "credit_card",
    account_number_masked: "XXXX-4819",
    current_balance: 22000,
    credit_limit: 80000,
    monthly_emi: 0,
    payment_status: "Current",
    opened_date: "Aug 2023",
    account_age_months: 36,
  },
  {
    id: 102,
    account_name: "ICICI Amazon Pay Card",
    bank_name: "ICICI Bank",
    account_type: "credit_card",
    account_number_masked: "XXXX-9281",
    current_balance: 10000,
    credit_limit: 40000,
    monthly_emi: 0,
    payment_status: "Current",
    opened_date: "Jan 2024",
    account_age_months: 32,
  },
  {
    id: 103,
    account_name: "SBI Car Loan",
    bank_name: "State Bank of India",
    account_type: "auto_loan",
    account_number_masked: "XXXX-1102",
    current_balance: 148000,
    credit_limit: 350000,
    monthly_emi: 8500,
    payment_status: "Current",
    opened_date: "Mar 2024",
    account_age_months: 30,
  },
];

const DEFAULT_PAYMENTS = [
  { id: 201, month_year: "Sep 2026", amount_paid: 14500, status: "On-Time" },
  { id: 202, month_year: "Aug 2026", amount_paid: 16200, status: "On-Time" },
  { id: 203, month_year: "Jul 2026", amount_paid: 12000, status: "On-Time" },
  { id: 204, month_year: "Jun 2026", amount_paid: 15400, status: "On-Time" },
];

const DEFAULT_SCORE_HISTORY = [
  { id: 301, credit_score: 708, recorded_at: "2026-03-15T10:00:00Z" },
  { id: 302, credit_score: 716, recorded_at: "2026-06-20T10:00:00Z" },
  { id: 303, credit_score: 725, recorded_at: "2026-09-01T10:00:00Z" },
];

const DEFAULT_GOALS = [
  {
    id: 401,
    target_score: 780,
    target_date: "Dec 2026",
    action_plan: "Keep card utilization under 20% and pay off personal vehicle dues",
    status: "in_progress",
  },
];

const DEFAULT_RECOMMENDATIONS = [
  {
    id: 501,
    title: "Lower Revolving Card Utilization Below 25%",
    description: "Pay down credit card balance before statement closing to boost points into Prime tier.",
    priority: "High",
    category: "Utilization",
    is_completed: false,
  },
  {
    id: 502,
    title: "Maintain 100% On-Time Record",
    description: "Auto-debit is active. Continue flawless payment streak across HDFC and SBI accounts.",
    priority: "Medium",
    category: "Payment History",
    is_completed: false,
  },
  {
    id: 503,
    title: "Preserve Oldest Credit Tradeline",
    description: "Avoid closing your oldest active credit card (HDFC Millennia) to retain 36-month credit age.",
    priority: "Low",
    category: "Credit Mix",
    is_completed: true,
  },
];

export const guestData = {
  getProfile: () => {
    const saved = localStorage.getItem("guest_demo_profile");
    return saved ? JSON.parse(saved) : { ...DEFAULT_PROFILE };
  },

  updateProfile: (data) => {
    const current = guestData.getProfile();
    const updated = { ...current, ...data };
    localStorage.setItem("guest_demo_profile", JSON.stringify(updated));
    return updated;
  },

  getAccounts: () => {
    const saved = localStorage.getItem("guest_demo_accounts");
    return saved ? JSON.parse(saved) : [...DEFAULT_ACCOUNTS];
  },

  saveAccount: (account) => {
    const list = guestData.getAccounts();
    let updated;
    if (account.id) {
      updated = list.map((a) => (a.id === account.id ? { ...a, ...account } : a));
    } else {
      const newAcc = { ...account, id: Date.now() };
      updated = [newAcc, ...list];
    }
    localStorage.setItem("guest_demo_accounts", JSON.stringify(updated));
    return updated;
  },

  deleteAccount: (id) => {
    const list = guestData.getAccounts();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem("guest_demo_accounts", JSON.stringify(updated));
    return updated;
  },

  getPayments: () => {
    const saved = localStorage.getItem("guest_demo_payments");
    return saved ? JSON.parse(saved) : [...DEFAULT_PAYMENTS];
  },

  addPayment: (payment) => {
    const list = guestData.getPayments();
    const newPay = { ...payment, id: Date.now() };
    const updated = [newPay, ...list];
    localStorage.setItem("guest_demo_payments", JSON.stringify(updated));
    return newPay;
  },

  getScoreHistory: () => {
    const saved = localStorage.getItem("guest_demo_score_history");
    return saved ? JSON.parse(saved) : [...DEFAULT_SCORE_HISTORY];
  },

  addScoreHistory: (score) => {
    const list = guestData.getScoreHistory();
    const newRecord = {
      id: Date.now(),
      credit_score: score,
      recorded_at: new Date().toISOString(),
    };
    const updated = [...list, newRecord];
    localStorage.setItem("guest_demo_score_history", JSON.stringify(updated));
    guestData.updateProfile({ credit_score: score });
    return newRecord;
  },

  getGoals: () => {
    const saved = localStorage.getItem("guest_demo_goals");
    return saved ? JSON.parse(saved) : [...DEFAULT_GOALS];
  },

  saveGoal: (goal) => {
    const list = guestData.getGoals();
    let updated;
    if (goal.id) {
      updated = list.map((g) => (g.id === goal.id ? { ...g, ...goal } : g));
    } else {
      const newGoal = { ...goal, id: Date.now(), status: "in_progress" };
      updated = [newGoal, ...list];
    }
    localStorage.setItem("guest_demo_goals", JSON.stringify(updated));
    return updated;
  },

  deleteGoal: (id) => {
    const list = guestData.getGoals();
    const updated = list.filter((g) => g.id !== id);
    localStorage.setItem("guest_demo_goals", JSON.stringify(updated));
    return updated;
  },

  getRecommendations: () => {
    const saved = localStorage.getItem("guest_demo_recs");
    return saved ? JSON.parse(saved) : [...DEFAULT_RECOMMENDATIONS];
  },

  toggleRecommendation: (id, isCompleted) => {
    const list = guestData.getRecommendations();
    const updated = list.map((r) =>
      r.id === id ? { ...r, is_completed: isCompleted } : r
    );
    localStorage.setItem("guest_demo_recs", JSON.stringify(updated));
    return updated;
  },

  resetGuestData: () => {
    localStorage.removeItem("guest_demo_profile");
    localStorage.removeItem("guest_demo_accounts");
    localStorage.removeItem("guest_demo_payments");
    localStorage.removeItem("guest_demo_score_history");
    localStorage.removeItem("guest_demo_goals");
    localStorage.removeItem("guest_demo_recs");
  },
};
