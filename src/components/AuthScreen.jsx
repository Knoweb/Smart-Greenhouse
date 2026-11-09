import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Eye, EyeOff, Sun, Moon, Sparkles } from 'lucide-react';
import loginBackground from '../assets/greenhouse-bg.jpg';
import SanotaLogo from './SanotaLogo';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const AuthScreen = ({
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onResetPassword,
  loading,
  theme = 'dark',
  toggleTheme
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (action, successText) => {
    setSubmitting(true);
    setMessage(null);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        throw new Error('Please enter both email and password.');
      }

      if (isSignUpMode) {
        if (!confirmPassword) {
          throw new Error('Please confirm your password.');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
      }

      const { error } = await action({ email: trimmedEmail, password });
      if (error) throw error;

      setMessage({
        type: 'success',
        text: successText
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Authentication failed. Please verify your credentials.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await handleAuth(onSignIn, 'Login successful! Loading your greenhouse workspace...');
  };

  const handleSignUp = async (event) => {
    if (event) event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        throw new Error('Please enter both email and password.');
      }

      if (!confirmPassword) {
        throw new Error('Please confirm your password.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const signupResult = await onSignUp({ email: trimmedEmail, password });
      if (signupResult?.error) throw signupResult.error;

      const session = signupResult?.data?.session ?? null;
      const user = signupResult?.data?.user ?? null;

      if (session) {
        setMessage({
          type: 'success',
          text: 'Account created successfully! You are now signed in.'
        });
        return;
      }

      setMessage({
        type: 'success',
        text: user
          ? 'Account created. Please verify your confirmation email to activate login.'
          : 'Account created. Please check your email to confirm the account.'
      });
      setIsSignUpMode(false);
      setConfirmPassword('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Could not create account.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const { data, error } = await onSignInWithGoogle();
      if (error) throw error;

      if (data?.url && typeof window !== 'undefined') {
        window.location.assign(data.url);
        return;
      }

      throw new Error('Google sign-in could not start. Check Supabase Google provider settings.');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Could not start Google sign-in.'
      });
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        throw new Error('Please enter your email address first.');
      }

      const { error } = await onResetPassword({ email: trimmedEmail });
      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password reset link sent! Check your email inbox to proceed.'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Could not send password reset email.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Real Fullscreen Greenhouse Background Image */}
      <img
        src={loginBackground}
        alt="Smart Greenhouse"
        className="auth-bg-image"
      />
      {/* Adaptive Theme Translucent Tint Overlay */}
      <div className="auth-bg-overlay" />

      {/* Top Bar Floating Controls */}
      <div className="auth-top-actions">
        <div className="auth-status-pill">
          <span className="auth-status-dot" />
          <span>Sanota IoT Cloud</span>
        </div>
        {toggleTheme && (
          <button
            className="auth-theme-toggle-btn"
            onClick={toggleTheme}
            type="button"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}
      </div>

      {/* Main Glass Login Card */}
      <div className="auth-panel">
        <div className="auth-form-card">
          {/* Logo Brand Header */}
          <div className="auth-brand-clean">
            <SanotaLogo height={48} showSubtitle subtitleText="Smart Greenhouse Control System" />
          </div>

          {/* Mode Switcher Tabs (Log In vs Sign Up) */}
          <div className="auth-mode-switch">
            <button
              type="button"
              className={`auth-mode-tab ${!isSignUpMode ? 'active' : ''}`}
              onClick={() => {
                setIsSignUpMode(false);
                setMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-mode-tab ${isSignUpMode ? 'active' : ''}`}
              onClick={() => {
                setIsSignUpMode(true);
                setMessage(null);
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={isSignUpMode ? handleSignUp : handleSignIn}>
            {/* Email Field */}
            <div className="auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={17} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <div className="auth-field-header">
                <label htmlFor="auth-password">
                  {isSignUpMode ? 'Create Password' : 'Password'}
                </label>
                {!isSignUpMode && (
                  <button
                    className="auth-forgot-btn"
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={submitting || loading}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={isSignUpMode ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {isSignUpMode && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <div className="auth-input-wrap">
                  <LockKeyhole size={17} className="auth-input-icon" />
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pwd-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Status Message / Notification */}
            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              className="auth-submit-btn primary"
              type="submit"
              disabled={submitting || loading}
            >
              <ShieldCheck size={18} />
              <span>{submitting ? 'Authenticating...' : isSignUpMode ? 'Create Grower Account' : 'Sign In to Dashboard'}</span>
              {!submitting && <ArrowRight size={17} />}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Google OAuth Button */}
            <button
              className="auth-submit-btn google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || loading}
            >
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>

            {/* Footer Trust Details */}
            <div className="auth-security-footer">
              <Sparkles size={13} color="var(--primary)" />
              <span>Encrypted Multi-Tenant IoT Platform</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
