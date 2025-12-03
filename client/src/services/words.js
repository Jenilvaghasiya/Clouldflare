import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firestore structure: words/{level}/items/{docId}

export async function addWord({ text, level, gifFile, gifUrl }) {
  if (!text || !level) throw new Error('text and level are required');

  const levelItemsCol = collection(db, 'words', level, 'items');

  // create doc first to get ID
  const created = await addDoc(levelItemsCol, {
    text,
    level,
    gifUrl: gifUrl || null,
    createdAt: serverTimestamp(),
  });

  let finalGifUrl = gifUrl || null;

  if (gifFile) {
    const storagePath = `words/${level}/${created.id}-${gifFile.name}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, gifFile);
    finalGifUrl = await getDownloadURL(fileRef);
    await updateDoc(doc(db, 'words', level, 'items', created.id), { gifUrl: finalGifUrl });
  }

  return { id: created.id, text, level, gifUrl: finalGifUrl };
}

export async function listWordsByLevel(level) {
  const col = collection(db, 'words', level, 'items');
  const snapshot = await getDocs(col);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateWord(level, id, updates) {
  if (!level || !id) throw new Error('level and id are required');
  const refDoc = doc(db, 'words', level, 'items', id);
  await updateDoc(refDoc, updates);
  const snap = await getDoc(refDoc);
  return { id, ...snap.data() };
}

export async function deleteWord(level, id) {
  if (!level || !id) throw new Error('level and id are required');
  await deleteDoc(doc(db, 'words', level, 'items', id));
  return true;
}

const VOCAB_COLLECTION = 'words';
const VOCAB_DOC_ID = 'vocabulary_data';

export async function seedVocabularyData(levels) {
  if (!Array.isArray(levels)) throw new Error('levels must be an array');
  await setDoc(doc(db, VOCAB_COLLECTION, VOCAB_DOC_ID), { levels });
}

export async function getVocabularyData() {
  const snap = await getDoc(doc(db, VOCAB_COLLECTION, VOCAB_DOC_ID));
  return snap.exists() ? snap.data() : { levels: [] };
}

export async function addLevel(levelName) {
  if (!levelName) throw new Error('levelName is required');
  const refDoc = doc(db, VOCAB_COLLECTION, VOCAB_DOC_ID);
  const snap = await getDoc(refDoc);
  const current = snap.exists() ? snap.data() : { levels: [] };
  if (current.levels.some(l => l.level === levelName)) return; // already exists
  current.levels.push({ level: levelName, words: [] });
  await setDoc(refDoc, current);
}

export async function addWordToLevel(levelName, word) {
  if (!levelName) throw new Error('levelName is required');
  if (!word || !word.text || !word.id) throw new Error('word must have id and text');

  const refDoc = doc(db, VOCAB_COLLECTION, VOCAB_DOC_ID);
  const snap = await getDoc(refDoc);
  const current = snap.exists() ? snap.data() : { levels: [] };
  let level = current.levels.find(l => l.level === levelName);
  if (!level) {
    level = { level: levelName, words: [] };
    current.levels.push(level);
  }
  level.words.push({
    gifPath: word.gifPath || '',
    id: word.id,
    text: word.text,
  });
  await setDoc(refDoc, current);
}
