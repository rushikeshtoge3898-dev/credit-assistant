import { useState, useEffect } from "react";
import api, { creditAPI } from "../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Plus,
  Calendar,
  Award,
  ArrowUp,
  ArrowDown,
  Clock,
  History,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ScoreHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScore, setNewScore] = useState(730);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      let data = [];
      try {
        data = await creditAPI.getScoreHistory();
      } catch (err) {
        const fallbackRes = await api.get("/credit/score-history");
        data = fallbackRes.data;
      }
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch score history:", err);
      setError("Unable to load score trend history. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleAddScore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const scoreVal = parseInt(newScore);
      try {
        await creditAPI.addScoreHistory({ credit_score: scoreVal });
        await creditAPI.updateProfile({ credit_score: scoreVal });
      } catch (err) {
        await api.post("/credit/score-history", { credit_score: scoreVal });
        await api.put("/credit/profile", { credit_score: scoreVal });
      }
      setMessage(`Successfully recorded CIBIL snapshot of ${scoreVal}!`);
      fetchHistory();
    } catch (err) {
      console.error("Error adding score:", err);
      setError("Failed to log score snapshot. Ensure score is between 300 and 900.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format chart data with previous score and change
  const chartData = history.map((item, idx) => {
    const d = new Date(item.recorded_at);
    const dateStr = d.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
      day: "numeric",
    });
    const prevScore = idx > 0 ? history[idx - 1].credit_score : null;
    const delta = prevScore !== null ? item.credit_score - prevScore : 0;
    return {
      name: dateStr,
      score: item.credit_score,
      previousScore: prevScore,
      change: delta,
      category:
        item.credit_score >= 750
          ? "Prime / Excellent"
          : item.credit_score >= 700
          ? "Good"
          : item.credit_score >= 650
          ? "Fair"
          : "Needs Care",
      index: idx + 1,
    };
  });

  const currentScore = history.length > 0 ? history[history.length - 1].credit_score : 720;
  const previousScore = history.length >= 2 ? history[history.length - 2].credit_score : null;
  const recentChange = previousScore !== null ? currentScore - previousScore : 0;
  const initialScore = history.length > 0 ? history[0].credit_score : currentScore;
  const netDiff = currentScore - initialScore;

  // Custom professional tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="text-slate-400 font-medium">{label}</div>
          <div className="text-base font-black text-white flex items-center gap-2">
            <span>{data.score} CIBIL Score</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {data.category}
            </span>
          </div>
          {data.previousScore !== null && (
            <div className="text-slate-400 text-[11px] pt-1.5 border-t border-slate-800 flex items-center justify-between gap-3">
              <span>vs Previous ({data.previousScore}):</span>
              <span className={`font-bold ${data.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {data.change >= 0 ? `+${data.change}` : data.change} pts
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">Loading your CIBIL score trajectory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
            Credit Score History & Trend
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your CIBIL score trajectory and milestone achievements across snapshots.
          </p>
        </div>

        {/* Milestone Badges */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Net Change</div>
            <div className="text-sm font-bold flex items-center gap-1">
              {netDiff >= 0 ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUp className="w-4 h-4" /> +{netDiff} pts
                </span>
              ) : (
                <span className="text-rose-400 flex items-center">
                  <ArrowDown className="w-4 h-4" /> {netDiff} pts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Score Snapshot KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Current Score</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
            <span>{currentScore}</span>
            <span className="text-xs text-slate-400 font-mono">/ 900</span>
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">
            {currentScore >= 750 ? "Prime / Excellent" : currentScore >= 700 ? "Good" : "Needs Care"}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Previous Snapshot Score</div>
          <div className="text-2xl font-black text-slate-300 mt-1">
            {previousScore !== null ? previousScore : "Baseline"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {history.length >= 2 ? "Last recorded check" : "First logged snapshot"}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">Recent Change</div>
          <div className="text-2xl font-black mt-1 flex items-center gap-1">
            {previousScore !== null ? (
              recentChange >= 0 ? (
                <span className="text-emerald-400 flex items-center">
                  <ArrowUp className="w-5 h-5" /> +{recentChange} pts
                </span>
              ) : (
                <span className="text-rose-400 flex items-center">
                  <ArrowDown className="w-5 h-5" /> {recentChange} pts
                </span>
              )
            ) : (
              <span className="text-slate-400 text-lg font-bold">Stable</span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            vs prior snapshot
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs text-slate-400">CIBIL Prime Target</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            750+
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {currentScore >= 750 ? "Target Achieved!" : `${750 - currentScore} pts needed`}
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Score Progression Curve</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              CIBIL benchmark line set at 750 (Prime Approval Threshold)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-slate-300">Your Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400" />
              <span className="text-slate-400">750 Benchmark</span>
            </div>
          </div>
        </div>

        <div className="w-full h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[300, 900]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={750}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: "750 Prime", fill: "#10b981", fontSize: 10, position: "right" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#6366f1", stroke: "#0f172a", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#a855f7" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
              <History className="w-8 h-8 text-slate-600" />
              <p>No score snapshots logged yet.</p>
              <p className="text-[11px] text-slate-600">Enter your latest score below to begin building your trend curve.</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Log New Score + Table of History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Log Score Snapshot */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            Log New CIBIL Score
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Checked your latest report from CIBIL, OneScore, or your bank? Add it here.
          </p>

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddScore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                CIBIL Score (300 - 900)
              </label>
              <input
                type="number"
                min="300"
                max="900"
                value={newScore}
                onChange={(e) => setNewScore(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Logging snapshot..." : "Save Score Snapshot"}
            </button>
          </form>
        </div>

        {/* Table of History */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-950/50">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Snapshot Timeline ({history.length})
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Log of historical CIBIL data points and trajectory milestones.
          </p>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 rounded-l-lg">Snapshot Date</th>
                    <th className="py-2.5 px-3">CIBIL Score</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.slice().reverse().map((item, idx) => {
                    const originalIdx = history.length - 1 - idx;
                    const prev = originalIdx > 0 ? history[originalIdx - 1].credit_score : null;
                    const delta = prev !== null ? item.credit_score - prev : null;
                    const d = new Date(item.recorded_at);
                    const formattedDate = d.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">{formattedDate}</td>
                        <td className="py-3 px-3 font-bold text-white font-mono">{item.credit_score}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.credit_score >= 750
                              ? "bg-emerald-500/10 text-emerald-400"
                              : item.credit_score >= 700
                              ? "bg-indigo-500/10 text-indigo-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {item.credit_score >= 750 ? "Prime" : item.credit_score >= 700 ? "Good" : "Fair"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {delta !== null ? (
                            <span className={`font-bold font-mono ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {delta >= 0 ? `+${delta}` : delta} pts
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">Baseline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No historical entries to show.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
