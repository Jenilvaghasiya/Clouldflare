import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const COLLECTION = 'colors';
const DOC_ID = 'color_data';

function ensureShape(data) {
  if (!data || typeof data !== 'object') return { colors: [] };
  if (!Array.isArray(data.colors)) return { colors: [] };
  return { colors: data.colors };
}

export async function listColors() {
  const ref = doc(db, COLLECTION, DOC_ID);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { colors: [] };
  return ensureShape(data).colors;
}

export async function addColor({ id, name, hexCode = '', examples = [] }) {
  if (!name) throw new Error('name is required');
  const newColor = {
    id: id || `c${Date.now()}`,
    name: name.trim(),
    hexCode: hexCode?.trim?.() || '',
    examples: Array.isArray(examples) ? examples : [],
  };

  const ref = doc(db, COLLECTION, DOC_ID);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { colors: [] };
  const safe = ensureShape(data);
  const updated = [...safe.colors, newColor];
  await setDoc(ref, { colors: updated });
  return newColor;
}

export async function replaceColors(colors) {
  if (!Array.isArray(colors)) throw new Error('colors must be an array');
  const ref = doc(db, COLLECTION, DOC_ID);
  await setDoc(ref, { colors });
  return colors;
}

// Update an existing color by id
export async function updateColor(id, updates) {
  if (!id) throw new Error('id is required');
  const ref = doc(db, COLLECTION, DOC_ID);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { colors: [] };
  const safe = ensureShape(data);
  const next = safe.colors.map((c) => (c.id === id ? { ...c, ...updates } : c));
  await setDoc(ref, { colors: next });
  return next.find((c) => c.id === id);
}

// Delete a color by id
export async function deleteColor(id) {
  if (!id) throw new Error('id is required');
  const ref = doc(db, COLLECTION, DOC_ID);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : { colors: [] };
  const safe = ensureShape(data);
  const next = safe.colors.filter((c) => c.id !== id);
  await setDoc(ref, { colors: next });
  return true;
}
