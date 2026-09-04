import { hasOperationsAccess, isSuperAdmin } from './operationsAccess';

export function isOperatorAccount(user) {
  return Boolean(user && (isSuperAdmin(user) || hasOperationsAccess(user.role)));
}

export function getPostLoginRoute(user) {
  return isOperatorAccount(user) ? '/operations' : '/';
}
