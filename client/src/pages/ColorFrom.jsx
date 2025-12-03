import React, { useEffect, useState, useRef } from 'react';
import { Palette, Hash, Type, Plus, X, Pencil, Trash2, Copy } from 'lucide-react';
import '../styles/ColorFrom.css';
import { addColor, listColors, updateColor, deleteColor } from '../services/color';
import Toast from '../components/Toast';

export default function ColorFrom() {
  const [colorName, setColorName] = useState('');
  const [hexCode, setHexCode] = useState('');
  const [exampleWord, setExampleWord] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [colors, setColors] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const colorInputRef = useRef(null);

  const PAGE_SIZE = 5;

  const contrastText = (hex) => {
    const v = (hex || '#000000').replace('#','');
    const r = parseInt(v.substr(0,2), 16) || 0;
    const g = parseInt(v.substr(2,2), 16) || 0;
    const b = parseInt(v.substr(4,2), 16) || 0;
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#0b1220' : '#ffffff';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!colorName.trim()) nextErrors.name = 'Color name is required';
    if (hexCode.trim()) {
      const hexOk = /^#([0-9a-fA-F]{6})$/.test(hexCode.trim());
      if (!hexOk) nextErrors.hex = 'Use #RRGGBB format';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setToast({ open: true, type: 'error', message: 'Please fix form errors' });
      return;
    }

    try {
      if (editingColor) {
        await updateColor(editingColor.id, {
          name: colorName.trim(),
          hexCode: hexCode.trim(),
          examples: exampleWord.trim() ? [exampleWord.trim()] : [],
        });
        setToast({ open: true, type: 'success', message: 'Color updated' });
      } else {
        await addColor({
          name: colorName.trim(),
          hexCode: hexCode.trim(),
          examples: exampleWord.trim() ? [exampleWord.trim()] : [],
        });
        setToast({ open: true, type: 'success', message: 'Color created' });
      }

      setColorName('');
      setHexCode('');
      setExampleWord('');
      setErrors({});
      await fetchColors();
      setShowModal(false);
      setEditingColor(null);
    } catch (err) {
      console.error('Failed to save color:', err);
      setToast({ open: true, type: 'error', message: 'Failed to save color' });
    }
  };

  const fetchColors = async () => {
    setLoading(true);
    try {
      const list = await listColors();
      // Normalize fields
      const normalized = Array.isArray(list) ? list.map(c => ({
        id: c.id || `${c.name}-${c.hexCode}`,
        name: c.name || '',
        hexCode: c.hexCode || '',
        examples: Array.isArray(c.examples) ? c.examples : [],
      })) : [];
      setColors(normalized);
    } catch (e) {
      console.error('Failed to load colors', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = colors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.hexCode || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="ww-page">
      <header className="ww-page-header">
        <h1>Create Color</h1>
        <p className="ww-sub">Add a color and optional details to your collection</p>
      </header>

      <section className="ww-table-card" style={{ marginTop: 24 }}>
        <div className="ww-table-toolbar">
          <input
            className="ww-input ww-search-input"
            placeholder="Search by color or hex..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ww-btn" type="button" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add New
          </button>
        </div>

        <div className="ww-table-wrapper">
          <table className="ww-table">
            <thead>
              <tr>
                <th className="ww-th" style={{ width: 60 }}>SR</th>
                <th className="ww-th">COLOR</th>
                <th className="ww-th" style={{ width: 160 }}>HEX</th>
                <th className="ww-th">EXAMPLES</th>
                <th className="ww-th" style={{ width: 160 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="ww-td" colSpan={5}>Loading...</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td className="ww-td" colSpan={5}>No data found</td>
                </tr>
              ) : (
                pageItems.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="ww-td ww-td-index">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="ww-td">{c.name}</td>
                    <td className="ww-td">
                      {c.hexCode ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: c.hexCode
                          }} />
                          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                            {String(c.hexCode).toLowerCase()}
                          </span>
                        </div>
                      ) : ('-')}
                    </td>
                    <td className="ww-td">{c.examples && c.examples.length ? c.examples.join(', ') : '-'}</td>
                    <td className="ww-td">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="ww-btn ww-btn-secondary"
                          onClick={() => {
                            setEditingColor(c);
                            setColorName(c.name || '');
                            setHexCode(c.hexCode || '');
                            setExampleWord(c.examples?.[0] || '');
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          type="button"
                          className="ww-btn"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ww-pagination">
          <button className="ww-page-btn" type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
          <span className="ww-page-indicator">Page {currentPage} of {totalPages}</span>
          <button className="ww-page-btn" type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </section>

      {showModal && (
        <div className="ww-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="ww-modal" role="dialog" aria-modal="true">
            <div className="ww-modal-header">
              <h2>{editingColor ? 'Edit Color' : 'Add Color'}</h2>
              <button className="ww-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="ww-form" onSubmit={onSubmit}>
              <div className="ww-form-group">
                <label className="ww-label">
                  <Palette size={16} />
                  Color Name
                </label>
                <input
                  type="text"
                  className="ww-input"
                  placeholder="Enter color name"
                  value={colorName}
                  onChange={(e) => { setColorName(e.target.value); if (errors.name) setErrors((er) => ({ ...er, name: undefined })); }}
                  required
                />
                {errors.name ? (
                  <p className="ww-helper" style={{ color: '#b42318' }}>{errors.name}</p>
                ) : (
                  <p className="ww-helper">This field is required</p>
                )}
              </div>

              <div className="ww-form-group">
                <label className="ww-label">
                  <Hash size={16} />
                  Hex Code
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={hexCode || '#000000'}
                    onChange={(e) => { setHexCode(e.target.value); if (errors.hex) setErrors((er) => ({ ...er, hex: undefined })); }}
                    aria-label="Pick color"
                    style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                  />
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: hexCode || '#000000',
                    cursor: 'pointer'
                  }}
                  onClick={() => colorInputRef.current?.click()}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText((hexCode || '#000000').toLowerCase());
                        setToast({ open: true, type: 'success', message: 'Hex copied' });
                      } catch (_) { /* noop */ }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: hexCode || '#000000',
                      color: contrastText(hexCode),
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 13,
                      boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.08)',
                      cursor: 'pointer'
                    }}
                    title="Click to copy"
                  >
                    {(hexCode || '#000000').toLowerCase()}
                    <Copy size={14} />
                  </button>
                </div>
                <p className="ww-helper">Optional</p>
              </div>

              <div className="ww-form-group">
                <label className="ww-label">
                  <Type size={16} />
                  Example Word
                </label>
                <input
                  type="text"
                  className="ww-input"
                  placeholder="Example word... (optional)"
                  value={exampleWord}
                  onChange={(e) => setExampleWord(e.target.value)}
                />
                <p className="ww-helper">Optional</p>
              </div>

              <div className="ww-actions">
                <button type="submit" className="ww-btn">
                  <Plus size={18} />
                  {editingColor ? 'Update Color' : 'Create Color'}
                </button>
                <button
                  type="button"
                  className="ww-btn ww-btn-secondary"
                  onClick={() => {
                    setColorName('');
                    setHexCode('');
                    setExampleWord('');
                    setShowModal(false);
                    setEditingColor(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="ww-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="ww-modal" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
            <div className="ww-modal-header">
              <h2>Delete Color</h2>
              <button className="ww-modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 12 }}>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
            </div>
            <div className="ww-actions" style={{ padding: '0 12px 12px' }}>
              <button type="button" className="ww-btn ww-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                type="button"
                className="ww-btn"
                onClick={async () => {
                  try {
                    await deleteColor(deleteTarget.id);
                    await fetchColors();
                    setToast({ open: true, type: 'success', message: 'Color deleted' });
                  } catch (e) {
                    console.error(e);
                    setToast({ open: true, type: 'error', message: 'Failed to delete' });
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast
        open={toast.open}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
