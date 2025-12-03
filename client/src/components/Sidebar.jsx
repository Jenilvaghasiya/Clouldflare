import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Palette, LogOut, Menu, X, Key } from 'lucide-react';
import { signOut, updatePassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Sidebar({ current, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [prevPassword, setPrevPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email || '');
    });
    return () => unsub();
  }, []);

  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'wordfrom', label: 'Word From', icon: FileText },
    { key: 'colorfrom', label: 'Color From', icon: Palette },
  ];

  const handleNavigate = (key) => {
    onNavigate(key);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const next = {};
    if (!prevPassword || prevPassword.length < 6) next.prevPassword = 'Previous password is required (min 6)';
    if (!newPassword || newPassword.length < 6) next.newPassword = 'New password must be at least 6 characters';
    if (newPassword && prevPassword && newPassword === prevPassword) next.newPassword = 'New password must be different';
    if (confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    
    setSubmitting(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, userEmail, prevPassword);
      await updatePassword(userCred.user, newPassword);
      
      // Send email notification
      try {
        await fetch(`${API_URL}/api/password-changed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
      } catch (emailErr) {
        console.error('Failed to send email notification:', emailErr);
      }
      
      setSuccess('Password changed successfully! A confirmation email has been sent.');
      setPrevPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isMobile && (
        <button
          className="ww-mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}
      
      <aside className={`ww-sidebar ${isMobile && mobileOpen ? 'ww-sidebar-mobile-open' : ''} ${isMobile && !mobileOpen ? 'ww-sidebar-mobile-closed' : ''}`}>
        <div className="ww-brand" style={{ justifyContent: 'center', width: '100%' }}>
          <img
            src="/images/KidsBunny.png"
            alt="KidsBunny"
            style={{ width: 200, height: 'auto', display: 'block', margin: '0 auto' }}
          />
        </div>
        <nav className="ww-nav">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`ww-nav-item${current === item.key ? ' ww-nav-item-active' : ''}`}
                onClick={() => handleNavigate(item.key)}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="ww-nav-item"
              onClick={() => {
                setShowChangePassword(true);
                if (isMobile) setMobileOpen(false);
              }}
              title="Change password"
            >
              <Key size={20} />
              Change Password
            </button>
            <button
              className="ww-nav-item"
              onClick={() => signOut(auth)}
              title="Sign out"
            >
              <LogOut size={20} />
              Sign out
            </button>
          </div>
        </nav>
      </aside>
      
      {isMobile && mobileOpen && (
        <div 
          className="ww-sidebar-overlay" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {showChangePassword && (
        <div 
          role="dialog" 
          aria-modal="true" 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 9999,
            background: 'rgba(59, 130, 246, 0.95)',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}
        >
          <div className="auth-card" style={{ maxWidth: 420, position: 'relative', margin: 0 }}>
            {submitting && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', borderRadius: '16px', zIndex: 2 }}>
                <img src="/images/loader.gif" alt="Loading" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              </div>
            )}
            <div className="auth-header">
              <h2>Change Password</h2>
              <p>Enter your current password and choose a new one</p>
            </div>
            <form onSubmit={handleChangePassword} className="auth-form">
              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  placeholder="Current password"
                  value={prevPassword}
                  onChange={(e) => { setPrevPassword(e.target.value); if (fieldErrors.prevPassword) setFieldErrors((fe) => ({ ...fe, prevPassword: undefined })); }}
                  required
                  disabled={submitting}
                />
              </label>
              {fieldErrors.prevPassword && <div className="auth-error">{fieldErrors.prevPassword}</div>}
              
              <label>
                <span>New Password</span>
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
                <span>Confirm New Password</span>
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

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPrevPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                    setFieldErrors({});
                  }}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="auth-button"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}