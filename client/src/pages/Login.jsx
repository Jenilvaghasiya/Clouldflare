import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'change' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prevPassword, setPrevPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Check URL parameters for auto-fill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Fetch email and temp password from token
      fetch(`${API_URL}/api/verify-token/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.email && data.tempPassword) {
            setMode('change');
            setEmail(data.email);
            setPrevPassword(data.tempPassword);
            setSuccess('Your email and temporary password have been auto-filled. Please enter your new password.');
          }
        })
        .catch(err => {
          console.error('Failed to verify token:', err);
        });
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const next = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) next.email = 'Enter a valid email address';
    if (!password || password.length < 6) next.password = 'Password must be at least 6 characters';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setSubmitting(false);
    }
  };

  const validateChange = () => {
    const next = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) next.email = 'Enter a valid email address';
    if (!prevPassword || prevPassword.length < 6) next.prevPassword = 'Previous password is required (min 6)';
    if (!newPassword || newPassword.length < 6) next.newPassword = 'New password must be at least 6 characters';
    if (newPassword && prevPassword && newPassword === prevPassword) next.newPassword = 'New password must be different';
    if (confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onOpenConfirm = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateChange()) return;
    setConfirmOpen(true);
  };

  const onConfirmChange = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), prevPassword);
      await updatePassword(userCred.user, newPassword);
      
      // Send email notification
      try {
        await fetch(`${API_URL}/api/password-changed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
        // Don't fail the password change if email fails
      }
      
      setSuccess('Password has been changed successfully. A confirmation email has been sent to your inbox.');
      setPrevPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEmail('');
      setMode('login');
    } catch (err) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancelChange = () => {
    setConfirmOpen(false);
  };

  const onForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const next = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) next.email = 'Enter a valid email address';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }
      
      setSuccess('A temporary password has been sent to your email. Please check your inbox and use it to log in.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {submitting && (
          <div className="auth-overlay">
            <img src="/images/loader.gif" alt="Loading" className="auth-overlay-gif" />
          </div>
        )}
        <div className="auth-header">
          <img src="/images/icon.png" alt="Wordzy" width={56} height={56} />
          <h2>
            {mode === 'login' ? 'Welcome back' : mode === 'change' ? 'Change password' : 'Forgot password'}
          </h2>
          <p>
            {mode === 'login' 
              ? 'Please sign in to continue' 
              : mode === 'change' 
              ? 'Enter your email and verify your previous password to set a new one'
              : 'Enter your email to receive a temporary password'}
          </p>
        </div>
        {mode === 'login' ? (
          <form onSubmit={onSubmit} className="auth-form" aria-busy={submitting}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.email && <div className="auth-error">{fieldErrors.email}</div>}
            <label>
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((fe) => ({ ...fe, password: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.password && <div className="auth-error">{fieldErrors.password}</div>}

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={onForgotPassword} className="auth-form" aria-busy={submitting}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.email && <div className="auth-error">{fieldErrors.email}</div>}

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Sending…
                </>
              ) : (
                'Send temporary password'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onOpenConfirm} className="auth-form" aria-busy={submitting}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.email && <div className="auth-error">{fieldErrors.email}</div>}
            <label>
              <span>Previous password</span>
              <input
                type="password"
                placeholder="Previous password"
                value={prevPassword}
                onChange={(e) => { setPrevPassword(e.target.value); if (fieldErrors.prevPassword) setFieldErrors((fe) => ({ ...fe, prevPassword: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.prevPassword && <div className="auth-error">{fieldErrors.prevPassword}</div>}
            <label>
              <span>New password</span>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (fieldErrors.newPassword) setFieldErrors((fe) => ({ ...fe, newPassword: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.newPassword && <div className="auth-error">{fieldErrors.newPassword}</div>}
            <label>
              <span>Confirm password</span>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors((fe) => ({ ...fe, confirmPassword: undefined })); }}
                required
                disabled={submitting}
              />
            </label>
            {fieldErrors.confirmPassword && <div className="auth-error">{fieldErrors.confirmPassword}</div>}

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button className="auth-button" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Processing…
                </>
              ) : (
                'Change password'
              )}
            </button>
          </form>
        )}
        <div className="auth-footer">
          {mode === 'login' ? (
            <button
              type="button"
              className="link"
              onClick={() => {
                setError('');
                setSuccess('');
                setFieldErrors({});
                setMode('forgot');
              }}
              disabled={submitting}
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              className="link"
              onClick={() => {
                setError('');
                setSuccess('');
                setFieldErrors({});
                setEmail('');
                setPassword('');
                setPrevPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setMode('login');
              }}
              disabled={submitting}
            >
              Back to sign in
            </button>
          )}
        </div>

        {confirmOpen && (
          <div className="auth-overlay" role="dialog" aria-modal="true">
            <div className="auth-card" style={{ maxWidth: 420 }}>
              <div className="auth-header">
                <h3>Confirm password change</h3>
                <p>Are you sure you want to change your password?</p>
              </div>
              <div className="auth-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="link" onClick={onCancelChange} disabled={submitting}>No</button>
                <button type="button" className="auth-button" onClick={onConfirmChange} disabled={submitting}>Yes, change</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
