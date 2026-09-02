import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, getServiceById, PAYMENT_METHODS, generateTimeSlots } from '../../data/constants';
import {
  getAppointmentsByBarberAndDate,
  completeAppointment,
  markAppointmentAsDebt,
  cancelAppointment,
  blockSlot,
  unblockSlot,
  addTransaction,
  confirmSena,
  getTodayStr,
  addDebt,
} from '../../data/firebase';

export default function AppointmentsPage() {
  const { currentBarber } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [debtModal, setDebtModal] = useState(null);
  const [expectedDate, setExpectedDate] = useState('');
  
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const allSlots = currentBarber ? generateTimeSlots(currentBarber.id, selectedDate) : [];

  useEffect(() => {
    loadAppointments();
  }, [currentBarber, selectedDate]);

  async function loadAppointments() {
    if (!currentBarber) return;
    setLoading(true);
    try {
      const data = await getAppointmentsByBarberAndDate(currentBarber.id, selectedDate);
      setAppointments(data);
    } catch (err) {
      console.error(err);
      addToast('Error cargando turnos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(appointment, paymentMethod) {
    setProcessingId(appointment.id);
    try {
      await completeAppointment(appointment.id, paymentMethod);

      // Add as transaction (income)
      await addTransaction({
        barberId: currentBarber.id,
        type: 'appointment',
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName,
        amount: appointment.price,
        paymentMethod,
        clientName: appointment.clientName,
        date: selectedDate,
        yearMonth: selectedDate.substring(0, 7),
      });

      addToast(`Turno de ${appointment.clientName} cobrado ✓`, 'success');
      setPaymentModal(null);
      await loadAppointments();
    } catch (err) {
      console.error(err);
      addToast('Error al completar turno', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleMarkAsDebt(appointment) {
    if (!expectedDate) {
      addToast('Por favor, seleccioná una fecha esperada de pago', 'error');
      return;
    }
    
    setProcessingId(appointment.id);
    try {
      // 1. Marcar el turno como "fiado" (no suma en transacciones como ingreso hoy)
      await markAppointmentAsDebt(appointment.id);

      // 2. Agregar a la colección de deudas
      await addDebt({
        barberId: currentBarber.id,
        appointmentId: appointment.id,
        clientName: appointment.clientName,
        clientPhone: appointment.clientPhone,
        serviceName: appointment.serviceName,
        amount: appointment.price,
        dateOfService: selectedDate,
        expectedPaymentDate: expectedDate,
      });

      addToast(`Turno de ${appointment.clientName} anotado como fiado 📝`, 'success');
      setDebtModal(null);
      setExpectedDate('');
      await loadAppointments();
    } catch (err) {
      console.error(err);
      addToast('Error al anotar fiado', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirmSena(appointment) {
    setProcessingId(appointment.id);
    try {
      await confirmSena(appointment.id);
      addToast('Seña confirmada', 'success');
      await loadAppointments();

      if (appointment.clientPhone) {
        const formattedDate = new Date(appointment.date + 'T12:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
        const msg = encodeURIComponent(`¡Hola ${appointment.clientName}! Recibimos tu seña. Tu turno de ${appointment.serviceName} el día ${formattedDate} a las ${appointment.time} hs está CONFIRMADO ✅. ¡Te esperamos en B&F Style!`);
        let phone = appointment.clientPhone.replace(/\D/g, '');
        if (phone.length === 10) {
          phone = `549${phone}`;
        }
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      }

    } catch (err) {
      console.error(err);
      addToast('Error al confirmar seña', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCancel(appointment) {
    if (!confirm(`¿Cancelar el turno de ${appointment.clientName}?`)) return;
    setProcessingId(appointment.id);
    try {
      await cancelAppointment(appointment.id);
      addToast('Turno cancelado', 'warning');
      await loadAppointments();

      if (appointment.clientPhone) {
        const formattedDate = new Date(appointment.date + 'T12:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });

        let msgText;
        if (appointment.senaPaid) {
          // Si pagó la seña, pedir alias para devolver
          const sena = appointment.price * 0.3;
          msgText = `Hola ${appointment.clientName}, te escribimos de B&F Style. Lamentablemente tuvimos que cancelar tu turno de ${appointment.serviceName} el día ${formattedDate} a las ${appointment.time} hs.\n\nComo ya abonaste la seña ($${sena.toLocaleString('es-AR')}), necesitamos tu *alias de Mercado Pago* para hacerte la devolución. Por favor respondé con tu alias. ¡Disculpá las molestias!`;
        } else {
          msgText = `Hola ${appointment.clientName}, te escribimos de B&F Style. Lamentablemente tuvimos que cancelar tu turno de ${appointment.serviceName} el día ${formattedDate} a las ${appointment.time} hs. Por favor, contáctanos para reprogramar. ¡Disculpá las molestias!`;
        }

        const msg = encodeURIComponent(msgText);
        let phone = appointment.clientPhone.replace(/\D/g, '');
        if (phone.length === 10) {
          phone = `549${phone}`;
        }
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      }

    } catch (err) {
      console.error(err);
      addToast('Error al cancelar', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleBlock(time) {
    setProcessingId(`block-${time}`);
    try {
      await blockSlot(currentBarber.id, selectedDate, time);
      addToast(`Horario ${time} bloqueado`, 'success');
      await loadAppointments();
    } catch (err) {
      console.error(err);
      addToast('Error al bloquear horario', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleUnblock(appointmentId, time) {
    setProcessingId(appointmentId);
    try {
      await unblockSlot(appointmentId);
      addToast(`Horario ${time} desbloqueado`, 'success');
      await loadAppointments();
    } catch (err) {
      console.error(err);
      addToast('Error al desbloquear horario', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  const getSlotData = (time) => {
    // There could be multiple if one was cancelled and another booked later, 
    // we want the active one, or just the first non-cancelled one.
    const active = appointments.find(a => a.time === time && a.status !== 'cancelled');
    if (active) return active;
    const cancelled = appointments.find(a => a.time === time && a.status === 'cancelled');
    if (cancelled) return cancelled;
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
            Agenda
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-white/10 text-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={loadAppointments}
          className="px-4 py-2 rounded-xl bg-bg-elevated border border-white/5 text-gray-400 text-sm font-medium hover:text-white hover:border-white/15 transition-all flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {allSlots.map((time) => {
            const apt = getSlotData(time);
            
            // Render AVAILABLE slot
            if (!apt) {
              return (
                <div key={time} className="flex items-center gap-4 bg-bg-elevated/30 rounded-2xl p-4 border border-white/5 border-dashed">
                  <div className="w-16 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-sm font-medium text-gray-500">
                    {time}
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 italic text-sm">Disponible</span>
                  </div>
                  <button
                    onClick={() => handleBlock(time)}
                    disabled={processingId === `block-${time}`}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {processingId === `block-${time}` ? '...' : 'Bloquear'}
                  </button>
                </div>
              );
            }

            // Render BLOCKED slot
            if (apt.status === 'blocked') {
              return (
                <div key={apt.id} className="flex items-center gap-4 bg-red-950/20 rounded-2xl p-4 border border-red-900/30">
                  <div className="w-16 h-12 rounded-xl bg-red-950/50 flex items-center justify-center text-sm font-bold text-red-500">
                    {time}
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-red-400">
                    <span>🔒</span>
                    <span className="text-sm font-medium">Bloqueado (No disponible para reservas)</span>
                  </div>
                  <button
                    onClick={() => handleUnblock(apt.id, time)}
                    disabled={processingId === apt.id}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {processingId === apt.id ? '...' : 'Desbloquear'}
                  </button>
                </div>
              );
            }

            // Render CANCELLED slot
            if (apt.status === 'cancelled') {
              return (
                <div key={apt.id} className="flex items-center gap-4 bg-bg-elevated/30 rounded-2xl p-4 border border-white/5 border-dashed opacity-75">
                  <div className="w-16 h-12 rounded-xl bg-bg-elevated flex items-center justify-center text-sm font-medium text-gray-500 line-through">
                    {time}
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-500 text-sm">
                      Cancelado — <span className="line-through">{apt.clientName}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handleBlock(time)}
                    disabled={processingId === `block-${time}`}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {processingId === `block-${time}` ? '...' : 'Bloquear'}
                  </button>
                </div>
              );
            }

            // Render COMPLETED / DEBT slot
            if (apt.status === 'completed' || apt.status === 'debt') {
              const isDebt = apt.status === 'debt';
              return (
                <div key={apt.id} className={`glass-card rounded-2xl p-4 border ${isDebt ? 'border-amber-500/30 bg-amber-950/10' : 'border-green-500/20 bg-green-950/10'} opacity-75`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${isDebt ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                        {time}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{apt.clientName}</h3>
                        <p className="text-sm text-gray-400">{apt.serviceName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`${isDebt ? 'text-amber-400' : 'text-green-400'} font-bold mb-1`}>
                        {formatPrice(apt.price)}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-md ${isDebt ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        {isDebt ? 'Fiado 📝' : 'Cobrado ✓'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Render PENDING slot
            return (
              <div key={apt.id} className="glass-card rounded-2xl p-4 border border-gold/30 relative">
                {!apt.senaPaid && (
                  <div className="absolute -top-3 -right-2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-amber-300 animate-pulse">
                    ⚠️ Falta verificar seña
                  </div>
                )}
                {apt.senaPaid && (
                  <div className="absolute -top-3 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-green-400">
                    ✅ Seña Pagada
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-sm font-bold text-amber-400">
                      {time}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{apt.clientName}</h3>
                      <p className="text-sm text-gray-400">
                        {apt.serviceName}
                        {apt.clientPhone && ` — ${apt.clientPhone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 mt-3 sm:mt-0">
                    <div className="text-right sm:mr-4 w-full sm:w-auto mb-2 sm:mb-0">
                      <div className="text-gold font-bold">{formatPrice(apt.price)}</div>
                    </div>

                    {!apt.senaPaid && (
                      <button
                        onClick={() => handleConfirmSena(apt)}
                        disabled={processingId === apt.id}
                        className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 text-sm font-bold hover:bg-green-500/20 border border-green-500/30 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex-1 sm:flex-none"
                      >
                        {processingId === apt.id ? '...' : '✅ Validar Seña'}
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(apt)}
                      disabled={processingId === apt.id}
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50 flex-1 sm:flex-none"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={() => setPaymentModal(apt.id)}
                      disabled={processingId === apt.id}
                      className="px-4 py-2 rounded-xl bg-gold text-bg-primary text-sm font-bold hover:bg-gold-light transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(201,168,76,0.3)] flex-1 sm:flex-none"
                    >
                      {processingId === apt.id ? '...' : 'Cobrar'}
                    </button>
                  </div>
                </div>

                {/* Modal de cobro */}
                {paymentModal === apt.id && (
                  <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                    <p className="text-sm text-gray-400 mb-3">Seleccioná el método de pago:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={() => handleComplete(apt, pm.id)}
                          disabled={processingId === apt.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-white/10 text-sm text-white hover:border-gold hover:text-gold transition-all"
                        >
                          <span>{pm.icon}</span>
                          {pm.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          setPaymentModal(null);
                          setDebtModal(apt.id);
                        }}
                        className="px-4 py-2 rounded-xl text-amber-400 bg-amber-500/10 border border-amber-500/20 text-sm font-medium hover:bg-amber-500/20 transition-all"
                      >
                        📝 Anotar como Fiado
                      </button>
                      <button
                        onClick={() => setPaymentModal(null)}
                        className="px-4 py-2 rounded-xl text-gray-500 text-sm hover:text-white transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Modal de Fiado */}
                {debtModal === apt.id && (
                  <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                    <p className="text-sm text-gray-400 mb-3">¿Cuándo te va a pagar?</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="date" 
                        value={expectedDate}
                        min={todayStr}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-bg-elevated border border-white/10 text-white text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAsDebt(apt)}
                          disabled={processingId === apt.id || !expectedDate}
                          className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all disabled:opacity-50"
                        >
                          {processingId === apt.id ? '...' : 'Guardar Fiado'}
                        </button>
                        <button
                          onClick={() => {
                            setDebtModal(null);
                            setExpectedDate('');
                          }}
                          className="px-4 py-2 rounded-xl text-gray-500 text-sm hover:text-white transition-all bg-white/5"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
