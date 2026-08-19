import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, PAYMENT_METHODS } from '../../data/constants';
import { getPendingDebtsByBarber, payDebt, addTransaction, getTodayStr } from '../../data/firebase';

export default function DebtsPage() {
  const { currentBarber } = useAuth();
  const { addToast } = useToast();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const todayStr = getTodayStr();

  useEffect(() => {
    loadDebts();
  }, [currentBarber]);

  async function loadDebts() {
    if (!currentBarber) return;
    setLoading(true);
    try {
      const data = await getPendingDebtsByBarber(currentBarber.id);
      setDebts(data);
    } catch (err) {
      console.error(err);
      addToast('Error cargando fiados', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayDebt(debt, paymentMethod) {
    setProcessingId(debt.id);
    try {
      await payDebt(debt.id, paymentMethod);

      // Add as transaction (income)
      await addTransaction({
        barberId: currentBarber.id,
        type: 'appointment',
        serviceId: 'debt-payment',
        serviceName: `Pago de Fiado: ${debt.serviceName}`,
        amount: debt.amount,
        paymentMethod,
        clientName: debt.clientName,
        date: todayStr, // Se registra el día que se paga
        yearMonth: todayStr.substring(0, 7),
      });

      addToast(`Fiado de ${debt.clientName} cobrado ✓`, 'success');
      setPaymentModal(null);
      await loadDebts();
    } catch (err) {
      console.error(err);
      addToast('Error al cobrar fiado', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  // Calculate if a debt is overdue
  const isOverdue = (expectedDate) => {
    return expectedDate < todayStr;
  };

  const isToday = (expectedDate) => {
    return expectedDate === todayStr;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
            Cuentas y Fiados
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Gestioná los cortes a cuenta pendientes de pago</p>
        </div>
        <button
          onClick={loadDebts}
          className="px-4 py-2 rounded-xl bg-bg-elevated border border-white/5 text-gray-400 text-sm font-medium hover:text-white hover:border-white/15 transition-all flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : debts.length === 0 ? (
        <div className="text-center py-20 bg-bg-elevated/30 rounded-2xl border border-white/5 border-dashed">
          <p className="text-gray-400">No tenés fiados pendientes 📝</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-sm font-medium text-gray-400">Total Pendiente:</span>
            <span className="text-lg font-bold text-amber-400">
              {formatPrice(debts.reduce((acc, curr) => acc + curr.amount, 0))}
            </span>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {debts.map((debt) => {
              const overdue = isOverdue(debt.expectedPaymentDate);
              const today = isToday(debt.expectedPaymentDate);
              
              return (
                <div 
                  key={debt.id} 
                  className={`glass-card rounded-2xl p-5 border relative overflow-hidden
                    ${overdue ? 'border-red-500/30 bg-red-950/10' : 
                      today ? 'border-amber-500/30 bg-amber-950/10' : 
                      'border-white/10 bg-bg-elevated'}`}
                >
                  {/* Etiqueta de estado */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl
                    ${overdue ? 'bg-red-500 text-white' : 
                      today ? 'bg-amber-500 text-black' : 
                      'bg-white/10 text-gray-400'}`}
                  >
                    {overdue ? 'Atrasado' : today ? 'Paga hoy' : 'Al día'}
                  </div>

                  <div className="mt-2 mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">{debt.clientName}</h3>
                    <p className="text-xs text-gray-400">{debt.serviceName}</p>
                    {debt.clientPhone && (
                      <a href={`https://wa.me/${debt.clientPhone.replace(/\D/g, '').length === 10 ? '549' + debt.clientPhone.replace(/\D/g, '') : debt.clientPhone.replace(/\D/g, '')}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="text-xs text-emerald-400 hover:underline mt-1 inline-block">
                        📱 Contactar por WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monto:</span>
                      <span className="text-white font-bold">{formatPrice(debt.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Fecha del corte:</span>
                      <span className="text-gray-300">{debt.dateOfService}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Prometió pagar:</span>
                      <span className={`font-medium ${overdue ? 'text-red-400' : today ? 'text-amber-400' : 'text-gray-300'}`}>
                        {debt.expectedPaymentDate}
                      </span>
                    </div>
                  </div>

                  {paymentModal === debt.id ? (
                    <div className="animate-fade-in">
                      <p className="text-xs text-gray-400 mb-2">Método de pago:</p>
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <button
                            key={pm.id}
                            onClick={() => handlePayDebt(debt, pm.id)}
                            disabled={processingId === debt.id}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-bg-elevated border border-white/10 text-xs text-white hover:border-gold hover:text-gold transition-all"
                          >
                            <span>{pm.icon}</span>
                            {pm.name}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setPaymentModal(null)}
                        className="w-full px-3 py-2 rounded-xl text-gray-500 text-xs hover:text-white transition-all bg-white/5"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPaymentModal(debt.id)}
                      disabled={processingId === debt.id}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-black text-sm font-bold hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all disabled:opacity-50"
                    >
                      {processingId === debt.id ? '...' : 'Cobrar Fiado'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
