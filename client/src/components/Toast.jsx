import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import '../styles/toast.css';

export default function Toast({ open, type = 'success', message = '', onClose, duration = 2500 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const Icon = type === 'error' ? AlertTriangle : type === 'info' ? Info : CheckCircle2;

  return (
    <div className={`ww-toast ww-toast-${type} ww-toast-enter`} role="status" aria-live="polite" onClick={onClose}>
      <span className="ww-toast-icon" aria-hidden="true"><Icon size={18} /></span>
      <span className="ww-toast-msg">{message}</span>
    </div>
  );
}
