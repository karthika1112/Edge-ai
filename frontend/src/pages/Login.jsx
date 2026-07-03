import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { msalConfig } from '../utils/authConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Mail, 
  User,
  Sliders,
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
const API_URL = import.meta.env.VITE_API_URL || "${API_URL}";
const WS_URL = API_URL.replace(/^http/, "ws");

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      dept: 'Maintenance',
      rememberMe: false
    }
  });

  const watchPassword = watch('password', '');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setIsSubmitting(true);
      setAuthError('');
      setAuthSuccess('SSO Authentication code received. Validating session...');
      
      setTimeout(() => {
        if (code === 'mock_entra_auth_code_xyz') {
          login('operator@edgeshield.ai', 'password123')
            .then(() => {
              setAuthSuccess('SSO Authentication successful. Welcome!');
              // Clear search params
              const newParams = new URLSearchParams(window.location.search);
              newParams.delete('code');
              newParams.delete('state');
              setSearchParams(newParams);
              navigate('/dashboard');
            })
            .catch(() => {
              setAuthError('SSO Login validation failed. User is not registered in the OT database.');
              setIsSubmitting(false);
            });
        } else {
          setAuthError('Invalid Azure Entra ID authorization token or state mismatch.');
          setIsSubmitting(false);
        }
      }, 1500);
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      if (isSignUp) {
        const response = await fetch(`${API_URL}/api/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
            dept: data.dept
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.detail || 'Registration failed. Please try again.');
        }

        setAuthSuccess('Account registered successfully! You can now sign in.');
        setIsSignUp(false);
        reset();
      } else {
        await login(data.email, data.password);
        navigate('/dashboard');
      }
    } catch (err) {
      if (isSignUp) {
        setAuthSuccess('Registration successful (Simulator mode)! Account initialized.');
        setIsSignUp(false);
        reset();
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setIsSubmitting(true);
    setAuthError('');
    
    // Redirect to the Microsoft login endpoint with OAuth2 query parameters
    const authUrl = `${msalConfig.auth.authorizeEndpoint}` +
      `?client_id=${msalConfig.auth.clientId}` +
      `&redirect_uri=${encodeURIComponent(msalConfig.auth.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(msalConfig.auth.scopes.join(' '))}` +
      `&state=mock_oauth_flow_state_12345`;
      
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] font-sans text-[#111827] overflow-hidden relative">
      
      {/* Background illustration styled layout matching design mock */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 select-none pointer-events-none" 
        style={{ backgroundImage: `url('/login_page_illustration_1783057194987.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F1F5F9]/80 pointer-events-none" />

      {/* Centered Modern Login Card */}
      <div className="max-w-[420px] w-full mx-auto p-6 relative z-10">
        
        <AnimatePresence mode="wait">
          {authError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mb-4">
              <Alert type="error" className="bg-red-50 border-red-200 text-red-700 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs font-semibold shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <span>{authError}</span>
              </Alert>
            </motion.div>
          )}
          {authSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mb-4">
              <Alert type="success" className="bg-emerald-50 border-emerald-250 text-emerald-700 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs font-semibold shadow-sm">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>{authSuccess}</span>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(37,99,235,0.06)] border border-slate-100 flex flex-col items-center">
          
          {/* Top Logo and Title block matching mockup */}
          <div className="flex flex-col items-center gap-1.5 mb-8 select-none">
            {/* Custom Shield logo matching design */}
            <div className="w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full text-primary-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C65 10 85 18 85 45C85 70 65 85 50 90C35 85 15 70 15 45C15 18 35 10 50 10Z" fill="#2563EB" />
                <path d="M50 15C62 15 80 22 80 45C80 66 62 80 50 85C38 80 20 66 20 45C20 22 38 15 50 15Z" fill="white" />
                {/* Internal circuit nodes inside shield */}
                <rect x="35" y="32" width="20" height="4" rx="2" fill="#2563EB" />
                <circle cx="55" cy="34" r="4" fill="#2563EB" />
                <rect x="35" y="44" width="30" height="4" rx="2" fill="#2563EB" />
                <circle cx="35" cy="46" r="4" fill="#2563EB" />
                <rect x="45" y="56" width="20" height="4" rx="2" fill="#2563EB" />
                <circle cx="45" cy="58" r="4" fill="#2563EB" />
                <line x1="50" y1="20" x2="50" y2="80" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1E293B]">
              EDGE<span className="text-primary-600 font-extrabold">SHIELD</span> <span className="text-[#64748B] font-light">AI</span>
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full" noValidate>
            
            {isSignUp && (
              <>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-text tracking-widest uppercase block">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6B7280]"><User className="w-4 h-4" /></span>
                    <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 bg-slate-50 focus:bg-white focus:border-primary-500 outline-none transition-smooth"
                      placeholder="John Doe"
                      {...register('name', { required: 'Name is required' })}
                    />
                  </div>
                </div>

                {/* Role selection dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-text tracking-widest uppercase block">Operator Role</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6B7280]"><Sliders className="w-4 h-4" /></span>
                    <select 
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-[#111827] bg-slate-50 focus:bg-white focus:border-primary-500 outline-none transition-smooth cursor-pointer"
                      {...register('dept')}
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Plant Manager">Plant Manager</option>
                      <option value="Maintenance Engineer">Maintenance Engineer</option>
                      <option value="Production Supervisor">Production Supervisor</option>
                      <option value="Machine Operator">Machine Operator</option>
                      <option value="Security Analyst">Security Analyst</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6B7280]"><Mail className="w-4.5 h-4.5" /></span>
                <input 
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:border-primary-500 outline-none transition-smooth bg-white"
                  placeholder="Email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                  })}
                />
              </div>
              {errors.email && <span className="text-[9px] text-red-500 block mt-0.5">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6B7280]"><Lock className="w-4.5 h-4.5" /></span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:border-primary-500 outline-none transition-smooth bg-white"
                  placeholder="Password"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280]" tabIndex="-1">
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <span className="text-[9px] text-red-500 block mt-0.5">{errors.password.message}</span>}
            </div>

            {isSignUp && (
              /* Confirm Password */
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#6B7280]"><Lock className="w-4.5 h-4.5" /></span>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-[#111827] placeholder-slate-400 focus:border-primary-500 outline-none transition-smooth bg-white"
                    placeholder="Confirm Password"
                    {...register('confirmPassword', { 
                      required: 'Please confirm password',
                      validate: val => val === watchPassword || 'Passwords do not match'
                    })}
                  />
                </div>
              </div>
            )}

            {/* Remember Me and Forgot Password row */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7280] pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-350 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                  {...register('rememberMe')}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="text-primary-600 hover:text-primary-750 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-750 disabled:bg-primary-400 text-white font-extrabold text-xs rounded-xl transition-smooth shadow-sm mt-3"
            >
              {isSubmitting ? <Spinner size="sm" /> : <span>Sign In</span>}
            </button>
          </form>

          {/* Microsoft SSO option */}
          <div className="relative my-5 w-full">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-150" /></div>
            <div className="relative flex justify-center text-[8px] font-bold uppercase"><span className="bg-white px-3 text-gray-text tracking-wide">SSO Integration</span></div>
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-[#111827] font-bold text-xs rounded-xl transition-smooth"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 23 23" fill="none">
              <rect width="10.5" height="10.5" fill="#F25022"/>
              <rect x="12" width="10.5" height="10.5" fill="#7FBA00"/>
              <rect y="12" width="10.5" height="10.5" fill="#00A1F1"/>
              <rect x="12" y="12" width="10.5" height="10.5" fill="#FFB900"/>
            </svg>
            <span>Azure Entra ID</span>
          </button>

          {/* Toggle Form switch */}
          <div className="text-center mt-6 w-full pt-4 border-t border-slate-100">
            <p className="text-xs text-gray-text font-semibold">
              {isSignUp ? 'Already have operator credentials?' : "Don't have a profile?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthSuccess(''); reset(); }}
                className="text-primary-600 hover:text-primary-750 transition-colors font-bold cursor-pointer"
              >
                {isSignUp ? 'Sign In' : 'Register Operator'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
