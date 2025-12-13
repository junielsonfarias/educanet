import { Navigate, useLocation } from 'react-router-dom'
import useUserStore from '@/stores/useUserStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser } = useUserStore()
  const location = useLocation()

  // Se não há usuário autenticado, redireciona para login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

