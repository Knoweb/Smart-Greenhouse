import React, { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import loginBackground from '../assets/greenhouse-bg.jpg';
import SanotaLogo from './SanotaLogo';

const RecoveryPasswordScreen = ({ onComplete, onCancel, loading }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      if (!password || !confirmPassword) {
        throw new Error('Please enter a new password twice.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const { error } = await onComplete({ password });
      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password updated successfully. Returning you to the login screen...'
      });

      window.setTimeout(() => {
        onCancel();
      }, 1200);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Could not update password.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <img src={loginBackground} alt="Greenhouse" className="auth-bg-image" />
      <div className="auth-bg-overlay" />
      <div className="auth-panel" style={{ position: 'relative', zIndex: 10 }}>
        <div className="auth-form-card recovery-card">
          <div className="auth-brand-clean" style={{ marginBottom: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SanotaLogo height={48} showSubtitle subtitleText="Smart Greenhouse Control System" />
          </div>
          <div className="recovery-header">
            <div className="auth-brand-name">Reset Password</div>
            <div className="auth-brand-sub">Create a new password for your account.</div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>New Password</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter a new password"
                  minLength={6}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Confirm Password</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={16} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  minLength={6}
                  required
                />
              </div>
            </label>

            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button className="auth-submit-btn primary" type="submit" disabled={submitting || loading}>
              <ShieldCheck size={16} />
              {submitting ? 'Please wait...' : 'Update Password'}
              {!submitting && <ArrowRight size={16} />}
            </button>

            <button
              className="auth-submit-btn secondary"
              type="button"
              onClick={onCancel}
              disabled={submitting || loading}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPasswordScreen;
