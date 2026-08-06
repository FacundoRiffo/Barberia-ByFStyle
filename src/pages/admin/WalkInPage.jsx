import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getBarberServices, formatPrice, PAYMENT_METHODS } from '../../data/constants';
import { addTransaction, getTodayStr } from '../../data/firebase';

export default function WalkInPage() {
  const { currentBarber } = useAuth();
  const { addToast } = useToast();
  const services = currentBarber ? getBarberServices(currentBarber.id) : [];

  // Walk-in form
  const [walkIn, setWalkIn] = useState({
    serviceId: '',
    paymentMethod: '',
    clientName: '',
  });
  const [walkInLoading, setWalkInLoading] = useState(false);

  // Other income form
  const [otherIncome, setOtherIncome] = useState({
    amount: '',
    concept: '',
    paymentMethod: '',
  });
  const [otherLoading, setOtherLoading] = useState(false);

  const selectedService = services.find((s) => s.id === walkIn.serviceId);
  const todayStr = getTodayStr();

  async function handleWalkIn(e) {
    e.preventDefault();
    if (!walkIn.serviceId || !walkIn.paymentMethod) {
      addToast('Completá servicio y método de pago', 'error');
      return;
    }

    setWalkInLoading(true);
    try {
      await addTransaction({
        barberId: currentBarber.id,
        type: 'walkin',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        amount: selectedService.price,
        paymentMethod: walkIn.paymentMethod,
        clientName: walkIn.clientName.trim() || 'Walk-in',
        date: todayStr,
        yearMonth: todayStr.substring(0, 7),
      });

      addToast(`${selectedService.name} registrado — ${formatPrice(selectedService.price)}`, 'success');
      setWalkIn({ serviceId: '', paymentMethod: '', clientName: '' });
    } catch (err) {
      console.error(err);
      addToast('Error al registrar', 'error');
    } finally {
      setWalkInLoading(false);
    }
  }

  async function handleOtherIncome(e) {
    e.preventDefault();
    const amount = Number(otherIncome.amount);
    if (!amount || amount <= 0) {
      addToast('Ingresá un monto válido', 'error');
      return;
    }
    if (!otherIncome.concept.trim()) {
      addToast('Ingresá un concepto', 'error');
      return;
    }

    setOtherLoading(true);
    try {
      await addTransaction({
        barberId: currentBarber.id,
        type: 'other',
        concept: otherIncome.concept.trim(),
        amount,
        paymentMethod: otherIncome.paymentMethod || 'efectivo',
        date: todayStr,
        yearMonth: todayStr.substring(0, 7),
      });

      addToast(`Ingreso de ${formatPrice(amount)} registrado`, 'success');
      setOtherIncome({ amount: '', concept: '', paymentMethod: '' });
    } catch (err) {
      console.error(err);
      addToast('Error al registrar', 'error');
    } finally {
      setOtherLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
          Registro Rápido
        </h1>
        <p className="text-gray-500 text-sm mt-1">Registrá ingresos al instante sin turno previo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Walk-in Registration */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            ⚡ Orden de Llegada
          </h2>
          <p className="text-gray-500 text-sm mb-5">Registrá un servicio realizado sin turno</p>

          <form onSubmit={handleWalkIn} className="space-y-4">
            {/* Client Name (optional) */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre del cliente (opcional)</label>
              <input
                type="text"
                value={walkIn.clientName}
                onChange={(e) => setWalkIn({ ...walkIn, clientName: e.target.value })}
                placeholder="Ej: Carlos"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Servicio realizado</label>
              <div className="space-y-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setWalkIn({ ...walkIn, serviceId: service.id })}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all text-sm
                      ${walkIn.serviceId === service.id
                        ? 'border-gold bg-gold/10 text-white'
                        : 'border-white/5 bg-bg-elevated text-gray-400 hover:border-white/15'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{service.icon}</span>
                      <span>{service.name}</span>
                    </div>
                    <span className="font-semibold gold-text-gradient">{formatPrice(service.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setWalkIn({ ...walkIn, paymentMethod: method.id })}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all
                      ${walkIn.paymentMethod === method.id
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/5 bg-bg-elevated text-gray-500 hover:border-white/15'
                      }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-xs">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedService && walkIn.paymentMethod && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total a registrar:</span>
                  <span className="text-xl font-bold text-emerald-400">{formatPrice(selectedService.price)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!walkIn.serviceId || !walkIn.paymentMethod || walkInLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-gold to-gold-dark text-black
                hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {walkInLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                '⚡ Registrar Cobro'
              )}
            </button>
          </form>
        </div>

        {/* Other Income */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            💡 Otros Ingresos
          </h2>
          <p className="text-gray-500 text-sm mb-5">Venta de productos u otros ingresos extras</p>

          <form onSubmit={handleOtherIncome} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Concepto</label>
              <input
                type="text"
                value={otherIncome.concept}
                onChange={(e) => setOtherIncome({ ...otherIncome, concept: e.target.value })}
                placeholder="Ej: Venta de cera para cabello"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Monto (ARS)</label>
              <input
                type="number"
                min="0"
                value={otherIncome.amount}
                onChange={(e) => setOtherIncome({ ...otherIncome, amount: e.target.value })}
                placeholder="Ej: 5000"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setOtherIncome({ ...otherIncome, paymentMethod: method.id })}
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all
                      ${otherIncome.paymentMethod === method.id
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/5 bg-bg-elevated text-gray-500 hover:border-white/15'
                      }`}
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="text-xs">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!otherIncome.amount || !otherIncome.concept.trim() || otherLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 text-white
                hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {otherLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                '💡 Registrar Ingreso Extra'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
