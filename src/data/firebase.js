// Firebase configuration for B&F Style
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  startAt,
  endAt,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
  // La URL de Realtime Database se infiere del projectId, pero si falla podés agregar:
  // databaseURL: "https://barberia-3d632-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ============================================================
// Collections
// ============================================================
const COLLECTIONS = {
  APPOINTMENTS: 'appointments',
  TRANSACTIONS: 'transactions',
  EXPENSES: 'expenses',
};

// ============================================================
// Timeout wrapper
// ============================================================
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Realtime Database timeout: Verificá tus reglas.`)), ms)
    ),
  ]);
}

// ============================================================
// Helper: sort arrays client-side
// ============================================================
function sortByField(docs, field, direction = 'asc') {
  return docs.sort((a, b) => {
    const valA = a[field] ?? 0;
    const valB = b[field] ?? 0;
    return direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });
}

// ============================================================
// APPOINTMENTS
// ============================================================
export async function addAppointment(data) {
  const newRef = push(ref(db, COLLECTIONS.APPOINTMENTS));
  await withTimeout(
    set(newRef, {
      ...data,
      status: 'pending',
      createdAt: Date.now(),
    })
  );
  return newRef.key;
}

export async function getAppointmentsByBarberAndDate(barberId, dateStr) {
  const q = query(ref(db, COLLECTIONS.APPOINTMENTS), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'time', 'asc');
}

export async function completeAppointment(appointmentId, paymentMethod) {
  const docRef = ref(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}`);
  await withTimeout(
    update(docRef, {
      status: 'completed',
      paymentMethod,
      completedAt: Date.now(),
    })
  );
}

export async function cancelAppointment(appointmentId) {
  const docRef = ref(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}`);
  await withTimeout(update(docRef, { status: 'cancelled' }));
}

export async function blockSlot(barberId, dateStr, time) {
  const newRef = push(ref(db, COLLECTIONS.APPOINTMENTS));
  await withTimeout(
    set(newRef, {
      barberId,
      date: dateStr,
      time,
      status: 'blocked',
      createdAt: Date.now(),
    })
  );
  return newRef.key;
}

export async function unblockSlot(appointmentId) {
  const docRef = ref(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}`);
  await withTimeout(remove(docRef));
}

export async function getAppointmentsByDate(dateStr) {
  const q = query(ref(db, COLLECTIONS.APPOINTMENTS), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      docs.push({ id: child.key, ...child.val() });
    });
  }
  return sortByField(docs, 'time', 'asc');
}

export async function isSlotAvailable(barberId, dateStr, time) {
  const q = query(ref(db, COLLECTIONS.APPOINTMENTS), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  let isAvailable = true;
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId && data.time === time && (data.status === 'pending' || data.status === 'blocked' || data.status === 'completed')) {
        isAvailable = false;
      }
    });
  }
  return isAvailable;
}

// ============================================================
// TRANSACTIONS
// ============================================================
export async function addTransaction(data) {
  const newRef = push(ref(db, COLLECTIONS.TRANSACTIONS));
  await withTimeout(
    set(newRef, {
      ...data,
      createdAt: Date.now(),
    })
  );
  return newRef.key;
}

export async function getTransactionsByBarberAndDate(barberId, dateStr) {
  const q = query(ref(db, COLLECTIONS.TRANSACTIONS), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function getTransactionsByBarberAndMonth(barberId, yearMonth) {
  const q = query(ref(db, COLLECTIONS.TRANSACTIONS), orderByChild('yearMonth'), equalTo(yearMonth));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function getTransactionsByBarberAndDateRange(barberId, startDate, endDate) {
  const q = query(
    ref(db, COLLECTIONS.TRANSACTIONS),
    orderByChild('date'),
    startAt(startDate),
    endAt(endDate)
  );
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function deleteTransaction(transactionId) {
  const docRef = ref(db, `${COLLECTIONS.TRANSACTIONS}/${transactionId}`);
  await withTimeout(remove(docRef));
}

// ============================================================
// EXPENSES
// ============================================================
export async function addExpense(data) {
  const newRef = push(ref(db, COLLECTIONS.EXPENSES));
  await withTimeout(
    set(newRef, {
      ...data,
      createdAt: Date.now(),
    })
  );
  return newRef.key;
}

export async function getExpensesByBarberAndDate(barberId, dateStr) {
  const q = query(ref(db, COLLECTIONS.EXPENSES), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function getExpensesByBarberAndMonth(barberId, yearMonth) {
  const q = query(ref(db, COLLECTIONS.EXPENSES), orderByChild('yearMonth'), equalTo(yearMonth));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function getExpensesByBarberAndDateRange(barberId, startDate, endDate) {
  const q = query(
    ref(db, COLLECTIONS.EXPENSES),
    orderByChild('date'),
    startAt(startDate),
    endAt(endDate)
  );
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.barberId === barberId) {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function deleteExpense(expenseId) {
  const docRef = ref(db, `${COLLECTIONS.EXPENSES}/${expenseId}`);
  await withTimeout(remove(docRef));
}

// ============================================================
// HELPERS
// ============================================================
export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export { db };
