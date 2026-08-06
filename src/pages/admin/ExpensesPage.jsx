import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { EXPENSE_CATEGORIES, formatPrice } from '../../data/constants';
import {
  addExpense,
  getExpensesByBarberAndMonth,
  deleteExpense,
  getTodayStr,
  getCurrentYearMonth,
} from '../../data/firebase';

export default function ExpensesPage() {
  const { currentBarber } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all | barberia | personal

  const [form, setForm] = useState({
    amount: '',
    concept: '',
    category: '',
  });

  const todayStr = getTodayStr();
  const currentMonth = getCurrentYearMonth();

  useEffect(() => {
    loadExpenses();
  }, [currentBarber]);

  async function loadExpenses() {
    if (!currentBarber) return;
    setLoading(true);
    try {
      const data = await getExpensesByBarberAndMonth(currentBarber.id, currentMonth);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      addToast('Ingresá un monto válido', 'error');
      return;
    }
    if (!form.concept.trim()) {
      addToast('Ingresá un concepto', 'error');
      return;
    }
    if (!form.category) {
      addToast('Seleccioná la categoría', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        barberId: currentBarber.id,
        amount,
        concept: form.concept.trim(),
        category: form.category,
        date: todayStr,
        yearMonth: todayStr.substring(0, 7),
      });
      addToast(`Gasto de ${formatPrice(amount)} registrado`, 'success');
      setForm({ amount: '', concept: '', category: '' });
      await loadExpenses();
    } catch (err) {
      console.error(err);
      addToast('Error al registrar gasto', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(expenseId) {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await deleteExpense(expenseId);
      addToast('Gasto eliminado', 'warning');
      await loadExpenses();
    } catch (err) {
      console.error(err);
      addToast('Error al eliminar', 'error');
    }
  }

  const filteredExpenses = filter === 'all'
    ? expenses
    : expenses.filter((e) => e.category === filter);

  const totalBarberia = expenses
    .filter((e) => e.category === 'barberia')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalPersonal = expenses
    .filter((e) => e.category === 'personal')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalAll = totalBarberia + totalPersonal;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
          Gastos del Mes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 p-5">
          <p className="text-gray-400 text-sm">Total del Mes</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatPrice(totalAll)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 p-5">
          <p className="text-gray-400 text-sm">🏪 Barbería</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{formatPrice(totalBarberia)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 p-5">
          <p className="text-gray-400 text-sm">👤 Personal</p>
          <p className="text-2xl font-bold text-pink-400 mt-1">{formatPrice(totalPersonal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            ➕ Nuevo Gasto
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Concepto</label>
              <input
                type="text"
                value={form.concept}
                onChange={(e) => setForm({ ...form, concept: e.target.value })}
                placeholder="Ej: Compra de cuchillas"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Monto (ARS)</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Ej: 3000"
                className="w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Categoría</label>
              <div className="grid grid-cols-2 gap-3">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all
                      ${form.category === cat.id
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/5 bg-bg-elevated text-gray-500 hover:border-white/15'
                      }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!form.amount || !form.concept.trim() || !form.category || submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-red-600 to-red-700 text-white
                hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                '💸 Registrar Gasto'
              )}
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              📋 Gastos de Hoy
            </h2>
            <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-0.5 border border-white/5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'barberia', label: '🏪' },
                { id: 'personal', label: '👤' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${filter === f.id ? 'bg-gold/20 text-gold' : 'text-gray-500 hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">💸</span>
              <p className="text-gray-600 text-sm">Sin gastos registrados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-bg-elevated border border-white/5 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {expense.category === 'barberia' ? '🏪' : '👤'}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">{expense.concept}</p>
                      <p className="text-gray-600 text-xs capitalize">{expense.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-semibold text-sm">
                      -{formatPrice(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
