import { Link } from 'react-router-dom';
import { SERVICES, BARBERS, formatPrice } from '../../data/constants';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-xs sm:text-sm font-medium tracking-wider uppercase">
              Barbería Premium
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold font-['Playfair_Display',serif] mb-6 animate-fade-in stagger-2">
            <span className="text-white">B&F</span>
            <span className="gold-text-gradient"> Style</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in stagger-3 leading-relaxed">
            Donde el estilo se encuentra con la precisión. Experimenta el corte perfecto
            con nuestros barberos profesionales.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in stagger-4">
            <Link
              to="/reservar"
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-black font-semibold text-base
                hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span className="relative z-10">Reservar Turno</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <a
              href="#servicios"
              className="px-8 py-4 rounded-xl border border-white/10 text-white font-medium text-base
                hover:bg-white/5 hover:border-white/20 transition-all duration-300 w-full sm:w-auto"
            >
              Ver Servicios
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 animate-fade-in stagger-5">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold gold-text-gradient">2</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Barberos Pro</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold gold-text-gradient">5</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Servicios</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold gold-text-gradient">100%</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Satisfacción</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in stagger-6">
          <span className="text-gray-600 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-gold animate-bounce" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 sm:py-32 px-4 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-medium tracking-[0.2em] uppercase">Nuestros Servicios</span>
            <h2 className="text-3xl sm:text-5xl font-bold font-['Playfair_Display',serif] text-white mt-3">
              Servicios <span className="gold-text-gradient">Premium</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto">
              Cada servicio está diseñado para brindarte una experiencia única y profesional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service, index) => (
              <div
                key={service.id}
                className={`group glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fade-in stagger-${index + 1}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </span>
                  {service.exclusive && (
                    <span className="px-2 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-medium tracking-wider uppercase border border-gold/20">
                      Exclusivo
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Duración: {service.duration} min
                  {service.exclusive && ` • Solo con Facundo`}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-2xl font-bold gold-text-gradient">{formatPrice(service.price)}</span>
                  <Link
                    to="/reservar"
                    className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm font-medium
                      hover:bg-gold/10 hover:text-gold transition-all duration-200"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="py-20 sm:py-32 px-4 relative bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-medium tracking-[0.2em] uppercase">El Equipo</span>
            <h2 className="text-3xl sm:text-5xl font-bold font-['Playfair_Display',serif] text-white mt-3">
              Nuestros <span className="gold-text-gradient">Barberos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BARBERS.map((barber) => (
              <div
                key={barber.id}
                className="glass-card rounded-2xl p-8 text-center group hover:border-gold/30 transition-all duration-300"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/20
                  flex items-center justify-center text-5xl mb-6
                  group-hover:border-gold/40 group-hover:shadow-[0_0_30px_rgba(201,168,76,0.15)] transition-all duration-300">
                  {barber.avatar}
                </div>
                <h3 className="text-2xl font-bold text-white font-['Playfair_Display',serif] mb-2">{barber.name}</h3>
                <p className="text-gold text-sm mb-4">Barbero Profesional</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {barber.services.map((sId) => {
                    const service = SERVICES.find((s) => s.id === sId);
                    return (
                      <span
                        key={sId}
                        className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs border border-white/5"
                      >
                        {service?.name}
                      </span>
                    );
                  })}
                </div>
                <Link
                  to="/reservar"
                  className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-gold/10 text-gold font-medium text-sm
                    border border-gold/20 hover:bg-gold/20 transition-all duration-200"
                >
                  Reservar con {barber.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-['Playfair_Display',serif] text-white mb-4">
            ¿Listo para tu próximo <span className="gold-text-gradient">corte</span>?
          </h2>
          <p className="text-gray-400 mb-8">
            Reserva tu turno online y asegura tu lugar. Rápido, fácil y sin esperas.
          </p>
          <Link
            to="/reservar"
            className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-black font-semibold text-lg
              hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] transition-all duration-300 hover:scale-105"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-black font-bold text-[10px]">
              B&F
            </div>
            <span className="text-sm text-gray-500">© 2026 B&F Style. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/reservar" className="hover:text-gold transition-colors">Reservar</Link>
            <Link to="/admin" className="hover:text-gold transition-colors">Acceso Barberos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
