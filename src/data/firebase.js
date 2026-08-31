// Firebase configuration for B&F Style
import { initializeApp } from 'firebase/app';
import { timeToMinutes } from './constants';
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
  DEBTS: 'debts',
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
  // Validación de datos antes de escribir en Firebase
  const requiredFields = ['clientName', 'clientPhone', 'barberId', 'date', 'time', 'serviceId'];
  for (const field of requiredFields) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  // Validar longitudes máximas
  if (data.clientName.length > 50) throw new Error('Nombre demasiado largo');
  if (data.clientPhone.length > 20) throw new Error('Teléfono demasiado largo');

  // Validar formato de fecha (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('Formato de fecha inválido');

  // Validar formato de hora (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(data.time)) throw new Error('Formato de hora inválido');

  // Validar que el precio sea un número positivo
  if (typeof data.price !== 'number' || data.price <= 0) throw new Error('Precio inválido');

  // Sanitizar: solo guardar campos permitidos
  const sanitizedData = {
    clientName: data.clientName.replace(/<[^>]*>/g, '').trim(),
    clientPhone: data.clientPhone.trim(),
    barberId: data.barberId,
    barberName: data.barberName || '',
    serviceId: data.serviceId,
    serviceName: data.serviceName || '',
    price: data.price,
    duration: data.duration || 40,
    date: data.date,
    time: data.time,
    yearMonth: data.yearMonth || data.date.substring(0, 7),
    status: 'pending',
    createdAt: Date.now(),
  };

  const newRef = push(ref(db, COLLECTIONS.APPOINTMENTS));
  await withTimeout(set(newRef, sanitizedData));
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

export async function markAppointmentAsDebt(appointmentId) {
  const docRef = ref(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}`);
  await withTimeout(
    update(docRef, {
      status: 'debt',
      paymentMethod: 'fiado',
      completedAt: Date.now(),
    })
  );
}

export async function confirmSena(appointmentId) {
  const docRef = ref(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}`);
  await withTimeout(
    update(docRef, {
      senaPaid: true,
      senaConfirmedAt: Date.now(),
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

export async function isSlotAvailable(barberId, dateStr, time, duration = 40) {
  const q = query(ref(db, COLLECTIONS.APPOINTMENTS), orderByChild('date'), equalTo(dateStr));
  const snapshot = await withTimeout(get(q));
  let isAvailable = true;

  if (snapshot.exists()) {
    const newStart = timeToMinutes(time);
    const newEnd = newStart + duration;

    snapshot.forEach((child) => {
      const data = child.val();
      if (
        data.barberId === barberId &&
        (data.status === 'pending' || data.status === 'blocked' || data.status === 'completed')
      ) {
        const apptStart = timeToMinutes(data.time);
        const apptDuration = data.duration || 40; // Default to 40 if old data
        const apptEnd = apptStart + apptDuration;

        // Check for overlap
        if (newStart < apptEnd && newEnd > apptStart) {
          isAvailable = false;
        }
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
// DEBTS (FIADOS)
// ============================================================
export async function addDebt(data) {
  const newRef = push(ref(db, COLLECTIONS.DEBTS));
  await withTimeout(
    set(newRef, {
      ...data,
      status: 'pending',
      createdAt: Date.now(),
    })
  );
  return newRef.key;
}

export async function getPendingDebtsByBarber(barberId) {
  // To get all pending debts, we query by barberId and then filter status client-side
  const q = query(ref(db, COLLECTIONS.DEBTS), orderByChild('barberId'), equalTo(barberId));
  const snapshot = await withTimeout(get(q));
  const docs = [];
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      const data = child.val();
      if (data.status === 'pending') {
        docs.push({ id: child.key, ...data });
      }
    });
  }
  return sortByField(docs, 'createdAt', 'desc');
}

export async function payDebt(debtId, paymentMethod) {
  const docRef = ref(db, `${COLLECTIONS.DEBTS}/${debtId}`);
  await withTimeout(
    update(docRef, {
      status: 'paid',
      paymentMethod,
      paidAt: Date.now(),
    })
  );
}

// ============================================================
// HELPERS
// ============================================================
export function getTodayStr() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
}

export function getCurrentYearMonth() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().substring(0, 7);
}

export { db };
