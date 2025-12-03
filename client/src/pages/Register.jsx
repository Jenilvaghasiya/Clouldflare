import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../firebase';
import { db } from '../../firebase';

export default function Register({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) next.email = 'Enter a valid email address';
    if (!password || password.length < 6) next.password = 'Password must be at least 6 characters';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    if (phone.trim()) {
      const phoneOk = /^\+?[0-9]{7,15}$/.test(phone.trim());
      if (!phoneOk) next.phone = 'Enter a valid phone number';
    }
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name || '',
        phone: phone || '',
        email: cred.user.email,
        createdAt: serverTimestamp(),
      });
      // After successful registration, sign out and show Login page
      await signOut(auth);
      if (onSwitchToLogin) onSwitchToLogin();
    } catch (err) {
      setError(err.message || 'Failed to register');
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
          <h2>Create your account</h2>
          <p>Join Wordzy to continue</p>
        </div>
        <form onSubmit={onSubmit} className="auth-form" aria-busy={submitting}>
          <label>
            <span>Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((fe) => ({ ...fe, name: undefined })); }}
              required
              disabled={submitting}
            />
          </label>
          {fieldErrors.name && <div className="auth-error">{fieldErrors.name}</div>}
          <label>
            <span>Phone number</span>
            <input
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((fe) => ({ ...fe, phone: undefined })); }}
              disabled={submitting}
            />
          </label>
          {fieldErrors.phone && <div className="auth-error">{fieldErrors.phone}</div>}
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
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors((fe) => ({ ...fe, password: undefined })); }}
              required
              minLength={6}
              disabled={submitting}
            />
          </label>
          {fieldErrors.password && <div className="auth-error">{fieldErrors.password}</div>}
          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (fieldErrors.confirm) setFieldErrors((fe) => ({ ...fe, confirm: undefined })); }}
              required
              disabled={submitting}
            />
          </label>
          {fieldErrors.confirm && <div className="auth-error">{fieldErrors.confirm}</div>}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn-spinner" />
                Creating…
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already have an account?</span>
          <button type="button" className="link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
