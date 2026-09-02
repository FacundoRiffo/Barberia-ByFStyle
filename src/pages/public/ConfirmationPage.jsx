import { Link, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { formatPrice, getBarberById } from '../../data/constants';
import { useToast } from '../../context/ToastContext';

export default function ConfirmationPage() {
  const location = useLocation();
  const appointment = location.state?.appointment;
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleOpenMercadoPago = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isAndroid) {
      // Intent URI con el package correcto (com.mercadopago.wallet) y fallback al Play Store
      const intentUrl = "intent://#Intent;scheme=mercadopago;package=com.mercadopago.wallet;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.mercadopago.wallet;end";
      window.location.href = intentUrl;
      addToast('Abriendo Mercado Pago...', 'info');
    } else if (isIOS) {
      // En iOS el scheme mercadopago:// funciona para abrir la app
      const appUrl = "mercadopago://";
      const appStoreUrl = "https://apps.apple.com/ar/app/mercado-pago/id925436649";
      
      window.location.href = appUrl;
      addToast('Abriendo Mercado Pago...', 'info');
      
      // Si después de 1.5s no se fue de la página, la app no está instalada → App Store
      setTimeout(() => {
        if (!document.hidden) {
          addToast('App no encontrada. Redirigiendo a la App Store...', 'warning');
          window.location.href = appStoreUrl;
        }
      }, 1500);
    } else {
      // En PC/Desktop no hay app nativa, intentar abrir la versión web
      addToast('Abriendo Mercado Pago en el navegador...', 'info');
      window.open("https://www.mercadopago.com.ar/transfer", "_blank");
    }
  };

  if (!appointment) {
    return <Navigate to="/reservar" replace />;
  }

  // -------------------------------------------------
  // Formateamos la fecha del turno (formato Argentina)
  // -------------------------------------------------
  const formattedDate = new Date(appointment.date + 'T12:00')
    .toLocaleDateString('es-AR', {
      // día de la semana abreviado, ej: lun, mar
      weekday: 'short',
      // día del mes
      day: 'numeric',
      // mes abreviado
      month: 'short',
      // año completo
      year: 'numeric',
    });

  // -------------------------------------------------
  // Calculamos la seña: 30 % del precio total
  // -------------------------------------------------
  const sena = appointment.price * 0.3;

  // -------------------------------------------------
  // Mensaje que se enviará por WhatsApp al barbero
  // -------------------------------------------------
  const whatsappMessage = encodeURIComponent(
    `Hola, soy ${appointment.clientName}. Ya transferí la seña de ${formatPrice(sena)} para mi turno de ${appointment.serviceName} el día ${formattedDate} a las ${appointment.time} hs. ¿Me confirmás el turno?`
  );

  // -------------------------------------------------
  // Datos del barbero (o valores por defecto)
  // -------------------------------------------------
  const barber = getBarberById(appointment.barberId) || {
    // teléfono en formato internacional
    phone: '5492665025201',
    // alias de la cuenta Mercado Pago
    alias: 'facu.riffo.',
    // nombre del titular del alias
    aliasName: 'Facundo Valentin Riffo'
  };

  // -------------------------------------------------
  // URL que abre WhatsApp con el mensaje pre‑llenado
  // -------------------------------------------------
  const whatsappUrl = `https://wa.me/${barber.phone}?text=${whatsappMessage}`;

  // -------------------------------------------------
  // Renderizado del componente (encabezado y animación)
  // -------------------------------------------------
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
          Turno a Confirmar
        </h1>
        <p className="text-gray-400 mb-8 animate-fade-in stagger-2 text-sm sm:text-base">
          Tu reserva fue recibida. Falta verificar el pago de la seña.
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
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">🕐 Hora</span>
              <span className="text-white text-sm font-medium">{appointment.time} hs</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-gray-500 text-sm">💰 Precio Total</span>
              <span className="text-white text-sm font-medium">{formatPrice(appointment.price)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gold font-medium text-sm">⚠️ Seña a transferir</span>
              <span className="text-xl font-bold gold-text-gradient">{formatPrice(sena)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-bg-primary rounded-xl border border-white/5">
            <p className="text-gray-400 text-xs text-center mb-2">Para confirmar el turno, transferir la seña a:</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <p className="text-white font-mono font-bold text-center bg-white/5 px-4 py-2 rounded-lg tracking-wider text-sm">
                ALIAS: {barber.alias}
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(barber.alias);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                title="Copiar Alias"
              >
                {copied ? '✅' : '📋'}
              </button>
            </div>
            <p className="text-gray-500 text-xs text-center font-medium mb-3">
              A nombre de: {barber.aliasName}
            </p>

            <button 
              type="button"
              onClick={handleOpenMercadoPago}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#009EE3] hover:bg-[#0088C4] text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-[#009EE3]/20 cursor-pointer"
            >
              <span>🤝</span> Abrir App de Mercado Pago
            </button>
          </div>

          {/* Decorative dashed line */}
          <div className="border-t-2 border-dashed border-white/10 my-4" />

          <p className="text-center text-gray-500 text-xs">
            ¡Importante! Una vez que transfieras la seña, tocá el botón de abajo para confirmar tu turno por WhatsApp.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 animate-fade-in stagger-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm flex items-center justify-center gap-2
              hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Confirmar Pago de Seña
          </a>
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
