import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Target,
  Sparkles,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/score-history", label: "Score History", icon: TrendingUp },
    { to: "/accounts", label: "Credit Accounts", icon: CreditCard },
    { to: "/goals", label: "Goals & Simulator", icon: Target },
    { to: "/ai-assistant", label: "AI Advisor", icon: Sparkles, badge: "AI" },
    { to: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Credit Assistant
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CIBIL India
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-1.5 px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200">{user?.name || "User"}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg text-base font-medium ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">{user?.name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4 mr-1.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Credit Assistant &copy; {new Date().getFullYear()} &bull; Built for India CIBIL Credit Health
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Score Range: 300 - 900</span>
            <span>&bull;</span>
            <span>RBI / CIBIL Compliant Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
