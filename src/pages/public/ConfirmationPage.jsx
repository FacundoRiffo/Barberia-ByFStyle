import { Link, useLocation, Navigate } from 'react-router-dom';
import { formatPrice } from '../../data/constants';

export default function ConfirmationPage() {
  const location = useLocation();
  const appointment = location.state?.appointment;

  if (!appointment) {
    return <Navigate to="/reservar" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-primary pt-24 sm:pt-28 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="relative mb-8 animate-scale-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-emerald-500/10 animate-ping" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white mb-2 animate-fade-in">
          ¡Turno Confirmado!
        </h1>
        <p className="text-gray-400 mb-8 animate-fade-in stagger-2">
          Tu reserva ha sido registrada exitosamente.
        </p>

        {/* Ticket */}
        <div className="glass-card rounded-2xl p-6 text-left animate-fade-in stagger-3 relative overflow-hidden">
          {/* Top decorative stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold text-[10px]">
                B&F
              </div>
              <span className="text-sm font-semibold text-white font-['Playfair_Display',serif]">B&F Style</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">#{appointment.id?.slice(-8).toUpperCase()}</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">👤 Cliente</span>
              <span className="text-white text-sm font-medium">{appointment.clientName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">📞 Teléfono</span>
              <span className="text-white text-sm font-medium">{appointment.clientPhone}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">💈 Barbero</span>
              <span className="text-white text-sm font-medium">{appointment.barberName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">✂️ Servicio</span>
              <span className="text-white text-sm font-medium">{appointment.serviceName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">📅 Fecha</span>
              <span className="text-white text-sm font-medium">
                {new Date(appointment.date + 'T12:00').toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">🕐 Hora</span>
              <span className="text-white text-sm font-medium">{appointment.time} hs</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500 text-sm">💰 Precio</span>
              <span className="text-xl font-bold gold-text-gradient">{formatPrice(appointment.price)}</span>
            </div>
          </div>

          {/* Decorative dashed line */}
          <div className="border-t-2 border-dashed border-white/10 my-4" />

          <p className="text-center text-gray-500 text-xs">
            Presentá este comprobante al llegar. ¡Te esperamos!
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 animate-fade-in stagger-4">
          <Link
            to="/"
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-black font-semibold text-sm
              hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300"
          >
            Volver al Inicio
          </Link>
          <Link
            to="/reservar"
            className="w-full px-6 py-3 rounded-xl border border-white/10 text-gray-400 font-medium text-sm
              hover:bg-white/5 hover:text-white transition-all duration-200"
          >
            Reservar Otro Turno
          </Link>
        </div>
      </div>
    </div>
  );
}
