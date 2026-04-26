import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Lock, Loader2, XCircle } from 'lucide-react';
import appLogo from '../../logo.png';
import { useAppContext } from '../../context/AppContext';

export function AuthScreen() {
  const {
    authMode, setAuthMode, email, setEmail, password, setPassword,
    name, setName, authError, authLoading,
    handleLogin, handleSignup, handleForgotPassword,
  } = useAppContext();

  return (
    <div className="min-h-screen bg-[#488118] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center mb-6"
          >
            <img src={appLogo} alt="Swap Barter Logo" className="w-32 h-32 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black italic tracking-tighter text-[#00592e] dark:text-white uppercase">
            swap <span className="text-[#ffab00]">barter</span>
          </h1>
          <p className="text-zinc-100 mt-2">Eşyalarını takasla, yenilerini keşfet.</p>
        </div>

        {authError && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
            <XCircle size={16} />{authError}
          </div>
        )}

        <form
          onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleForgotPassword}
          className="space-y-4"
        >
          {authMode === 'signup' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <UserIcon className="text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Ad Soyad"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                required
              />
            </div>
          )}

          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <Mail className="text-zinc-400" size={20} />
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
              required
            />
          </div>

          {authMode !== 'forgot' && (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <Lock className="text-zinc-400" size={20} />
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                required
              />
            </div>
          )}

          <button
            disabled={authLoading}
            type="submit"
            className="w-full bg-[#ffab00] text-[#488118] py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#ffab00]/40 active:scale-95 transition-all duration-200 disabled:opacity-50 uppercase tracking-wider"
          >
            {authLoading
              ? <Loader2 className="animate-spin mx-auto" />
              : authMode === 'login' ? 'Giriş Yap' : authMode === 'signup' ? 'Kayıt Ol' : 'Şifremi Sıfırla'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {authMode === 'login' && (
            <>
              <button onClick={() => setAuthMode('signup')} className="text-zinc-100 font-bold text-sm block w-full">
                Hesabın yok mu? <span className="text-[#ffab00]">Kayıt Ol</span>
              </button>
              <button onClick={() => setAuthMode('forgot')} className="text-zinc-100 text-xs font-semibold">
                Şifremi Unuttum
              </button>
            </>
          )}
          {authMode === 'signup' && (
            <button onClick={() => setAuthMode('login')} className="text-zinc-100 font-bold text-sm">
              Zaten hesabın var mı? <span className="text-[#ffab00]">Giriş Yap</span>
            </button>
          )}
          {authMode === 'forgot' && (
            <button onClick={() => setAuthMode('login')} className="text-zinc-500 font-bold text-sm">
              Giriş ekranına dön
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
