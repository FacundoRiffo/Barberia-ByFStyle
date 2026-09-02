import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BARBERS, SERVICES, PAYMENT_METHODS, getBarberServices, formatPrice, generateTimeSlots, timeToMinutes } from '../../data/constants';
import { addAppointment, getAppointmentsByBarberAndDate, isSlotAvailable } from '../../data/firebase';
import { useToast } from '../../context/ToastContext';

const STEPS = ['Datos', 'Barbero', 'Servicio', 'Fecha y Hora', 'Confirmar'];

export default function BookingPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    barberId: '',
    serviceId: '',
    date: '',
    time: '',
  });

  const allSlots = generateTimeSlots(formData.barberId, formData.date);

// Generate list of selectable dates (Mon‑Sat) starting from today, skipping Sundays
const getAvailableDates = () => {
  const dates = [];
  const start = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDay();
    if (day === 0) continue; // skip Sunday
    dates.push(d);
    if (day === 6) break; // stop after Saturday
  }
  return dates;
};

  // Get min date (today) and max date (7 days from today)
  const todayDate = new Date();
  todayDate.setMinutes(todayDate.getMinutes() - todayDate.getTimezoneOffset());
  const today = todayDate.toISOString().split('T')[0];
  
  const maxDateObj = new Date();
  maxDateObj.setDate(new Date().getDate() + 7);
  maxDateObj.setMinutes(maxDateObj.getMinutes() - maxDateObj.getTimezoneOffset());
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // Fetch booked slots when barber and date are selected
  useEffect(() => {
    async function fetchSlots() {
      if (formData.barberId && formData.date) {
        try {
          const appointments = await getAppointmentsByBarberAndDate(formData.barberId, formData.date);
          const active = appointments.filter(
            (a) => a.status === 'pending' || a.status === 'blocked' || a.status === 'completed'
          );
          setBookedAppointments(active);
        } catch {
          setBookedAppointments([]);
        }
      }
    }
    fetchSlots();
  }, [formData.barberId, formData.date]);

  const selectedBarber = BARBERS.find((b) => b.id === formData.barberId);
  const selectedService = SERVICES.find((s) => s.id === formData.serviceId);
  const availableServices = formData.barberId ? getBarberServices(formData.barberId) : [];

  // Sanitizar input: prevenir inyección de HTML/scripts
  const sanitizeInput = (value) => {
    return value.replace(/<[^>]*>/g, '').trim();
  };

  // Validar formato de teléfono (solo números, guiones, espacios y +)
  const isValidPhone = (phone) => {
    return /^[\d\s\-+()]{7,20}$/.test(phone.trim());
  };

  const canNext = () => {
    switch (step) {
      case 0: {
        const name = sanitizeInput(formData.clientName);
        const phone = formData.clientPhone.trim();
        return name.length >= 2 && name.length <= 50 && phone && isValidPhone(phone);
      }
      case 1: return formData.barberId;
      case 2: return formData.serviceId;
      case 3: return formData.date && formData.time;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validación final antes de enviar
      const clientName = sanitizeInput(formData.clientName);
      const clientPhone = formData.clientPhone.trim();

      if (clientName.length < 2 || !isValidPhone(clientPhone)) {
        addToast('Datos inválidos. Verificá nombre y teléfono.', 'error');
        setLoading(false);
        return;
      }

      // Validar que la fecha no sea pasada
      if (formData.date < today) {
        addToast('No podés reservar en una fecha pasada.', 'error');
        setLoading(false);
        return;
      }

      // Verify slot availability immediately before saving
      const available = await isSlotAvailable(formData.barberId, formData.date, formData.time, selectedService.duration);
      if (!available) {
        addToast('Lo sentimos, este turno acaba de ser reservado. Por favor, elegí otro horario.', 'error');
        setFormData({ ...formData, time: '' });
        setStep(3); // Go back to time selection
        setLoading(false);
        return;
      }

      const yearMonth = formData.date.substring(0, 7);
      const appointmentId = await addAppointment({
        clientName: clientName,
        clientPhone: clientPhone,
        barberId: formData.barberId,
        barberName: selectedBarber.name,
        serviceId: formData.serviceId,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        date: formData.date,
        time: formData.time,
        yearMonth,
      });
      addToast('¡Reserva en revisión! Te enviaremos un WhatsApp al verificar el pago.', 'success');

      // Notificar al barbero por WhatsApp
      if (selectedBarber?.phone) {
        const formattedDate = new Date(formData.date + 'T12:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
        const sena = selectedService.price * 0.3;
        const notifMsg = encodeURIComponent(
          `📋 *NUEVO TURNO AGENDADO*\n\n` +
          `👤 Cliente: ${clientName}\n` +
          `📞 Tel: ${clientPhone}\n` +
          `✂️ Servicio: ${selectedService.name}\n` +
          `📅 Fecha: ${formattedDate}\n` +
          `🕐 Hora: ${formData.time} hs\n` +
          `💰 Precio: $${selectedService.price.toLocaleString('es-AR')}\n` +
          `⚠️ Seña pendiente: $${sena.toLocaleString('es-AR')}\n\n` +
          `_Reserva automática desde la web B&F Style_`
        );
        window.open(`https://wa.me/${selectedBarber.phone}?text=${notifMsg}`, '_blank');
      }

      navigate('/confirmacion', {
        state: {
          appointment: {
            id: appointmentId,
            ...formData,
            barberName: selectedBarber.name,
            serviceName: selectedService.name,
            price: selectedService.price,
          },
        },
      });
    } catch (err) {
      addToast('Error al reservar. Intentá de nuevo.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 sm:pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold font-['Playfair_Display',serif] text-white">
            Reservar <span className="gold-text-gradient">Turno</span>
          </h1>
          <p className="text-gray-400 mt-2">Completá los datos para agendar tu turno</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300
                    ${i < step
                      ? 'bg-gold text-black'
                      : i === step
                        ? 'bg-gold/20 text-gold border-2 border-gold'
                        : 'bg-white/5 text-gray-600 border border-white/10'
                    }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`hidden sm:block text-xs mt-1.5 ${i <= step ? 'text-gold' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 sm:w-12 h-px mx-1 sm:mx-2 mb-0 sm:mb-5 transition-colors ${i < step ? 'bg-gold' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          {/* Step 0: Client Data */}
          {step === 0 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="text-xl font-semibold text-white mb-2">Tus datos</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="Ej: 11-2345-6789"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 1: Barber Selection */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-5">Elegí tu barbero</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BARBERS.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setFormData({ ...formData, barberId: barber.id, serviceId: '' });
                      setTimeout(() => setStep(2), 200);
                    }}
                    className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 hover:scale-[1.02]
                      ${formData.barberId === barber.id
                        ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(201,168,76,0.15)]'
                        : 'border-white/5 bg-bg-elevated hover:border-white/20'
                      }`}
                  >
                    <div className="text-5xl mb-3">{barber.avatar}</div>
                    <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{barber.services.length} servicios disponibles</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Service Selection */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-2">
                Servicios de {selectedBarber?.name}
              </h2>
              <p className="text-gray-500 text-sm mb-5">Seleccioná el servicio que querés</p>
              <div className="space-y-3">
                {availableServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setFormData({ ...formData, serviceId: service.id });
                      setTimeout(() => setStep(3), 200);
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${formData.serviceId === service.id
                        ? 'border-gold bg-gold/10'
                        : 'border-white/5 bg-bg-elevated hover:border-white/15'
                      }`}
                  >
                    <span className="text-2xl">{service.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{service.name}</h3>
                      <p className="text-gray-500 text-xs">{service.duration} min</p>
                    </div>
                    <span className="text-lg font-bold gold-text-gradient">{formatPrice(service.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <h2 className="text-xl font-semibold text-white mb-2">Fecha y hora</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Fecha</label>
                <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                                    {getAvailableDates().map((dateObj, idx) => {
                    const d = new Date(dateObj);
                    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                    const dStr = d.toISOString().split('T')[0];
                    const isSelected = formData.date === dStr;
                    const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'short' });
                    const dayNumber = dateObj.getDate();
                    const isSunday = dateObj.getDay() === 0;
                    return (
                      <button
                        key={dStr}
                        disabled={isSunday}
                        onClick={() => setFormData({ ...formData, date: dStr, time: '' })}
                        className={`min-w-[70px] flex flex-col items-center justify-center py-3 rounded-xl border transition-all
                          ${isSunday ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/5'
                          : isSelected
                            ? 'bg-gold/10 border-gold text-gold shadow-md'
                            : 'bg-bg-elevated border-white/5 text-gray-400 hover:border-gold/30 hover:text-white'}`}
                      >
                        <span className="text-xs font-medium uppercase tracking-wider mb-1">
                          {idx === 0 ? 'Hoy' : dayName}
                        </span>
                        <span className={`text-xl font-bold ${isSelected ? 'text-white' : ''}`}
                        >
                          {dayNumber}
                        </span>
                      </button>
                    );
                  })}
                  {/* Legacy date loop removed – replaced by getAvailableDates() helper */}
                </div>
              </div>
              {formData.date && (
                <div className="animate-fade-in">
                  <label className="block text-sm text-gray-400 mb-3">Horario disponible</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                    {allSlots.map((slot) => {
                      const slotStart = timeToMinutes(slot);
                      const slotEnd = slotStart + (selectedService?.duration || 40);
                      
                      // Check overlap with existing appointments
                      const isBooked = bookedAppointments.some(a => {
                        const apptStart = timeToMinutes(a.time);
                        const apptEnd = apptStart + (a.duration || 40);
                        return (slotStart < apptEnd && slotEnd > apptStart);
                      });

                      const isDisabled = isBooked;

                      return (
                        <button
                          key={slot}
                          disabled={isDisabled}
                          onClick={() => setFormData({ ...formData, time: slot })}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${isDisabled
                              ? 'bg-red-500/10 text-red-400/50 cursor-not-allowed line-through border border-red-500/10'
                              : formData.time === slot
                                ? 'bg-gold text-black border border-gold'
                                : 'bg-bg-elevated text-gray-400 border border-white/5 hover:border-gold/30 hover:text-white'
                            }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-6">Confirmar reserva</h2>
              <div className="space-y-4 bg-bg-elevated rounded-xl p-5 border border-white/5">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Cliente</span>
                  <span className="text-white font-medium">{formData.clientName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Teléfono</span>
                  <span className="text-white font-medium">{formData.clientPhone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Barbero</span>
                  <span className="text-white font-medium">{selectedBarber?.avatar} {selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Servicio</span>
                  <span className="text-white font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Fecha</span>
                  <span className="text-white font-medium">
                    {formData.date ? new Date(formData.date + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Hora</span>
                  <span className="text-white font-medium">{formData.time} hs</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Precio Total</span>
                  <span className="text-white font-medium">{formatPrice(selectedService?.price || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gold font-medium text-sm">Seña requerida (30%)</span>
                  <span className="text-2xl font-bold gold-text-gradient">{formatPrice((selectedService?.price || 0) * 0.3)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Te daremos nuestro ALIAS en el siguiente paso para abonar la seña y confirmar el turno.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                ← Volver
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-black
                  hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-gold to-gold-dark text-black
                  hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Reservando...
                  </>
                ) : (
                  '✓ Confirmar Reserva'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
