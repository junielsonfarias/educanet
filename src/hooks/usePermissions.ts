import { useMemo } from 'react'
import useUserStore from '@/stores/useUserStore'
import { UserRole } from '@/lib/mock-data'

export type Permission = 
  | 'create:school'
  | 'edit:school'
  | 'delete:school'
  | 'create:student'
  | 'edit:student'
  | 'delete:student'
  | 'create:teacher'
  | 'edit:teacher'
  | 'delete:teacher'
  | 'create:staff'
  | 'edit:staff'
  | 'delete:staff'
  | 'create:classroom'
  | 'edit:classroom'
  | 'delete:classroom'
  | 'create:course'
  | 'edit:course'
  | 'delete:course'
  | 'create:assessment'
  | 'edit:assessment'
  | 'delete:assessment'
  | 'create:document'
  | 'edit:document'
  | 'delete:document'
  | 'create:news'
  | 'edit:news'
  | 'delete:news'
  | 'create:notification'
  | 'edit:notification'
  | 'delete:notification'
  | 'create:protocol'
  | 'edit:protocol'
  | 'delete:protocol'
  | 'create:appointment'
  | 'edit:appointment'
  | 'delete:appointment'
  | 'manage:queue'
  | 'manage:website'
  | 'manage:users'
  | 'manage:settings'
  | 'view:reports'
  | 'export:data'

interface PermissionConfig {
  role: UserRole
  permissions: Permission[]
  schoolScoped?: boolean // Se true, verifica se o usuário tem acesso à escola específica
}

// Configuração de permissões por role
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Admin tem todas as permissões
    'create:school',
    'edit:school',
    'delete:school',
    'create:student',
    'edit:student',
    'delete:student',
    'create:teacher',
    'edit:teacher',
    'delete:teacher',
    'create:staff',
    'edit:staff',
    'delete:staff',
    'create:classroom',
    'edit:classroom',
    'delete:classroom',
    'create:course',
    'edit:course',
    'delete:course',
    'create:assessment',
    'edit:assessment',
    'delete:assessment',
    'create:document',
    'edit:document',
    'delete:document',
    'create:news',
    'edit:news',
    'delete:news',
    'create:notification',
    'edit:notification',
    'delete:notification',
    'create:protocol',
    'edit:protocol',
    'delete:protocol',
    'create:appointment',
    'edit:appointment',
    'delete:appointment',
    'manage:queue',
    'manage:website',
    'manage:users',
    'manage:settings',
    'view:reports',
    'export:data',
  ],
  supervisor: [
    // Supervisor tem permissões similares ao admin, exceto gerenciar usuários
    'create:school',
    'edit:school',
    'delete:school',
    'create:student',
    'edit:student',
    'delete:student',
    'create:teacher',
    'edit:teacher',
    'delete:teacher',
    'create:staff',
    'edit:staff',
    'delete:staff',
    'create:classroom',
    'edit:classroom',
    'delete:classroom',
    'create:course',
    'edit:course',
    'delete:course',
    'create:assessment',
    'edit:assessment',
    'delete:assessment',
    'create:document',
    'edit:document',
    'delete:document',
    'create:news',
    'edit:news',
    'delete:news',
    'create:notification',
    'edit:notification',
    'delete:notification',
    'create:protocol',
    'edit:protocol',
    'delete:protocol',
    'create:appointment',
    'edit:appointment',
    'delete:appointment',
    'manage:queue',
    'manage:website',
    'view:reports',
    'export:data',
  ],
  coordinator: [
    // Coordenador gerencia múltiplas escolas (especificadas em schoolIds)
    'create:student',
    'edit:student',
    'delete:student',
    'create:teacher',
    'edit:teacher',
    'delete:teacher',
    'create:staff',
    'edit:staff',
    'delete:staff',
    'create:classroom',
    'edit:classroom',
    'delete:classroom',
    'create:course',
    'edit:course',
    'delete:course',
    'create:assessment',
    'edit:assessment',
    'delete:assessment',
    'create:document',
    'edit:document',
    'delete:document',
    'create:news',
    'edit:news',
    'delete:news',
    'create:notification',
    'edit:notification',
    'delete:notification',
    'create:protocol',
    'edit:protocol',
    'delete:protocol',
    'create:appointment',
    'edit:appointment',
    'delete:appointment',
    'manage:queue',
    'view:reports',
    'export:data',
  ],
  administrative: [
    // Administrativo gerencia apenas sua escola (especificada em schoolId)
    'create:student',
    'edit:student',
    'create:teacher',
    'edit:teacher',
    'create:staff',
    'edit:staff',
    'create:classroom',
    'edit:classroom',
    'create:course',
    'edit:course',
    'create:assessment',
    'edit:assessment',
    'create:document',
    'edit:document',
    'create:news',
    'edit:news',
    'create:notification',
    'edit:notification',
    'create:protocol',
    'edit:protocol',
    'create:appointment',
    'edit:appointment',
    'manage:queue',
    'view:reports',
  ],
}

