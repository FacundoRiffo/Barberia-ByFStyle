import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#c9a84c]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a07c2e] flex items-center justify-center text-black font-bold text-sm
              group-hover:shadow-[0_0_20px_rgba(201,168,76,0.4)] transition-shadow duration-300">
              B&F
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white tracking-wide font-['Playfair_Display',serif]">
                B&F Style
              </span>
              <span className="text-[10px] text-[#c9a84c] tracking-[0.2em] uppercase -mt-1">
                Barbería Premium
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive('/') ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Inicio
            </Link>
            <Link
              to="/reservar"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive('/reservar') ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Reservar Turno
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transform transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transform transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-60 pb-4' : 'max-h-0'}`}>
          <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive('/') ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Inicio
            </Link>
            <Link
              to="/reservar"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive('/reservar') ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Reservar Turno
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
