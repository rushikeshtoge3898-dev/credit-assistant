import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Loading your Credit Assistant...</p>
      </div>
    );
  }

  // Strict real authenticated check: must have user and token
  const hasAuthToken = token || localStorage.getItem("token");
  if (!user || !hasAuthToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
