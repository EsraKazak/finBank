import userRepository from "../repositories/userRepository";

class AdminService {
  async listUsers() {
    return await userRepository.getAllUsersWithRoles();
  }

  async listRolesAndPermissions() {
    const roles = await userRepository.getAllRoles();
    const permissions = await userRepository.getAllPermissions();
    return { roles, permissions };
  }

  async assignRole(userId: string, roleId: string) {
    if (!userId || !roleId) {
      throw new Error("Kullanıcı ID ve Rol ID alanları zorunludur.");
    }
    return await userRepository.assignRoleToUser(userId, roleId);
  }

  async assignExtraPermissions(userId: string, permissionIds: string[]) {
    if (!userId || !Array.isArray(permissionIds)) {
      throw new Error(
        "Geçerli bir kullanıcı ID ve yetki listesi gönderilmelidir.",
      );
    }
    return await userRepository.syncUserPermissions(userId, permissionIds);
  }
}

export default new AdminService();
