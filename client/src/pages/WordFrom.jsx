import React, { useState, useEffect } from 'react';
import { Upload, Link2, FileText, Plus, X, Pencil, Trash2, Eye } from 'lucide-react';
import { addWord, listWordsByLevel, updateWord, deleteWord } from '../services/words';
import Toast from '../components/Toast';

export default function WordFrom() {
  const [text, setText] = useState('');
  const [gifFile, setGifFile] = useState(null);
  const [gifPath, setGifPath] = useState('');
  const [preview, setPreview] = useState('');
  const [grade, setGrade] = useState('Pre-KG');
  const [submitting, setSubmitting] = useState(false);
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingWords, setLoadingWords] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const [gifViewer, setGifViewer] = useState({ open: false, url: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});

  const PAGE_SIZE = 5;
  const LEVELS = ['Pre-KG', 'LKG', 'UKG', '1st Std'];

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setGifFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setGifPath('');
    } else {
      setPreview('');
    }
  };

  const onPathChange = (e) => {
    setGifPath(e.target.value);
    setGifFile(null);
    setPreview(e.target.value);
  };

  const removePreview = () => {
    setPreview('');
    setGifFile(null);
    setGifPath('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!text.trim()) nextErrors.text = 'Word is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setToast({ open: true, type: 'error', message: 'Please fix form errors' });
      return;
    }
    try {
      setSubmitting(true);
      if (editingWord) {
        await updateWord(grade, editingWord.id, {
          text,
          level: grade,
          gifUrl: gifPath || preview || null,
        });
        setToast({ open: true, type: 'success', message: 'Word updated' });
      } else {
        const created = await addWord({
          text,
          level: grade,
          gifFile,
          gifUrl: gifPath || undefined,
        });
        console.log('Created word:', created);
        setToast({ open: true, type: 'success', message: 'Word created' });
      }
      // reset
      setText('');
      setGifFile(null);
      setGifPath('');
      setPreview('');
      setGrade('Pre-KG');
      setErrors({});
      // refresh table
      await fetchAllWords();
      setShowModal(false);
      setEditingWord(null);
    } catch (err) {
      console.error(err);
      setToast({ open: true, type: 'error', message: 'Failed to save entry' });
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch words across all levels
  const fetchAllWords = async () => {
    setLoadingWords(true);
    try {
      const results = await Promise.all(LEVELS.map((lvl) => listWordsByLevel(lvl)));
      const combined = results
        .flat()
        .map((w) => ({ ...w, level: w.level || w.levelName || w.grade || '' }))
        .sort((a, b) => {
          const as = a.createdAt?.seconds || 0;
          const bs = b.createdAt?.seconds || 0;
          return bs - as;
        });
      setWords(combined);
    } catch (e) {
      console.error('Failed to load words', e);
    } finally {
      setLoadingWords(false);
    }
  };

  useEffect(() => {
    fetchAllWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // search + pagination (derived)
  const filtered = words.filter((w) =>
    w.text?.toLowerCase().includes(search.toLowerCase()) ||
    w.level?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="ww-page">
      <header className="ww-page-header">
        <h1>Write Words</h1>
        <p className="ww-sub">Add text and an optional GIF to your collection</p>
      </header>

      {/* Table Section */}
      <section className="ww-table-card" style={{ marginTop: 24 }}>
        <div className="ww-table-toolbar">
          <input
            className="ww-input ww-search-input"
            placeholder="Search by word or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="ww-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add New
          </button>
        </div>

        <div className="ww-table-wrapper">
          <table className="ww-table">
            <thead>
              <tr>
                <th className="ww-th" style={{ width: 60 }}>SR</th>
                <th className="ww-th">WORD</th>
                <th className="ww-th" style={{ width: 160 }}>CLASS</th>
                <th className="ww-th" style={{ width: 140 }}>GIF</th>
                <th className="ww-th" style={{ width: 180 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loadingWords ? (
                <tr>
                  <td className="ww-td" colSpan={5}>Loading...</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td className="ww-td" colSpan={5}>No data found</td>
                </tr>
              ) : (
                pageItems.map((w, idx) => (
                  <tr key={w.id}>
                    <td className="ww-td ww-td-index">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="ww-td">{w.text}</td>
                    <td className="ww-td">{w.level || '-'}</td>
                    <td className="ww-td">
                      {w.gifUrl ? (
                        <button type="button" className="ww-btn ww-btn-secondary" onClick={() => setGifViewer({ open: true, url: w.gifUrl })}>
                          <Eye size={16} /> View
                        </button>
                      ) : ('-')}
                    </td>
                    <td className="ww-td">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="ww-btn ww-btn-secondary"
                          onClick={() => {
                            setEditingWord(w);
                            setGrade(w.level || 'Pre-KG');
                            setText(w.text || '');
                            setGifFile(null);
                            setGifPath(w.gifUrl || '');
                            setPreview(w.gifUrl || '');
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          type="button"
                          className="ww-btn"
                          onClick={() => setDeleteTarget(w)}
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
          <button
            className="ww-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            Prev
          </button>
          <span className="ww-page-indicator">Page {currentPage} of {totalPages}</span>
          <button
            className="ww-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="ww-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className="ww-modal" role="dialog" aria-modal="true">
            <div className="ww-modal-header">
              <h2>{editingWord ? 'Edit Word' : 'Add Word'}</h2>
              <button className="ww-modal-close" onClick={() => setShowModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="ww-form" onSubmit={onSubmit}>
              <div className="ww-form-group">
                <label className="ww-label">
                  <FileText size={16} />
                  Class
                </label>
                <select
                  className="ww-input"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option value="Pre-KG">Pre-KG</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1st Std">1st Std</option>
                </select>
              </div>

              <div className="ww-form-group">
                <label className="ww-label">
                  <FileText size={16} />
                  Enter Words
                </label>
                <input
                  type="text"
                  className="ww-input"
                  placeholder="Enter words...."
                  value={text}
                  onChange={(e) => { setText(e.target.value); if (errors.text) setErrors((er) => ({ ...er, text: undefined })); }}
                  required
                />
                {errors.text && (
                  <p className="ww-helper" style={{ color: '#b42318' }}>{errors.text}</p>
                )}
              </div>
              <div className="ww-split">
                <div className="ww-form-group">
                  <label className="ww-label">
                    <Upload size={16} />
                    Upload GIF
                  </label>
                  <div className="ww-file-input-wrapper">
                    <input
                      type="file"
                      className="ww-file-input"
                      onChange={onFileChange}
                    />
                    <div className="ww-file-button">
                      <Upload size={18} />
                      {gifFile ? gifFile.name : 'Choose a GIF file'}
                    </div>
                  </div>
                  <p className="ww-helper">Upload from your device</p>
                </div>
                <div className="ww-form-group">
                  <label className="ww-label">
                    <Link2 size={16} />
                    Or Paste GIF URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.gif"
                    className="ww-input"
                    value={gifPath}
                    onChange={onPathChange}
                  />
                  <p className="ww-helper">Link to an external GIF</p>
                </div>
              </div>
              {preview && (
                <div className="ww-preview">
                  <div className="ww-preview-container">
                    <img src={preview} alt="GIF preview" />
                    <button
                      type="button"
                      className="ww-preview-remove"
                      onClick={removePreview}
                      aria-label="Remove preview"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              <div className="ww-actions">
                <button type="submit" className="ww-btn" disabled={submitting}>
                  <Plus size={18} />
                  {submitting ? (editingWord ? 'Saving...' : 'Creating...') : (editingWord ? 'Save Changes' : 'Create Entry')}
                </button>
                <button type="button" className="ww-btn ww-btn-secondary" onClick={() => { setShowModal(false); setEditingWord(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {gifViewer.open && (
        <div className="ww-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setGifViewer({ open: false, url: '' }); }}>
          <div className="ww-modal" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
            <div className="ww-modal-header">
              <h2>Preview GIF</h2>
              <button className="ww-modal-close" onClick={() => setGifViewer({ open: false, url: '' })} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 12 }}>
              <img src={gifViewer.url} alt="GIF" style={{ width: '100%', borderRadius: 8 }} />
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="ww-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="ww-modal" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
            <div className="ww-modal-header">
              <h2>Delete Word</h2>
              <button className="ww-modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 12 }}>
              <p>Are you sure you want to delete <strong>{deleteTarget.text}</strong> from <strong>{deleteTarget.level}</strong>?</p>
            </div>
            <div className="ww-actions" style={{ padding: '0 12px 12px' }}>
              <button type="button" className="ww-btn ww-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                type="button"
                className="ww-btn"
                onClick={async () => {
                  try {
                    await deleteWord(deleteTarget.level, deleteTarget.id);
                    await fetchAllWords();
                    setToast({ open: true, type: 'success', message: 'Word deleted' });
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