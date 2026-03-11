import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const Index = () => {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

export default Index;
