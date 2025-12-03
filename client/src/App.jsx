import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import WordFrom from './pages/WordFrom';
import ColorFrom from './pages/ColorFrom';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/wordFrom.css';
import './styles/auth.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  const handleNavigate = (key) => {
    if (key === currentPage) return;
    setLoading(true);
    setCurrentPage(key);
    setTimeout(() => setLoading(false), 400);
  };
  
  return (
    <div className="ww-app">
      {authChecking ? (
        <div className="ww-loader-overlay">
          <img src="/images/loader.gif" alt="Loading" />
        </div>
      ) : !user ? (
        <Login />
      ) : (
        <>
          <Sidebar current={currentPage} onNavigate={handleNavigate} />
          <main className="ww-main">
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'wordfrom' && <WordFrom />}
            {currentPage === 'colorfrom' && <ColorFrom />}
          </main>
        </>
      )}
      {loading && (
        <div className="ww-loader-overlay">
          <img src="/images/loader.gif" alt="Loading" />
        </div>
      )}
    </div>
  );
}