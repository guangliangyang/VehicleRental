import { AuthUser } from './types';

export enum UserRole {
  User = 'User',
  Technician = 'Technician'
}

export interface UserPermissions {
  canViewNearbyVehicles: boolean;
  canRentVehicles: boolean;
  canReturnVehicles: boolean;
  canViewOwnVehicles: boolean;
  canUpdateVehicleStatus: boolean;
  canSetMaintenanceStatus: boolean;
  canSetOutOfServiceStatus: boolean;
}

export const extractRolesFromUser = (user: AuthUser | null): string[] => {
  if (!user) return [];

  const roles: string[] = [];

  // Check for roles in different claim formats
  if (user.roles && Array.isArray(user.roles)) {
    roles.push(...user.roles);
  }

  // Check for role claim (single value)
  if (user.role && typeof user.role === 'string') {
    roles.push(user.role);
  }

  return roles.filter((role, index, self) => self.indexOf(role) === index); // Remove duplicates
};

export const hasRole = (user: AuthUser | null, role: UserRole): boolean => {
  const userRoles = extractRolesFromUser(user);
  return userRoles.includes(role);
};

export const isTechnician = (user: AuthUser | null): boolean => {
  return hasRole(user, UserRole.Technician);
};

export const isUser = (user: AuthUser | null): boolean => {
  return hasRole(user, UserRole.User);
};

export const isAuthenticated = (user: AuthUser | null): boolean => {
  return user !== null;
};

export const getUserPermissions = (user: AuthUser | null): UserPermissions => {
  const userIsTechnician = isTechnician(user);
  const userIsAuthenticated = isAuthenticated(user);

  return {
    // Anonymous users can view nearby vehicles
    canViewNearbyVehicles: true,

    // Authenticated users (both User and Technician) can rent/return and view own vehicles
    canRentVehicles: userIsAuthenticated,
    canReturnVehicles: userIsAuthenticated,
    canViewOwnVehicles: userIsAuthenticated,

    // Only technicians can update vehicle status
    canUpdateVehicleStatus: userIsTechnician,

    // Only technicians can set maintenance/out-of-service status
    canSetMaintenanceStatus: userIsTechnician,
    canSetOutOfServiceStatus: userIsTechnician,
  };
};

export const getDisplayRole = (user: AuthUser | null): string => {
  if (!user) return 'Anonymous';

  if (isTechnician(user)) return 'Technician';
  if (isUser(user)) return 'User';

  return 'Unknown Role';
};

export const getAvailableStatusTransitions = (
  user: AuthUser | null,
  currentStatus: string
): string[] => {
  const userIsTechnician = isTechnician(user);
  const userIsAuthenticated = isAuthenticated(user);

  if (userIsTechnician) {
    // Technicians can set any status except Unknown
    const allStatuses = ['Available', 'Rented', 'Maintenance', 'OutOfService'];
    return allStatuses.filter(status => status !== currentStatus);
  } else if (userIsAuthenticated) {
    // Regular users can only transition between Available and Rented
    if (currentStatus === 'Available') {
      return ['Rented'];
    } else if (currentStatus === 'Rented') {
      return ['Available'];
    }
  }

  // Anonymous users cannot change status
  return [];
};