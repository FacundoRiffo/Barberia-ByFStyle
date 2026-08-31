// B&F Style - Constantes de la aplicación

export const BARBERS = [
  {
    id: 'emanuel',
    name: 'Emanuel',
    avatar: '💈',
    services: ['corte-degrade', 'degrade-barba', 'barba-sola'],
    phone: '5492664224260',
    alias: 'Emaleal.25',
    aliasName: 'Dyago Emanuel Eal',
    schedule: {
      0: [], // Sunday
      1: [], // Monday
      2: [{ start: '16:00', end: '22:00' }], // Tuesday
      3: [{ start: '16:00', end: '22:00' }], // Wednesday
      4: [{ start: '16:00', end: '22:00' }], // Thursday
      5: [{ start: '16:00', end: '22:00' }], // Friday
      6: [{ start: '16:00', end: '22:00' }], // Saturday
    }
  },
  {
    id: 'facundo',
    name: 'Facundo',
    avatar: '✂️',
    services: ['corte-degrade', 'degrade-barba', 'barba-sola', 'global-corte', 'mechas-corte'],
    phone: '5492665025201',
    alias: 'facu.riffo.',
    aliasName: 'Facundo Valentin Riffo',
    schedule: {
      0: [], // Sunday
      1: [{ start: '16:00', end: '22:00' }], // Monday
      2: [{ start: '10:00', end: '13:00' }, { start: '18:15', end: '22:00' }], // Tuesday
      3: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '22:00' }], // Wednesday
      4: [{ start: '10:00', end: '13:00' }, { start: '16:00', end: '19:20' }], // Thursday
      5: [{ start: '10:00', end: '13:00' }, { start: '16:15', end: '22:00' }], // Friday
      6: [{ start: '10:00', end: '13:00' }, { start: '16:15', end: '22:00' }], // Saturday
    }
  },
];

export const SERVICES = [
  {
    id: 'corte-degrade',
    name: 'Corte Degradé',
    price: 10000,
    duration: 40,
    icon: '✂️',
  },
  {
    id: 'degrade-barba',
    name: 'Corte Degradé + Barba',
    price: 12000,
    duration: 40,
    icon: '💇‍♂️',
  },
  {
    id: 'barba-sola',
    name: 'Barba Sola',
    price: 6000,
    duration: 40,
    icon: '🪒',
  },
  {
    id: 'global-corte',
    name: 'Global + Corte Completo',
    price: 45000,
    duration: 270,
    icon: '🌟',
    exclusive: 'facundo',
  },
  {
    id: 'mechas-corte',
    name: 'Mechas + Corte',
    price: 35000,
    duration: 240,
    icon: '🎨',
    exclusive: 'facundo',
  },
];

export const PAYMENT_METHODS = [
  { id: 'efectivo', name: 'Efectivo', icon: '💵' },
  { id: 'transferencia', name: 'Transferencia', icon: '🏦' },
  { id: 'mercadopago', name: 'MercadoPago', icon: '📱' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'barberia', name: 'Gasto de la Barbería', icon: '🏪' },
  { id: 'personal', name: 'Gasto Personal', icon: '👤' },
];

// Credenciales hasheadas (SHA-256) — las contraseñas originales NO están en el código
const CREDENTIAL_HASHES = {
  emanuel: '3c54d748ea637f2d68a19d9ab3204a881e69a706660b16974cc7306ea00582ed',
  facundo: '727c1b1c138181fe62cf842d12042b01edebc80142e3ab6f11d589e8d3b51d5f',
};

// Función de hash usando Web Crypto API (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verificar contraseña: hashea el input y compara con el hash almacenado
export async function verifyPassword(barberId, password) {
  const storedHash = CREDENTIAL_HASHES[barberId];
  if (!storedHash) return false;
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

// Helper: obtener servicios de un barbero
export function getBarberServices(barberId) {
  const barber = BARBERS.find((b) => b.id === barberId);
  if (!barber) return [];
  return SERVICES.filter((s) => barber.services.includes(s.id));
}

// Helper: obtener servicio por ID
export function getServiceById(serviceId) {
  return SERVICES.find((s) => s.id === serviceId);
}

// Helper: obtener barbero por ID
export function getBarberById(barberId) {
  return BARBERS.find((b) => b.id === barberId);
}

// Helper: formatear precio en ARS
export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Convert "HH:MM" to minutes
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Convert minutes to "HH:MM"
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Helper: generar slots de tiempo disponibles
export function generateTimeSlots(barberId, dateStr) {
  if (!barberId || !dateStr) return [];
  
  // Date must be parsed correctly in local timezone to get the correct day of week
  const [year, month, day] = dateStr.split('-');
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();
  
  const barber = getBarberById(barberId);
  if (!barber || !barber.schedule[dayOfWeek]) return [];

  const slots = [];
  const slotDuration = 40; // 40 minutes per slot

  const ranges = barber.schedule[dayOfWeek];
  ranges.forEach((range) => {
    let currentMins = timeToMinutes(range.start);
    const endMins = timeToMinutes(range.end);
    
    // We add slots as long as a full slot (40m) fits within the end time
    while (currentMins + slotDuration <= endMins) {
      slots.push(minutesToTime(currentMins));
      currentMins += slotDuration;
    }
  });

  return slots;
}
