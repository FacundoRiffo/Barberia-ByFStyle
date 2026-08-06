import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentBarber, setCurrentBarber] = useState(null);

  const login = useCallback((barber) => {
    setCurrentBarber(barber);
  }, []);

  const logout = useCallback(() => {
    setCurrentBarber(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentBarber, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
