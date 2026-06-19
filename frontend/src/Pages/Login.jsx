import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AppContext } from '../Context/AppContext';
import api from '../utils/api';
import { toast } from 'react-toastify';

/* ── Divider ─────────────────────────────────────────────────────────────── */
const Divider = () => (
  <div className="flex items-center gap-3 w-full my-1">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400 font-medium">or continue with email</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

/* ── Login Page ──────────────────────────────────────────────────────────── */
const Login = () => {
  const [state, setState]     = useState('Login');    // 'Sign Up' | 'Login'
  const [role, setRole]       = useState('patient');  // 'patient' | 'doctor'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]     = useState('');

  const navigate = useNavigate();
  const { login } = useContext(AppContext);

  const resetError   = () => setError('');
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ── Email/Password Submit ────────────────────────────────────────────── */
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    resetError();

    // Client-side validation
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (state === 'Sign Up' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (state === 'Sign Up' && role === 'patient' && !phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (state === 'Login') {
        const endpoint = role === 'doctor' ? '/doctors/login' : '/patients/login';
        res = await api.post(endpoint, { email, password });
      } else {
        const endpoint = role === 'doctor' ? '/doctors/register' : '/patients/register';
        const payload  = role === 'doctor'
          ? { name, email, password, speciality: 'General physician' }
          : { name, email, password, phone };
        res = await api.post(endpoint, payload);
      }

      if (res.data.success) {
        login({
          token:   res.data.token,
          role:    res.data.role,
          patient: res.data.patient,
          doctor:  res.data.doctor,
        });
        toast.success(state === 'Login' ? 'Welcome back!' : 'Account created successfully!');
        navigate('/');
      } else {
        setError(res.data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth Success ─────────────────────────────────────────────── */
  /**
   * GoogleLogin component from @react-oauth/google returns:
   *   credentialResponse = { credential: "<Google ID Token>" }
   *
   * We send the ID token to our backend which verifies it using google-auth-library.
   * GOOGLE_CLIENT_SECRET is NOT required — we only verify ID tokens.
   */
  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse;
    if (!credential) {
      setError('Google sign-in failed — no credential received.');
      return;
    }

    setGoogleLoading(true);
    resetError();

    try {
      const res = await api.post('/patients/google-auth', { credential });

      if (res.data.success) {
        login({
          token:   res.data.token,
          role:    res.data.role,
          patient: res.data.patient,
        });
        const name = res.data.patient?.name;
        toast.success(`Welcome${name ? `, ${name}` : ''}! 👋`);
        navigate('/');
      } else {
        setError(res.data.message || 'Google sign-in failed.');
      }
    } catch (err) {
      if (err.response?.status === 503) {
        setError('Google sign-in is not configured on this server. Use email/password instead.');
      } else {
        setError(err.response?.data?.message || 'Google sign-in error. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    // Only set error if user didn't simply close the popup
    setError('Google sign-in was cancelled or failed. Please try again or use email/password.');
  };

  return (
    /* NOTE: The form's `required` attributes are for email/password inputs only.
       Google OAuth is handled outside the form via the GoogleLogin button, so
       there's no HTML5 validation conflict for the OAuth path. */
    <form
      className="min-h-[80vh] flex items-center"
      onSubmit={onSubmitHandler}
      noValidate  /* disable native validation — we do it manually above */
    >
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96
                      border rounded-xl text-zinc-600 text-sm shadow-lg bg-white">

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <p className="text-2xl font-semibold text-gray-800">
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </p>
        <p className="text-gray-500 text-sm">
          {state === 'Sign Up'
            ? 'Sign up to book your appointment'
            : 'Log in to access your account'}
        </p>

        {/* ── Role selector ──────────────────────────────────────────────── */}
        <div className="flex gap-3 w-full">
          {['patient', 'doctor'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); resetError(); }}
              className={`flex-1 py-1.5 rounded border text-sm font-medium transition-colors duration-150
                ${role === r ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Google Sign-In Button (Patients only) ─────────────────────── */}
        {role === 'patient' && (
          <>
            <div className="w-full flex justify-center" id="google-signin-btn">
              {googleLoading ? (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                                rounded-lg border border-gray-200 bg-white text-gray-600 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in with Google…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="336"
                />
              )}
            </div>
            <Divider />
          </>
        )}

        {/* ── Name field (Sign Up only) ─────────────────────────────────── */}
        {state === 'Sign Up' && (
          <div className="w-full">
            <label className="block mb-1" htmlFor="login-name">Full Name</label>
            <input
              id="login-name"
              className="border border-zinc-300 rounded w-full p-2 focus:outline-none
                         focus:border-primary transition-colors"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>
        )}

        {/* ── Phone field (Patient Sign Up only) ────────────────────────── */}
        {state === 'Sign Up' && role === 'patient' && (
          <div className="w-full">
            <label className="block mb-1" htmlFor="login-phone">Phone Number</label>
            <input
              id="login-phone"
              className="border border-zinc-300 rounded w-full p-2 focus:outline-none
                         focus:border-primary transition-colors"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              autoComplete="tel"
            />
          </div>
        )}

        {/* ── Email ──────────────────────────────────────────────────────── */}
        <div className="w-full">
          <label className="block mb-1" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="border border-zinc-300 rounded w-full p-2 focus:outline-none
                       focus:border-primary transition-colors"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); resetError(); }}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {/* ── Password ───────────────────────────────────────────────────── */}
        <div className="w-full">
          <label className="block mb-1" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="border border-zinc-300 rounded w-full p-2 focus:outline-none
                       focus:border-primary transition-colors"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); resetError(); }}
            placeholder="Min 6 characters"
            autoComplete={state === 'Login' ? 'current-password' : 'new-password'}
          />
        </div>

        {/* ── Error message ───────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="w-full bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* ── Submit button ───────────────────────────────────────────────── */}
        <button
          id="login-submit"
          type="submit"
          disabled={loading || googleLoading}
          className="bg-primary text-white w-full py-2 rounded-md text-base font-medium
                     disabled:opacity-60 disabled:cursor-not-allowed
                     hover:opacity-90 transition-opacity"
        >
          {loading
            ? 'Please wait…'
            : state === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>

        {/* ── Toggle state ────────────────────────────────────────────────── */}
        <p className="text-gray-500">
          {state === 'Sign Up' ? (
            <>Already have an account?{' '}
              <span
                onClick={() => { setState('Login'); resetError(); setEmail(''); setPassword(''); }}
                className="text-primary underline cursor-pointer"
              >
                Login here
              </span>
            </>
          ) : (
            <>New here?{' '}
              <span
                onClick={() => { setState('Sign Up'); resetError(); setEmail(''); setPassword(''); }}
                className="text-primary underline cursor-pointer"
              >
                Create an account
              </span>
            </>
          )}
        </p>
      </div>
    </form>
  );
};

export default Login;
