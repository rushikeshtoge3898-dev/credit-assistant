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
  Mail,
  HelpCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'help' | 'privacy' | 'terms' | 'disclaimer' | null

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
      <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2 lg:gap-3 xl:gap-4 min-w-0">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
              <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 xl:w-6 xl:h-6 text-white" />
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base xl:text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                    Credit Assistant
                  </span>
                  <span className="hidden 2xl:inline-block text-[10px] 2xl:text-[11px] font-semibold px-1.5 2xl:px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    CIBIL India
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-1.5 min-w-0 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-1.5 py-1.5 xl:px-2 2xl:px-2.5 xl:py-2 rounded-lg text-[11px] xl:text-xs 2xl:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 mr-1 xl:mr-1.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1 xl:px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Desktop Right Side: Help + User Details + Logout */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 min-w-0 shrink-0">
              {/* Help & Support Quick Button */}
              <button
                onClick={() => setActiveModal("help")}
                className="flex items-center gap-1.5 px-2 py-1.5 2xl:px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                title={t("layout.helpAndSupport", "Help & Support")}
              >
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="hidden 2xl:inline">{t("layout.help", "Help")}</span>
              </button>

              {/* User Details - shrinks gracefully without pushing Logout offscreen */}
              <div className="text-right min-w-0 max-w-[110px] xl:max-w-[140px] 2xl:max-w-[180px] shrink overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {user?.name || "Member"}
                </div>
                <div className="hidden 2xl:block text-[10px] text-slate-400 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {user?.email}
                </div>
              </div>

              {/* Logout Button - Always visible and clickable */}
              <button
                onClick={handleLogout}
                title={t("nav.logout", "Logout")}
                aria-label={t("nav.logout", "Logout")}
                className="p-1.5 xl:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile / Tablet Header Controls (screens < lg, e.g. 768px and 390px) */}
            <div className="lg:hidden flex items-center gap-2 shrink-0">
              {/* User Details on medium/tablet screens */}
              <div className="hidden sm:block text-right min-w-0 max-w-[120px] shrink overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {user?.name || "Member"}
                </div>
                <div className="text-[10px] text-slate-400 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                  {user?.email}
                </div>
              </div>

              {/* Logout Button directly on top bar */}
              <button
                onClick={handleLogout}
                title={t("nav.logout", "Logout")}
                aria-label={t("nav.logout", "Logout")}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-5 space-y-2">
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

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("help");
                }}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 w-full text-left cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 mr-3 shrink-0 text-indigo-400" />
                <span>{t("layout.helpAndSupport", "Help & Support")}</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200">{user?.name || "Member"}</div>
                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{user?.email}</div>
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span>Credit Assistant &copy; {new Date().getFullYear()}</span>
            <span className="mx-2">&bull;</span>
            <span className="text-slate-400">
              {t("layout.conciseDisclaimer", "Credit Assistant is not a bank, lender, credit bureau, or official CIBIL service.")}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <button
              onClick={() => setActiveModal("help")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t("layout.helpAndSupport", "Help & Support")}
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveModal("privacy")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t("layout.privacyPolicy", "Privacy Policy")}
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveModal("terms")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t("layout.termsOfUse", "Terms of Use")}
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveModal("disclaimer")}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {t("layout.disclaimer", "Disclaimer")}
            </button>
          </div>
        </div>
      </footer>

      {/* Informational Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              aria-label={t("common.close", "Close")}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Help & Support Modal */}
            {activeModal === "help" && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">{t("layout.helpAndSupport", "Help & Support")}</h2>
                </div>
                <div className="space-y-4 text-slate-300 text-sm">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{t("layout.support", "Support")}</div>
                    <div className="text-base font-semibold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                      <a
                        href="mailto:rushikeshtoge31@gmail.com"
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                      >
                        {t("layout.supportEmail", "support@creditassistant.com")}
                      </a>
                    </div>
                    <p className="text-xs text-slate-400">
                      {t("layout.helpDesc", "Click the email above to compose an inquiry. We assist with account access, credit health insights, and platform questions.")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{t("layout.createdBy", "Created by")}</div>
                    <div className="text-sm font-semibold text-white">{t("layout.creatorName", "Rushikesh Toge")}</div>
                    <p className="text-xs text-slate-400">
                      {t("layout.creatorBio", "Designed and engineered for Indian credit health monitoring and AI financial advisory.")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Policy Modal */}
            {activeModal === "privacy" && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">{t("layout.privacyPolicy", "Privacy Policy")}</h2>
                </div>
                <div className="space-y-3 text-slate-300 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                  <p>{t("layout.privacy1")}</p>
                  <p>{t("layout.privacy2")}</p>
                  <p>{t("layout.privacy3")}</p>
                  <p>{t("layout.privacy4")}</p>
                </div>
              </div>
            )}

            {/* Terms of Use Modal */}
            {activeModal === "terms" && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <FileText className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">{t("layout.termsOfUse", "Terms of Use")}</h2>
                </div>
                <div className="space-y-3 text-slate-300 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                  <p>{t("layout.terms1")}</p>
                  <p>{t("layout.terms2")}</p>
                  <p>{t("layout.terms3")}</p>
                </div>
              </div>
            )}

            {/* Disclaimer Modal */}
            {activeModal === "disclaimer" && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">{t("layout.officialDisclaimer", "Official Disclaimer")}</h2>
                </div>
                <div className="space-y-3 text-slate-300 text-xs leading-relaxed">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                    {t("layout.conciseDisclaimer", "Credit Assistant is not a bank, lender, credit bureau, or official CIBIL service.")}
                  </div>
                  <p>{t("layout.disclaimerDetail")}</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