/**
 * Hook para verificar permissões do usuário atual
 * 
 * @example
 * const { hasPermission, canManageSchool } = usePermissions()
 * 
 * if (hasPermission('create:student')) {
 *   // Usuário pode criar alunos
 * }
 * 
 * if (canManageSchool('school-id-123')) {
 *   // Usuário pode gerenciar esta escola específica
 * }
 */
export const usePermissions = () => {
  const { currentUser } = useUserStore()

  const permissions = useMemo(() => {
    if (!currentUser) {
      return []
    }
    return rolePermissions[currentUser.role] || []
  }, [currentUser])

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false
    return permissions.includes(permission)
  }

  /**
   * Verifica se o usuário pode gerenciar uma escola específica
   */
  const canManageSchool = (schoolId?: string): boolean => {
    if (!currentUser || !schoolId) return false

    // Admin e supervisor podem gerenciar todas as escolas
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      return true
    }

    // Coordinator pode gerenciar escolas em seu schoolIds
    if (currentUser.role === 'coordinator' && currentUser.schoolIds) {
      return currentUser.schoolIds.includes(schoolId)
    }

    // Administrative pode gerenciar apenas sua escola
    if (currentUser.role === 'administrative' && currentUser.schoolId) {
      return currentUser.schoolId === schoolId
    }

    return false
  }

  /**
   * Verifica se o usuário pode realizar uma ação em uma escola específica
   */
  const canPerformAction = (
    permission: Permission,
    schoolId?: string
  ): boolean => {
    if (!hasPermission(permission)) return false

    // Se a permissão requer escopo de escola, verificar acesso
    const schoolScopedPermissions: Permission[] = [
      'create:student',
      'edit:student',
      'delete:student',
      'create:teacher',
      'edit:teacher',
      'delete:teacher',
      'create:staff',
      'edit:staff',
      'delete:staff',
      'create:classroom',
      'edit:classroom',
      'delete:classroom',
      'create:assessment',
      'edit:assessment',
      'delete:assessment',
    ]

    if (schoolScopedPermissions.includes(permission) && schoolId) {
      return canManageSchool(schoolId)
    }

    return true
  }

  /**
   * Verifica se o usuário é admin ou supervisor
   */
  const isAdminOrSupervisor = useMemo(() => {
    if (!currentUser) return false
    return currentUser.role === 'admin' || currentUser.role === 'supervisor'
  }, [currentUser])

  /**
   * Verifica se o usuário é admin
   */
  const isAdmin = useMemo(() => {
    if (!currentUser) return false
    return currentUser.role === 'admin'
  }, [currentUser])

  return {
    currentUser,
    permissions,
    hasPermission,
    canManageSchool,
    canPerformAction,
    isAdminOrSupervisor,
    isAdmin,
  }
}

