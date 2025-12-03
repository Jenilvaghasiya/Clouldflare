import React, { useEffect, useState } from 'react';
import { FileText, Image, Sparkles, Palette } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { listWordsByLevel } from '../services/words';
import { listColors } from '../services/color';

export default function Dashboard() {
  const [name, setName] = useState('');
  const [stats, setStats] = useState([
    { label: 'Total Entries', value: '—', icon: FileText, color: '#6366f1' },
    { label: 'GIFs Uploaded', value: '—', icon: Image, color: '#8b5cf6' },
    { label: 'Colors', value: '—', icon: Palette, color: '#10b981' },
    // { label: 'Pending Reviews', value: '—', icon: Sparkles, color: '#10b981' },
  ]);

  const LEVELS = ['Pre-KG', 'LKG', 'UKG', '1st Std'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const n = u?.displayName || (u?.email ? u.email.split('@')[0] : 'User');
      setName(n);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const results = await Promise.all(LEVELS.map((lvl) => listWordsByLevel(lvl)));
        const items = results.flat();
        const totalEntries = items.length;
        const gifsUploaded = items.filter((w) => !!w.gifUrl).length;
        const colors = await listColors().catch(() => []);
        const colorsCount = Array.isArray(colors) ? colors.length : 0;
        if (!mounted) return;
        setStats([
          { label: 'Total Entries', value: String(totalEntries), icon: FileText, color: '#6366f1' },
          { label: 'GIFs Uploaded', value: String(gifsUploaded), icon: Image, color: '#8b5cf6' },
          { label: 'Colors', value: String(colorsCount), icon: Palette, color: '#10b981' },
          // { label: 'Pending Reviews', value: '0', icon: Sparkles, color: '#10b981' },
        ]);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="ww-page">
      <header className="ww-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1>Welcome to KidsBunny Hello, {name} </h1>
        </div>
        <p className="ww-sub">Here's your overview</p>
      </header>

      <section className="ww-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="ww-card">
              <div className="ww-card-icon">
                <Icon size={24} />
              </div>
              <h3>{stat.label}</h3>
              <p className="ww-metric">{stat.value}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}