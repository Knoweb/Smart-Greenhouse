import React, { useState } from 'react';
import { ArrowRight, Globe, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import loginBackground from '../assets/GREEN BACK.png';
import sanotaWordmark from '../assets/sanota-wordmark.png';

const AuthScreen = ({ onSignIn, onSignUp, onSignInWithGoogle, onResetPassword, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        text: error?.message || 'Authentication failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    await handleAuth(onSignIn, 'Login successful. Loading your devices...');
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
          text: 'Account created and you are now signed in.'
        });
        return;
      }

      setMessage({
        type: 'success',
        text: user
          ? 'Account created. Supabase email confirmation is still on, so password login will stay blocked until that email is confirmed or Confirm email is turned off.'
          : 'Account created. Please check your email to confirm the account if Supabase email confirmation is enabled.'
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
        throw new Error('Please enter your email first.');
      }

      const { error } = await onResetPassword({ email: trimmedEmail });
      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password reset link sent. Check your email and follow the instructions to set a new password.'
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

  const switchToSignUp = () => {
    setIsSignUpMode(true);
    setMessage(null);
    setConfirmPassword('');
  };

  const switchToLogin = () => {
    setIsSignUpMode(false);
    setMessage(null);
    setConfirmPassword('');
  };

  return (
    <div className="auth-shell" style={{ '--auth-bg-image': `url(${loginBackground})` }}>
      <div className="auth-backdrop-blur" />
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-panel">
        <div className="auth-form-card">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <img src={sanotaWordmark} alt="SANOTA" className="auth-brand-logo" />
            </div>
            <div>
              <div className="auth-brand-name">Sanota</div>
              <div className="auth-brand-sub">Greenhouse Control System</div>
            </div>
          </div>
          <form className="auth-form" onSubmit={isSignUpMode ? handleSignUp : handleSignIn}>
            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>{isSignUpMode ? 'Create Password' : 'Password'}</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  minLength={6}
                  required
                />
              </div>
            </label>

            {isSignUpMode && (
              <label className="auth-field">
                <span>Confirm Password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole size={16} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    minLength={6}
                    required
                  />
                </div>
              </label>
            )}

            <div className="auth-forgot-row">
              <button
                className="auth-forgot-btn"
                type="button"
                onClick={handleForgotPassword}
                disabled={submitting || loading}
              >
                Forgot password?
              </button>
            </div>

            <div className="auth-help-row">
              <span>{isSignUpMode ? 'Create a new grower account' : 'Private login for registered growers'}</span>
              <span>Device data stays user-specific</span>
            </div>

            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button className="auth-submit-btn primary" type="submit" disabled={submitting || loading}>
              <ShieldCheck size={16} />
              {submitting ? 'Please wait...' : isSignUpMode ? 'Create Account' : 'Log In'}
              {!submitting && <ArrowRight size={16} />}
            </button>

            <button
              className="auth-submit-btn google"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting || loading}
            >
              <Globe size={16} />
              Continue with Google
            </button>

            {!isSignUpMode && (
              <button
                className="auth-submit-btn secondary"
                type="button"
                disabled={submitting || loading}
                onClick={switchToSignUp}
              >
                <ShieldCheck size={16} />
                {submitting ? 'Please wait...' : 'Sign Up'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            )}

            {isSignUpMode && (
              <button
                className="auth-submit-btn secondary"
                type="button"
                disabled={submitting || loading}
                onClick={switchToLogin}
              >
                Back to Login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
