import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BARBERS, DEFAULT_CREDENTIALS } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedBarber) {
      setError('Seleccioná un barbero');
      return;
    }
    if (!password.trim()) {
      setError('Ingresá tu contraseña');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate small delay for UX
    await new Promise((r) => setTimeout(r, 500));

    if (DEFAULT_CREDENTIALS[selectedBarber.id] === password) {
      login(selectedBarber);
      addToast(`¡Bienvenido, ${selectedBarber.name}!`, 'success');
      navigate('/admin/dashboard');
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
      addToast('Contraseña incorrecta', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold text-xl mb-4
            shadow-[0_0_30px_rgba(201,168,76,0.2)]">
            B&F
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Playfair_Display',serif] text-white">
            Panel de <span className="gold-text-gradient">Barberos</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">Iniciá sesión para acceder a tu panel</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Barber Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-3">Seleccioná tu perfil</label>
            <div className="grid grid-cols-2 gap-3">
              {BARBERS.map((barber) => (
                <button
                  key={barber.id}
                  type="button"
                  onClick={() => { setSelectedBarber(barber); setError(''); }}
                  className={`p-5 rounded-xl border-2 text-center transition-all duration-300
                    ${selectedBarber?.id === barber.id
                      ? 'border-gold bg-gold/10 shadow-[0_0_20px_rgba(201,168,76,0.1)]'
                      : 'border-white/5 bg-bg-elevated hover:border-white/15'
                    }`}
                >
                  <div className="text-4xl mb-2">{barber.avatar}</div>
                  <span className="text-white font-medium text-sm">{barber.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password Input */}
          {selectedBarber && (
            <div className="animate-fade-in">
              <label className="block text-sm text-gray-400 mb-2">
                Contraseña de {selectedBarber.name}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Ingresá tu contraseña"
                className="w-full px-4 py-3 rounded-xl text-sm"
                autoFocus
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
              <span className="text-red-400 text-sm">⚠️ {error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedBarber || !password.trim() || loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-gold to-gold-dark text-black
              hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] transition-all duration-300
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          {/* Hint */}
          <p className="text-center text-gray-600 text-xs">
            Acceso exclusivo para el equipo de B&F Style
          </p>

          {/* Volver al inicio */}
          <div className="pt-4 text-center border-t border-white/5">
            <Link 
              to="/" 
              className="text-gray-400 text-sm hover:text-gold transition-colors inline-flex items-center gap-2"
            >
              <span>←</span> Volver a la página principal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
