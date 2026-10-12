import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
  Building2,
  BadgeCheck,
  HelpCircle,
  Truck,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { User, UserRole } from '../types/auth';
import { loginUser, registerUser, getRegisteredUsers } from '../utils/auth';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state (empty until user types or clicks a profile)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Cash Operations Director');
  const [regDepartment, setRegDepartment] = useState('Central Cash Management Unit (CCMU)');
  const [regBadgeId, setRegBadgeId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Password reset helper modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your corporate email address or badge ID.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your authentication password.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      const res = loginUser(loginIdentifier, loginPassword);
      setIsLoggingIn(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setLoginError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 400);
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Full Name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('A valid corporate email address is required.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError('Password must be at least 6 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedToTerms) {
      setRegError('You must acknowledge adherence to Banking Secrecy and Security guidelines.');
      return;
    }

    setIsRegistering(true);
    setTimeout(() => {
      const res = registerUser({
        name: regName,
        email: regEmail,
        role: regRole,
        department: regDepartment,
        badgeId: regBadgeId,
        password: regPassword,
      });
      setIsRegistering(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setRegError(res.error || 'Registration failed.');
      }
    }, 450);
  };

  // Quick Demo Fast-Fill
  const handleFastFill = (email: string, pass: string) => {
    setLoginIdentifier(email);
    setLoginPassword(pass);
    setLoginError(null);
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getRegisteredUsers();
    const found = users.find((u) => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (found) {
      setForgotSuccessMessage(
        `Temporary access code generated for ${found.name}. For demo convenience, password is: "${found.passwordHash}"`
      );
    } else {
      setForgotSuccessMessage(
        `If ${forgotEmail} is enrolled in the corporate directory, recovery instructions have been dispatched.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Enterprise Security Banner */}
      <div className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
            Core Gateway Online
          </span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-slate-400">
            TLS 1.3 Encrypted • ISO-8583 Banking Switch
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-blue-400" /> AES-256 Bit
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400 hidden md:inline">256 Terminals Monitored</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-5xl items-center">
          
          {/* Left Column: Branding, App Name, Logo & Platform Highlights */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            
            {/* Logo Badge & Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-blue-500/40 shadow-xl shadow-blue-900/20 shrink-0 ring-2 ring-blue-500/20 group">
                  <img
                    src="/src/assets/images/atm_app_logo_1791799184731.jpg"
                    alt="ATM Cash Forecasting Logo"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
                    <Sparkles className="w-3 h-3 text-blue-400" /> Enterprise Edition
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    ATM Cash Forecasting
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                    Decision-Support & CIT Dispatch System
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Centralized predictive liquidity intelligence, cassette replenishment optimization, and armored vehicle transit dispatch for 256 network terminals.
              </p>
            </div>

            {/* Key Platform Value Cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-200">ML Forecast</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">99.4%</p>
                <p className="text-[11px] text-slate-400">Demand accuracy</p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-200">CIT Manifests</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">8 Routes</p>
                <p className="text-[11px] text-slate-400">Armored dispatch</p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-200">Float Optimized</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">৳ 1.28 B</p>
                <p className="text-[11px] text-slate-400">Capital monitored</p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Server className="w-4 h-4" />
                  <span className="text-xs font-semibold text-slate-200">Live Switch</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">256 Nodes</p>
                <p className="text-[11px] text-slate-400">Zero cash-out SLA</p>
              </div>
            </div>

            {/* Compliance Badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">Regulated Banking Infrastructure</span>
                <p className="text-[11px] text-slate-400">
                  Role-based access control (RBAC), multi-custody dual authorization, and tamper-evident audit trail logging.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Authentication Card (Login & Register) */}
          <div className="lg:col-span-7">
            <div className="bg-[#111827]/90 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Terminal Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegError(null);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Register Operator</span>
                </button>
              </div>

              {/* CARD BODY */}
              <div className="p-6 sm:p-8">
                {/* LOGIN TAB */}
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        Sign In to Cash Command Console
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Authenticate with your authorized corporate banking credentials.
                      </p>
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">Authentication Error</p>
                          <p className="text-[11px] text-rose-200/90">{loginError}</p>
                        </div>
                      </div>
                    )}

                    {/* Email / Badge ID Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Work Email or Badge ID</span>
                        <span className="text-[11px] text-slate-500 font-normal">e.g. corporate.email@bank.com</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="corporate.email@bank.com or Badge ID"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">
                          Access Key / Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(true)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                        <input
                          type="checkbox"
                          checked={rememberTerminal}
                          onChange={(e) => setRememberTerminal(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Remember authorized terminal session</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Authenticating Terminal Session...</span>
                        </>
                      ) : (
                        <>
                          <span>Access ATM Forecasting System</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Quick One-Click Fast-Fill Profiles */}
                    <div className="pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                          Pre-Authorized Enterprise Profiles
                        </span>
                        <span className="text-[10px] text-slate-500">Click to autofill</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleFastFill('director3378@bank.com', 'admin123')}
                          className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 transition-all text-xs cursor-pointer group"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between gap-1">
                            <span className="truncate">director3378@bank.com</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono shrink-0">
                              DIRECTOR
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFastFill('operations@bank.com', 'CashOps2026!')}
                          className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition-all text-xs cursor-pointer group"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-emerald-400 flex items-center justify-between gap-1">
                            <span className="truncate">operations@bank.com</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono shrink-0">
                              OPERATIONS
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFastFill('cit.logistics@bank.com', 'CitRoute2026!')}
                          className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-xs cursor-pointer group"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-amber-400 flex items-center justify-between gap-1">
                            <span className="truncate">cit.logistics@bank.com</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono shrink-0">
                              CIT LOGISTICS
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFastFill('treasury@bank.com', 'Treasury2026!')}
                          className="p-2.5 text-left rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-all text-xs cursor-pointer group"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-purple-400 flex items-center justify-between gap-1">
                            <span className="truncate">treasury@bank.com</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono shrink-0">
                              TREASURY
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* REGISTER TAB */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        Register New Operations Officer
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Enroll an authorized operator for ATM cash tracking and dispatch.
                      </p>
                    </div>

                    {regError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">Registration Issue</p>
                          <p className="text-[11px] text-rose-200/90">{regError}</p>
                        </div>
                      </div>
                    )}

                    {/* Name & Corporate Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="e.g. Samudra Paul"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Corporate Work Email *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="officer@bank.com"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role & Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Operational Role *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <select
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value as UserRole)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="Cash Operations Director">Cash Operations Director</option>
                            <option value="Head of CIT Logistics">Head of CIT Logistics</option>
                            <option value="Treasury Liquidity Analyst">Treasury Liquidity Analyst</option>
                            <option value="Branch Vault Officer">Branch Vault Officer</option>
                            <option value="Security & Compliance Auditor">Security & Compliance Auditor</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Department / Unit
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            value={regDepartment}
                            onChange={(e) => setRegDepartment(e.target.value)}
                            placeholder="e.g. Central Cash Management"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badge ID & Passwords */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Terminal Badge ID / Node Identifier</span>
                        <span className="text-[10px] text-slate-500 font-normal">Optional (auto-assigned if blank)</span>
                      </label>
                      <input
                        type="text"
                        value={regBadgeId}
                        onChange={(e) => setRegBadgeId(e.target.value)}
                        placeholder="e.g. CCMU-8821"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full px-3 pr-8 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Confirm Password *
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px] leading-relaxed text-slate-400">
                          I acknowledge adherence to corporate cash telemetry governance, ISO-27001 data secrecy policies, and central bank ATM liquidity guidelines.
                        </span>
                      </label>
                    </div>

                    {/* Submit Registration */}
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
                    >
                      {isRegistering ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Creating Authorized Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Registration & Access Fleet</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Corporate Security Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/90 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <img
              src="/src/assets/images/atm_app_logo_1791799184731.jpg"
              alt="Logo"
              className="w-4 h-4 rounded-sm object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="font-semibold text-slate-300">ATM Cash Forecasting Decision-Support Platform</span>
            <span>•</span>
            <span>Version 2.4 Enterprise</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>ISO 8583 Compliant</span>
            <span>•</span>
            <span>SOC 2 Type II Certified</span>
            <span>•</span>
            <span>Central Bank Cash Replenishment Standard</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset Operator Key</h3>
                  <p className="text-[11px] text-slate-400">ATM Cash Management Directory</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSuccessMessage(null);
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {forgotSuccessMessage ? (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs space-y-2">
                <p className="font-semibold flex items-center gap-1.5 text-blue-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Key Retrieval Notice
                </p>
                <p className="leading-relaxed">{forgotSuccessMessage}</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSuccessMessage(null);
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-300">
                  Enter your registered work email to receive password reset tokens and temporary terminal access authorization.
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. director3378@bank.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    Send Reset Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
