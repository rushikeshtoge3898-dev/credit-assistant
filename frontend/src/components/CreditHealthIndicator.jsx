import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function CreditHealthIndicator({ profile, analytics }) {
  const utilization = analytics?.credit_utilization || 0;
  const missedPayments = profile?.missed_payments ?? 0;
  const dti = analytics?.debt_to_income || 0;
  const activeLoans = profile?.active_loans || 0;

  const factors = [
    {
      name: "Payment History",
      weight: "35% Impact (Highest)",
      status: missedPayments === 0 ? "Excellent" : missedPayments <= 1 ? "Attention" : "High Risk",
      statusColor: missedPayments === 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: missedPayments === 0 
        ? "Zero missed EMIs or card payments reported." 
        : `${missedPayments} overdue/delayed payment(s) detected.`,
      tip: "Always pay before the due date. A single 30+ DPD can drop your CIBIL by 50+ points.",
      icon: missedPayments === 0 ? CheckCircle2 : AlertCircle
    },
    {
      name: "Credit Utilization Ratio (CUR)",
      weight: "30% Impact (Critical)",
      status: utilization <= 30 ? "Optimal (<30%)" : utilization <= 50 ? "Moderate" : "High (>50%)",
      statusColor: utilization <= 30 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : utilization <= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: `Current utilization is ${utilization}%. Recommended limit is under 30%.`,
      tip: "Pay credit card bills twice a month or request a limit upgrade to lower utilization instantly.",
      icon: utilization <= 30 ? CheckCircle2 : AlertTriangle
    },
    {
      name: "Credit Mix & Active Credit",
      weight: "15% Impact (Moderate)",
      status: activeLoans > 0 ? "Balanced" : "Basic",
      statusColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: `${activeLoans} active loan(s) on file alongside revolving credit cards.`,
      tip: "A healthy balance of secured loans (e.g. Home Loan) and unsecured credit builds credibility.",
      icon: CheckCircle2
    },
    {
      name: "Debt-to-Income (DTI)",
      weight: "20% Impact (Significant)",
      status: dti <= 35 ? "Low Risk" : dti <= 50 ? "Moderate" : "Strained",
      statusColor: dti <= 35 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : dti <= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: `Annual Debt obligations equal ${dti}% of gross income.`,
      tip: "Banks favor borrowers whose total monthly loan EMIs take less than 40-50% of monthly salary.",
      icon: dti <= 35 ? CheckCircle2 : AlertTriangle
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>CIBIL Credit Health Pillars</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CIBIL Factors
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            How Credit Bureaus in India calculate your TransUnion CIBIL score
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {factors.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.name}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-200">{f.name}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${f.statusColor}`}>
                    {f.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-indigo-400/90 mb-2">{f.weight}</div>
                <p className="text-xs text-slate-300 mb-2">{f.description}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 flex items-start gap-1.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>{f.tip}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
