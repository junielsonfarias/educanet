import { ReactNode } from 'react'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface RequirePermissionProps {
  permission: Permission
  schoolId?: string
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão necessária
 * 
 * @example
 * <RequirePermission permission="create:student" schoolId={school.id}>
 *   <Button>Criar Aluno</Button>
 * </RequirePermission>
 */
export const RequirePermission = ({
  permission,
  schoolId,
  children,
  fallback = null,
  showError = false,
}: RequirePermissionProps) => {
  const { canPerformAction } = usePermissions()

  const hasAccess = canPerformAction(permission, schoolId)

  if (!hasAccess) {
    if (showError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para realizar esta ação.
          </AlertDescription>
        </Alert>
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RequireAnyPermissionProps {
  permissions: Permission[]
  schoolId?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Componente que renderiza children se o usuário tiver QUALQUER uma das permissões
 */
export const RequireAnyPermission = ({
  permissions,
  schoolId,
  children,
  fallback = null,
}: RequireAnyPermissionProps) => {
  const { canPerformAction } = usePermissions()

  const hasAccess = permissions.some((permission) =>
    canPerformAction(permission, schoolId)
  )

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RequireAllPermissionsProps {
  permissions: Permission[]
  schoolId?: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Componente que renderiza children apenas se o usuário tiver TODAS as permissões
 */
export const RequireAllPermissions = ({
  permissions,
  schoolId,
  children,
  fallback = null,
}: RequireAllPermissionsProps) => {
  const { canPerformAction } = usePermissions()

  const hasAccess = permissions.every((permission) =>
    canPerformAction(permission, schoolId)
  )

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

