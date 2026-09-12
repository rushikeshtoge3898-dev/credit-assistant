export default function CibilScoreGauge({ score = 720 }) {
  const minScore = 300;
  const maxScore = 900;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score || 700));

  // Percentage from 0 to 100 for gauge representation
  const percentage = ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  // Determine CIBIL Band
  let tier = "Good";
  let color = "text-emerald-400";
  let bgColor = "bg-emerald-500";
  let gradient = "from-emerald-500 to-teal-400";
  let statusText = "You have a prime credit profile. High approval probability for loans and cards.";

  if (clampedScore >= 750) {
    tier = "Excellent";
    color = "text-emerald-400";
    bgColor = "bg-emerald-500";
    gradient = "from-emerald-400 to-emerald-600";
    statusText = "Excellent! You qualify for the best interest rates and premium credit cards in India.";
  } else if (clampedScore >= 700) {
    tier = "Good";
    color = "text-teal-400";
    bgColor = "bg-teal-500";
    gradient = "from-teal-400 to-emerald-500";
    statusText = "Good! Lenders view you favorably with minimal risk of rejection.";
  } else if (clampedScore >= 650) {
    tier = "Fair";
    color = "text-amber-400";
    bgColor = "bg-amber-500";
    gradient = "from-amber-400 to-amber-600";
    statusText = "Fair. You may face moderate interest rates or lower credit limits.";
  } else {
    tier = "Needs Attention";
    color = "text-rose-400";
    bgColor = "bg-rose-500";
    gradient = "from-rose-500 to-rose-700";
    statusText = "High credit risk. Focus on clearing dues and keeping card balances low.";
  }

  // Calculate rotation for dial needle: 180 degrees total (-90 to +90)
  const rotation = -90 + (percentage / 100) * 180;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between relative overflow-hidden shadow-xl shadow-slate-950/50">
      <div className="w-full flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>CIBIL TransUnion Scale</span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">300 - 900</span>
      </div>

      {/* SVG Semi-Circle Speedometer Arc */}
      <div className="relative w-64 h-36 mt-4 flex items-end justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Colored Segments Guide in background */}
          {/* Poor Segment 300-649 (0% to ~58%) */}
          <path
            d="M 20 100 A 80 80 0 0 1 60 40"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="4"
            strokeDasharray="2 3"
            opacity="0.4"
          />
          {/* Fair Segment 650-699 */}
          <path
            d="M 60 40 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeDasharray="2 3"
            opacity="0.4"
          />
          {/* Good Segment 700-749 */}
          <path
            d="M 100 20 A 80 80 0 0 1 140 40"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="4"
            strokeDasharray="2 3"
            opacity="0.4"
          />
          {/* Excellent Segment 750-900 */}
          <path
            d="M 140 40 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeDasharray="2 3"
            opacity="0.4"
          />

          {/* Active Filled Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset={251.3 - (percentage / 100) * 251.3}
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Needle / Pointer */}
          <g transform={`translate(100, 100) rotate(${rotation})`}>
            <polygon points="-3,0 3,0 0,-70" fill="#f8fafc" />
            <circle cx="0" cy="0" r="7" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
          </g>
        </svg>

        {/* Min/Max Labels */}
        <div className="absolute left-2 -bottom-2 text-[10px] text-slate-400 font-mono">300</div>
        <div className="absolute right-2 -bottom-2 text-[10px] text-slate-400 font-mono">900</div>
      </div>

      {/* Numerical Score Display */}
      <div className="mt-4 text-center">
        <div className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>{clampedScore}</span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} bg-slate-800 border border-slate-700`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bgColor} mr-1.5 animate-pulse`} />
            {tier}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
          {statusText}
        </p>
      </div>

      {/* Target marker info */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-xs text-slate-400">
        <span>Golden CIBIL Target:</span>
        <span className="font-semibold text-emerald-400">750+ (Prime)</span>
      </div>
    </div>
  );
}
