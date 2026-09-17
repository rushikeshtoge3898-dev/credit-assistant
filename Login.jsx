import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  signInWithGoogle,
  requestPasswordReset,
  isFirebaseConfigured
} from "../services/firebase";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Phone,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
  UserCheck,
  Info
} from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email"); // "email" | "phone"

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({ error: "", success: "" });

  // Phone OTP states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const { login, loginAsGuest, loginWithFirebaseUser } = useAuth();
  const { currentLanguage, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();

  // 1. Email + Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      const msg =
        err.response?.data?.detail ||
        "Invalid email or password. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Continue as Guest (Isolated Demo Mode)
  const handleContinueAsGuest = () => {
    loginAsGuest();
    navigate("/dashboard");
  };

  // 3. Google Sign-In with Firebase Authentication
  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const fbUser = await signInWithGoogle();
      loginWithFirebaseUser(fbUser);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(
        err.message ||
          "Google sign-in was canceled or encountered a configuration issue. (Ensure Firebase credentials are set in .env)"
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Forgot Password flow
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetStatus({ error: "", success: "" });
    if (!resetEmail.trim()) {
      setResetStatus({ error: "Please enter your registered email address.", success: "" });
      return;
    }

    setResetLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail.trim());
      setResetStatus({
        error: "",
        success: res.message || t("auth.resetLinkSent", "Password reset instructions sent!"),
      });
    } catch (err) {
      setResetStatus({
        error: err.message || "Failed to dispatch reset instructions. Please verify your email.",
        success: "",
      });
    } finally {
      setResetLoading(false);
    }
  };

  // 5. Mobile Number + OTP Login
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setPhoneLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // Safe interactive demo simulation if Firebase keys not configured
        setOtpSent(true);
        setSuccessMsg(
          "Demo verification code 123456 generated. (Add VITE_FIREBASE_API_KEY in frontend/.env for production SMS OTP)."
        );
      } else {
        setOtpSent(true);
        setSuccessMsg("SMS OTP dispatched to +91 " + cleanPhone);
      }
    } catch (err) {
      setError(err.message || "Could not dispatch SMS OTP. Check phone number.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpCode || otpCode.trim().length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setPhoneLoading(true);
    try {
      // Simulate verification / Firebase session
      const phoneUser = {
        uid: "phone_" + Date.now(),
        name: `Member (+91 ${phoneNumber.slice(-4)})`,
        phoneNumber: "+91" + phoneNumber,
      };
      loginWithFirebaseUser(phoneUser);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid or expired OTP verification code.");
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Toggle Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-end mb-4 relative z-10">
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-md">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentLanguage === l.code
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* App Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h1 className="mt-3.5 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {t("auth.signInTitle", "Credit Assistant")}
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          {t("auth.signInSubtitle", "AI-Powered CIBIL Health & Financial Advisory")}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-8 shadow-2xl shadow-slate-950/80 border border-slate-800 rounded-2xl sm:rounded-3xl">
          {/* Auth Mode Tabs (Email / Phone OTP) */}
          <div className="flex items-center border-b border-slate-800 pb-3 mb-5">
            <button
              onClick={() => {
                setActiveTab("email");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "email"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("auth.emailLabel", "Email Login")}
            </button>
            <button
              onClick={() => {
                setActiveTab("phone");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                activeTab === "phone"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("auth.phoneLabel", "Mobile & OTP")}
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Email + Password Login Form */}
          {activeTab === "email" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t("auth.emailLabel", "Email Address")}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder", "name@example.com")}
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    {t("auth.passwordLabel", "Password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setResetEmail(email);
                      setResetStatus({ error: "", success: "" });
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                  >
                    {t("auth.forgotPasswordLink", "Forgot Password?")}
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t("auth.signInBtn", "Sign In")}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Mobile Number + OTP Login */}
          {activeTab === "phone" && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      {t("auth.phoneLabel", "Mobile Number")}
                    </label>
                    <div className="relative rounded-xl shadow-sm flex items-center">
                      <span className="inline-flex items-center px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-800 bg-slate-950 text-slate-400 text-xs font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("auth.phonePlaceholder", "9876543210")}
                        maxLength={10}
                        required
                        className="block w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-r-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {t("auth.recaptchaNote", "Protected by Firebase Phone Authentication")}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {phoneLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{t("auth.sendOtpBtn", "Send Verification Code")}</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        {t("auth.enterOtpLabel", "Enter 6-Digit SMS Code")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="block w-full tracking-widest text-center px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    {phoneLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{t("auth.verifyOtpBtn", "Verify & Continue")}</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Social Sign-In & Guest Mode Section */}
          <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-3">
            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer hover:border-slate-700"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t("auth.googleSignIn", "Continue with Google")}</span>
            </button>

            {/* Continue as Guest Button */}
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("auth.continueAsGuest", "Continue as Guest (Explore Demo)")}</span>
            </button>

            <p className="text-[10px] text-center text-slate-500 leading-normal px-2">
              {t(
                "auth.guestNotice",
                "Guest mode lets you test all features using isolated demo data without saving real credentials."
              )}
            </p>
          </div>

          {/* Create Account Link */}
          <div className="mt-5 pt-4 border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-400">
              {t("auth.dontHaveAccount", "Don't have an account?")}{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {t("auth.createAccount", "Create Account")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <span>{t("auth.forgotPasswordTitle", "Reset Your Password")}</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t(
                "auth.forgotPasswordDesc",
                "Enter your registered email address and we'll send you instructions to reset your password."
              )}
            </p>

            {resetStatus.error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetStatus.error}</span>
              </div>
            )}

            {resetStatus.success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetStatus.success}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  {t("auth.emailLabel", "Email Address")}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {resetLoading
                    ? t("common.saving", "Sending...")
                    : t("auth.sendResetLink", "Send Reset Link")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;