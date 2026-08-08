import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, getServiceById } from '../../data/constants';
import {
  getTransactionsByBarberAndDate,
  getTransactionsByBarberAndMonth,
  getExpensesByBarberAndDate,
  getExpensesByBarberAndMonth,
  getAppointmentsByBarberAndDate,
  getTransactionsByBarberAndDateRange,
  getExpensesByBarberAndDateRange,
  getTodayStr,
  getCurrentYearMonth,
} from '../../data/firebase';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const start = new Date(now.setDate(diff));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
  end.setMinutes(end.getMinutes() - end.getTimezoneOffset());

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

function getYearRange() {
  const year = new Date().getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
}

function StatCard({ icon, label, value, sub, color = 'gold' }) {
  const colorMap = {
    gold: 'from-gold/20 to-gold/5 border-gold/20 text-gold',
    green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-gray-500">{sub}</span>}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { currentBarber } = useAuth();
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month' | 'year'
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    transactions: [],
    expenses: [],
    appointments: [],
  });

  const todayStr = getTodayStr();
  const currentMonth = getCurrentYearMonth();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    loadData();
  }, [viewMode, currentBarber, selectedDate]);

  async function loadData() {
    if (!currentBarber) return;
    setLoading(true);
    try {
      let transactions, expenses, appointments;

      if (viewMode === 'day') {
        [transactions, expenses, appointments] = await Promise.all([
          getTransactionsByBarberAndDate(currentBarber.id, selectedDate),
          getExpensesByBarberAndDate(currentBarber.id, selectedDate),
          getAppointmentsByBarberAndDate(currentBarber.id, selectedDate),
        ]);
      } else if (viewMode === 'week') {
        const { start, end } = getWeekRange();
        [transactions, expenses] = await Promise.all([
          getTransactionsByBarberAndDateRange(currentBarber.id, start, end),
          getExpensesByBarberAndDateRange(currentBarber.id, start, end),
        ]);
        appointments = [];
      } else if (viewMode === 'month') {
        [transactions, expenses] = await Promise.all([
          getTransactionsByBarberAndMonth(currentBarber.id, currentMonth),
          getExpensesByBarberAndMonth(currentBarber.id, currentMonth),
        ]);
        appointments = [];
      } else if (viewMode === 'year') {
        const { start, end } = getYearRange();
        [transactions, expenses] = await Promise.all([
          getTransactionsByBarberAndDateRange(currentBarber.id, start, end),
          getExpensesByBarberAndDateRange(currentBarber.id, start, end),
        ]);
        appointments = [];
      }

      setData({ transactions, expenses, appointments });
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Error al conectar con la base de datos');
      addToast('Error: ' + (err.message || 'No se pudo cargar los datos'), 'error', 5000);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const appointmentIncome = data.transactions
    .filter((t) => t.type === 'appointment')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const walkInIncome = data.transactions
    .filter((t) => t.type === 'walkin')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const otherIncome = data.transactions
    .filter((t) => t.type === 'other')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalIncome = appointmentIncome + walkInIncome + otherIncome;

  const barberiaExpenses = data.expenses
    .filter((e) => e.category === 'barberia')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const personalExpenses = data.expenses
    .filter((e) => e.category === 'personal')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpenses = barberiaExpenses + personalExpenses;
  const balance = totalIncome - totalExpenses;

  const totalServices = data.transactions.filter((t) => t.type !== 'other').length;

  // Services breakdown
  const serviceBreakdown = {};
  data.transactions
    .filter((t) => t.serviceId)
    .forEach((t) => {
      const name = t.serviceName || t.serviceId;
      serviceBreakdown[name] = (serviceBreakdown[name] || 0) + 1;
    });

  const pendingAppointments = data.appointments.filter((a) => a.status === 'pending').length;
  const completedAppointments = data.appointments.filter((a) => a.status === 'completed').length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {viewMode === 'day'
              ? `Resumen del día — ${new Date(selectedDate + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`
              : viewMode === 'month'
                ? `Resumen del mes — ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
                : viewMode === 'week' ? 'Resumen de la semana' : 'Resumen del año'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-bg-elevated rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'day' ? 'bg-gold text-bg-primary shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'week' ? 'bg-gold text-bg-primary shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'month' ? 'bg-gold text-bg-primary shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'year' ? 'bg-gold text-bg-primary shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Año
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 rounded-lg text-gray-500 hover:text-white transition-colors"
            title="Actualizar"
          >
            🔄
          </button>
        </div>
      </div>

      {viewMode === 'day' && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 2 + i); // Empezar hace 2 días y seguir adelante
            const originalDate = new Date(date);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            const dStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dStr;
            const isToday = dStr === todayStr;
            const dayName = originalDate.toLocaleDateString('es-AR', { weekday: 'short' });
            const dayNumber = originalDate.getDate();
            return (
              <button
                key={dStr}
                onClick={() => setSelectedDate(dStr)}
                className={`min-w-[80px] flex flex-col items-center justify-center py-3 rounded-xl border transition-all
                  ${isSelected
                    ? 'bg-gold/10 border-gold text-gold shadow-md'
                    : 'bg-bg-elevated border-white/5 text-gray-400 hover:border-gold/30 hover:text-white'
                  }`}
              >
                <span className="text-xs font-medium uppercase tracking-wider mb-1">
                  {isToday ? 'Hoy' : dayName}
                </span>
                <span className={`text-xl font-bold ${isSelected ? 'text-white' : ''}`}>
                  {dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">⚠️</span>
          <h3 className="text-xl text-white font-semibold mb-2">Error de conexión</h3>
          <p className="text-red-400 text-sm max-w-md mb-2">{error}</p>
          <p className="text-gray-500 text-xs max-w-md mb-6">
            Verificá que las reglas de Firestore permitan lectura/escritura. 
            En Firebase Console → Firestore → Rules, asegurate de tener:
            <code className="block mt-2 bg-bg-elevated p-2 rounded text-left text-[11px] text-gray-400">
              {`allow read, write: if true;`}
            </code>
          </p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all"
          >
            🔄 Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="💰"
              label="Ingresos Totales"
              value={formatPrice(totalIncome)}
              sub={viewMode === 'day' ? 'Hoy' : 'Mes'}
              color="gold"
            />
            <StatCard
              icon="📉"
              label="Egresos Totales"
              value={formatPrice(totalExpenses)}
              sub={viewMode === 'day' ? 'Hoy' : 'Mes'}
              color="red"
            />
            <StatCard
              icon="📊"
              label="Balance Neto"
              value={formatPrice(balance)}
              sub={balance >= 0 ? '↑ Positivo' : '↓ Negativo'}
              color={balance >= 0 ? 'green' : 'red'}
            />
            <StatCard
              icon="✂️"
              label="Servicios Realizados"
              value={totalServices}
              sub={`${data.transactions.length} transacciones`}
              color="blue"
            />
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Income Breakdown */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                💰 Desglose de Ingresos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold" />
                    <span className="text-gray-400 text-sm">Turnos Agendados</span>
                  </div>
                  <span className="text-white font-medium">{formatPrice(appointmentIncome)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-gray-400 text-sm">Orden de Llegada</span>
                  </div>
                  <span className="text-white font-medium">{formatPrice(walkInIncome)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-gray-400 text-sm">Otros Ingresos</span>
                  </div>
                  <span className="text-white font-medium">{formatPrice(otherIncome)}</span>
                </div>
                {/* Visual bar */}
                {totalIncome > 0 && (
                  <div className="mt-3 h-3 rounded-full bg-bg-elevated overflow-hidden flex">
                    <div className="bg-gold h-full transition-all" style={{ width: `${(appointmentIncome / totalIncome) * 100}%` }} />
                    <div className="bg-blue-400 h-full transition-all" style={{ width: `${(walkInIncome / totalIncome) * 100}%` }} />
                    <div className="bg-purple-400 h-full transition-all" style={{ width: `${(otherIncome / totalIncome) * 100}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📉 Desglose de Egresos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-gray-400 text-sm">Gastos de Barbería</span>
                  </div>
                  <span className="text-white font-medium">{formatPrice(barberiaExpenses)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <span className="text-gray-400 text-sm">Gastos Personales</span>
                  </div>
                  <span className="text-white font-medium">{formatPrice(personalExpenses)}</span>
                </div>
                {totalExpenses > 0 && (
                  <div className="mt-3 h-3 rounded-full bg-bg-elevated overflow-hidden flex">
                    <div className="bg-orange-400 h-full transition-all" style={{ width: `${(barberiaExpenses / totalExpenses) * 100}%` }} />
                    <div className="bg-pink-400 h-full transition-all" style={{ width: `${(personalExpenses / totalExpenses) * 100}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Breakdown & Today's Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Counts */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                ✂️ Servicios por Categoría
              </h3>
              {Object.keys(serviceBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(serviceBreakdown).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between py-2">
                      <span className="text-gray-400 text-sm">{name}</span>
                      <span className="px-3 py-1 rounded-full bg-gold/10 text-gold text-sm font-medium">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm py-4 text-center">
                  Sin servicios registrados {viewMode === 'day' ? 'hoy' : 'este mes'}
                </p>
              )}
            </div>

            {/* Today's Appointments (only in day view) */}
            {viewMode === 'day' && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  📅 Turnos de Hoy
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-3xl font-bold text-amber-400">{pendingAppointments}</p>
                    <p className="text-gray-400 text-xs mt-1">Pendientes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-3xl font-bold text-emerald-400">{completedAppointments}</p>
                    <p className="text-gray-400 text-xs mt-1">Completados</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="glass-card rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Últimas Transacciones</h3>
            {(() => {
              const allMovements = [
                ...data.transactions.map((t) => ({ ...t, isExpense: false })),
                ...data.expenses.map((e) => ({ ...e, isExpense: true, type: 'expense' })),
              ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

              return allMovements.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allMovements.slice(0, 10).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-bg-elevated border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {t.isExpense ? '💸' : t.type === 'appointment' ? '📅' : t.type === 'walkin' ? '⚡' : '💡'}
                        </span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {t.serviceName || t.concept || (t.isExpense ? 'Gasto' : 'Ingreso')}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {t.isExpense ? `Gasto ${t.category === 'barberia' ? '(Barbería)' : '(Personal)'}` : t.type === 'appointment' ? 'Turno' : t.type === 'walkin' ? 'Walk-in' : 'Otro'} {t.paymentMethod ? `• ${t.paymentMethod}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold text-sm ${t.isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.isExpense ? '-' : '+'}{formatPrice(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm text-center py-8">
                  Sin transacciones {viewMode === 'day' ? 'hoy' : 'este mes'}
                </p>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
