// B&F Style - Constantes de la aplicación

export const BARBERS = [
  {
    id: 'emanuel',
    name: 'Emanuel',
    avatar: '💈',
    services: ['corte-degrade', 'degrade-barba', 'barba-sola'],
  },
  {
    id: 'facundo',
    name: 'Facundo',
    avatar: '✂️',
    services: ['corte-degrade', 'degrade-barba', 'barba-sola', 'global-corte', 'mechas-corte'],
  },
];

export const SERVICES = [
  {
    id: 'corte-degrade',
    name: 'Corte Degradé',
    price: 10000,
    duration: 30, // minutos
    icon: '✂️',
  },
  {
    id: 'degrade-barba',
    name: 'Corte Degradé + Barba',
    price: 12000,
    duration: 45,
    icon: '💇‍♂️',
  },
  {
    id: 'barba-sola',
    name: 'Barba Sola',
    price: 6000,
    duration: 20,
    icon: '🪒',
  },
  {
    id: 'global-corte',
    name: 'Global + Corte Completo',
    price: 45000,
    duration: 90,
    icon: '🌟',
    exclusive: 'facundo',
  },
  {
    id: 'mechas-corte',
    name: 'Mechas + Corte',
    price: 35000,
    duration: 75,
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

// Horarios de atención
export const BUSINESS_HOURS = {
  start: 15, // 15:00
  end: 22,  // 22:00
  slotMinutes: 30,
};

// Credenciales por defecto (en producción irían hasheadas)
export const DEFAULT_CREDENTIALS = {
  emanuel: 'emanuel2024',
  facundo: 'facundo2024',
};

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

// Helper: generar slots de tiempo disponibles
export function generateTimeSlots() {
  const slots = [];
  const { start, end, slotMinutes } = BUSINESS_HOURS;
  for (let hour = start; hour < end; hour++) {
    for (let min = 0; min < 60; min += slotMinutes) {
      slots.push(
        `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      );
    }
  }
  return slots;
}
