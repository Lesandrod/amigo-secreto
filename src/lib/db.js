import fs from 'fs';
import path from 'path';
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export const INITIAL_PARTICIPANTS = [
  { id: '1', name: 'Lennard', revealed: false },
  { id: '2', name: 'Eduardo', revealed: false },
  { id: '3', name: 'William Vasquez', revealed: false },
  { id: '4', name: 'Albert Jared', revealed: false },
  { id: '5', name: 'Paolo Garcia', revealed: false },
  { id: '6', name: 'Cesar (Charro)', revealed: false },
  { id: '7', name: 'Roberto Carlos', revealed: false },
  { id: '8', name: 'Percy', revealed: false }
];

// Helper: Check if a valid bipartite derangement exists between remaining givers and remaining receivers
function hasValidDerangement(remainingGivers, remainingReceivers) {
  if (remainingGivers.length === 0) return true;
  if (remainingGivers.length !== remainingReceivers.length) return false;

  function findAugmentingPath(giverIdx, match, visited) {
    const giver = remainingGivers[giverIdx];
    for (let rIdx = 0; rIdx < remainingReceivers.length; rIdx++) {
      const receiver = remainingReceivers[rIdx];
      if (giver.id === receiver.id) continue; // cannot match with oneself

      if (!visited[rIdx]) {
        visited[rIdx] = true;
        if (match[rIdx] === undefined || findAugmentingPath(match[rIdx], match, visited)) {
          match[rIdx] = giverIdx;
          return true;
        }
      }
    }
    return false;
  }

  const match = {};
  for (let gIdx = 0; gIdx < remainingGivers.length; gIdx++) {
    const visited = {};
    if (!findAugmentingPath(gIdx, match, visited)) {
      return false;
    }
  }
  return true;
}

// Select a purely random valid receiver at the moment of spin
export function pickRandomFriendAtSpinTime(currentUserId, allParticipants, currentPairings) {
  const currentGiver = allParticipants.find((p) => p.id === currentUserId);
  if (!currentGiver) throw new Error('Participante no encontrado.');

  // Set of receivers already assigned to previous spinners
  const assignedReceiverIds = new Set(Object.values(currentPairings));

  // Remaining givers (who haven't spun yet and aren't currentGiver)
  const remainingGivers = allParticipants.filter(
    (p) => !p.revealed && p.id !== currentUserId
  );

  // Available candidate receivers (haven't been assigned yet, and not currentGiver)
  const availableReceivers = allParticipants.filter(
    (p) => !assignedReceiverIds.has(p.id) && p.id !== currentUserId
  );

  if (availableReceivers.length === 0) {
    throw new Error('No hay participantes disponibles para asignar.');
  }

  // Filter candidates that leave a valid configuration for the remaining friends
  const validCandidates = availableReceivers.filter((cand) => {
    const nextRemainingReceivers = allParticipants.filter(
      (p) => !assignedReceiverIds.has(p.id) && p.id !== cand.id
    );
    return hasValidDerangement(remainingGivers, nextRemainingReceivers);
  });

  if (validCandidates.length === 0) {
    // Fallback if needed
    return availableReceivers[Math.floor(Math.random() * availableReceivers.length)];
  }

  // Purely random choice among valid candidates at this exact instant!
  const randomIndex = Math.floor(Math.random() * validCandidates.length);
  return validCandidates[randomIndex];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const store = {
      participants: INITIAL_PARTICIPANTS,
      pairings: {} // No pre-generated pairings! Created randomly on the spot!
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return store;
  }
  try {
    const content = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const store = {
      participants: INITIAL_PARTICIPANTS,
      pairings: {}
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    return store;
  }
}

function saveLocalStore(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Wipe and re-seed clean database (EMPTY pairings, ready for real-time live random draws)
export async function seedCleanDatabase() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(doc(db, 'participants', d.id));
      });

      for (const p of INITIAL_PARTICIPANTS) {
        batch.set(doc(db, 'participants', p.id), p);
      }
      batch.set(doc(db, 'system', 'pairings'), {}); // Clean, no pre-decided pairs!
      batch.set(doc(db, 'system', 'meta'), {
        updatedAt: new Date().toISOString(),
        total: INITIAL_PARTICIPANTS.length,
        mode: 'realtime_random'
      });
      await batch.commit();
      console.log('Firestore cleaned. Ready for real-time random draws.');
    } catch (e) {
      console.error('Error seeding Firestore:', e);
    }
  }

  const store = {
    participants: INITIAL_PARTICIPANTS,
    pairings: {}
  };
  saveLocalStore(store);
  return store;
}

// 1. Get Public Participants List
export async function getPublicParticipants() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      if (snap.empty) {
        await seedCleanDatabase();
        return INITIAL_PARTICIPANTS;
      }
      const list = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id,
          name: data.name,
          revealed: Boolean(data.revealed)
        });
      });
      return list.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0));
    } catch (e) {
      console.error('Firebase error, fallback to local store:', e);
    }
  }

  const store = ensureLocalStore();
  return store.participants.map((p) => ({
    id: p.id,
    name: p.name,
    revealed: Boolean(p.revealed)
  }));
}

