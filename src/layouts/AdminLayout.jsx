import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { currentBarber } = useAuth();

  if (!currentBarber) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <AdminSidebar />
      <main className="lg:pl-64 pt-20 lg:pt-6 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
