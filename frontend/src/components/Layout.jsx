import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
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
  X,
  Languages,
  UserCheck,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, isGuest, logout } = useAuth();
  const { currentLanguage, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { to: "/score-history", label: t("nav.scoreHistory", "Score History"), icon: TrendingUp },
    { to: "/accounts", label: t("nav.accounts", "Credit Accounts"), icon: CreditCard },
    { to: "/goals", label: t("nav.goals", "Goals & Simulator"), icon: Target },
    { to: "/ai-assistant", label: t("nav.aiAdvisor", "AI Advisor"), icon: Sparkles, badge: "AI" },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 shrink-0">
              <Link to="/dashboard" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Credit Assistant
                  </span>
                  <span className="hidden lg:inline-block text-[11px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CIBIL India
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Side: Language Switcher + User Profile / Guest Badge */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Language Switcher */}
              <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-xl p-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      currentLanguage === lang.code
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>

              {/* Guest Mode Indicator or User Details */}
              {isGuest ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-amber-300">
                    {t("nav.guestBadge", "Guest Demo")}
                  </span>
                  <Link
                    to="/register"
                    className="ml-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-0.5 rounded-lg transition-all"
                  >
                    {t("guest.signInToSave", "Sign In")}
                  </Link>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user?.name || "User"}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {user?.email}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                title={t("nav.logout", "Logout")}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button & Mobile Language Quick Toggle */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5 text-xs">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-1.5 py-0.5 text-[11px] font-medium rounded transition-all ${
                      currentLanguage === lang.code
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2">
            {isGuest && (
              <div className="p-3 mb-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <span className="font-bold">{t("nav.guestBadge", "Guest Demo Mode")}</span>
                </div>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]"
                >
                  {t("common.save", "Save Data")}
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-indigo-600 text-white font-semibold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`
                    }
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-3 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold rounded bg-indigo-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200">
                  {isGuest ? t("nav.guestBadge", "Guest Mode") : user?.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {isGuest ? "demo@creditassistant.local" : user?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> {t("nav.logout", "Logout")}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Guest Mode Persistent Top Banner (if guest) */}
      {isGuest && (
        <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/50 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-200 uppercase tracking-wide">
                Demo
              </span>
              <span>
                {t("guest.bannerDesc", "You are exploring Credit Assistant with simulated Indian CIBIL profile tradelines. No real account is stored.")}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/register"
                className="inline-flex items-center gap-1 font-semibold text-amber-200 hover:text-white underline underline-offset-2 transition-colors"
              >
                <span>{t("guest.signInToSave", "Sign In to Track Real Data")}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Credit Assistant &copy; {new Date().getFullYear()} &bull; Built for India CIBIL Credit Health
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
            <span>Score Range: 300 - 900</span>
            <span>&bull;</span>
            <span>RBI / CIBIL Compliant Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
