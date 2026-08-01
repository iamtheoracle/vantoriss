export function createIdentityService(base44) {
  return {
    async getCurrentUser(req) {
      return await base44.auth.me();
    },

    async getUserById(id) {
      const users = await base44.asServiceRole.entities.User.filter({ id });
      return users[0] || null;
    },

    async getUserByEmail(email) {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      return users[0] || null;
    },

    getUserRole(user) {
      return user?.role || 'user';
    },

    isAdmin(user) {
      return user?.role === 'admin';
    },

    isAuthenticated(user) {
      return !!user?.id;
    },
  };
}