// 2. Real-time random draw executed AT THE EXACT MOMENT of spinning!
export async function revealAndLockFriend(userId) {
  if (!userId) throw new Error('ID de participante requerido.');

  let allParticipants = [];
  let currentPairings = {};

  if (isFirebaseConfigured && db) {
    try {
      const pSnap = await getDoc(doc(db, 'participants', userId));
      if (!pSnap.exists()) throw new Error('Participante no encontrado.');
      const user = pSnap.data();

      if (user.revealed) {
        throw new Error('Este participante ya realizó su sorteo y está bloqueado.');
      }

      const allSnap = await getDocs(collection(db, 'participants'));
      allSnap.forEach((d) => allParticipants.push(d.data()));

      const pairSnap = await getDoc(doc(db, 'system', 'pairings'));
      currentPairings = pairSnap.exists() ? pairSnap.data() : {};

      // Pick purely randomly on the spot!
      const chosenFriend = pickRandomFriendAtSpinTime(userId, allParticipants, currentPairings);

      // Save pairing and lock user in Firebase Firestore
      const updatedPairings = {
        ...currentPairings,
        [userId]: chosenFriend.id
      };

      const batch = writeBatch(db);
      batch.update(doc(db, 'participants', userId), { revealed: true });
      batch.set(doc(db, 'system', 'pairings'), updatedPairings);
      await batch.commit();

      // Other candidates on the table for this round
      const assignedSet = new Set(Object.values(currentPairings));
      const otherAvailable = allParticipants.filter(
        (p) => !assignedSet.has(p.id) && p.id !== userId && p.id !== chosenFriend.id
      );

      return {
        success: true,
        assignedFriend: { id: chosenFriend.id, name: chosenFriend.name },
        otherCandidates: otherAvailable.map((p) => ({ id: p.id, name: p.name }))
      };
    } catch (e) {
      if (e.message.includes('ya realizó')) throw e;
      console.error('Firebase draw error, fallback to local store:', e);
    }
  }

  const store = ensureLocalStore();
  const user = store.participants.find((p) => p.id === userId);
  if (!user) throw new Error('Participante no encontrado.');
  if (user.revealed) throw new Error('Este participante ya realizó su sorteo y está bloqueado.');

  // Pick randomly on the spot
  const chosenFriend = pickRandomFriendAtSpinTime(userId, store.participants, store.pairings || {});

  store.pairings = store.pairings || {};
  store.pairings[userId] = chosenFriend.id;
  user.revealed = true;
  saveLocalStore(store);

  const assignedSet = new Set(Object.values(store.pairings || {}));
  const otherAvailable = store.participants.filter(
    (p) => !assignedSet.has(p.id) && p.id !== userId && p.id !== chosenFriend.id
  );

  return {
    success: true,
    assignedFriend: { id: chosenFriend.id, name: chosenFriend.name },
    otherCandidates: otherAvailable.map((p) => ({ id: p.id, name: p.name }))
  };
}

// 3. Admin: Get status with live pairings
export async function getAdminData() {
  if (isFirebaseConfigured && db) {
    try {
      const allSnap = await getDocs(collection(db, 'participants'));
      const participants = [];
      allSnap.forEach((d) => {
        const data = d.data();
        participants.push({
          id: data.id,
          name: data.name,
          revealed: Boolean(data.revealed)
        });
      });

      const pairSnap = await getDoc(doc(db, 'system', 'pairings'));
      const pairings = pairSnap.exists() ? pairSnap.data() : {};

      return {
        participants: participants.sort((a, b) => parseInt(a.id || 0) - parseInt(b.id || 0)),
        pairings,
        isFirebase: true
      };
    } catch (e) {
      console.error('Firebase admin get error:', e);
    }
  }

  const store = ensureLocalStore();
  return {
    participants: store.participants,
    pairings: store.pairings || {},
    isFirebase: false
  };
}

// 4. Admin: Reset draw (clears all pairings and unblocks everyone)
export async function resetDraw() {
  if (isFirebaseConfigured && db) {
    try {
      const allSnap = await getDocs(collection(db, 'participants'));
      const participants = [];
      allSnap.forEach((d) => participants.push(d.data()));

      const batch = writeBatch(db);
      for (const p of participants) {
        batch.update(doc(db, 'participants', p.id), {
          revealed: false
        });
      }
      batch.set(doc(db, 'system', 'pairings'), {}); // No pre-assigned pairs!
      await batch.commit();

      return { success: true, count: participants.length };
    } catch (e) {
      console.error('Firebase reset error:', e);
    }
  }

  const store = ensureLocalStore();
  store.participants = store.participants.map((p) => ({ ...p, revealed: false }));
  store.pairings = {};
  saveLocalStore(store);
  return { success: true, count: store.participants.length };
}

// 5. Admin: Add participant
export async function addParticipant(name) {
  const newP = {
    id: Date.now().toString(),
    name: name.trim(),
    revealed: false
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'participants', newP.id), newP);
      return newP;
    } catch (e) {
      console.error('Firebase add error:', e);
    }
  }

  const store = ensureLocalStore();
  store.participants.push(newP);
  saveLocalStore(store);
  return newP;
}

// 6. Admin: Delete participant
export async function deleteParticipant(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'participants', id));
      return { success: true };
    } catch (e) {
      console.error('Firebase delete error:', e);
    }
  }

  const store = ensureLocalStore();
  store.participants = store.participants.filter((p) => p.id !== id);
  if (store.pairings) {
    delete store.pairings[id];
  }
  saveLocalStore(store);
  return { success: true };
}
