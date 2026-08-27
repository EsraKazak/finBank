import prisma from "../config/prisma";

class UserRepository {
  async findByUsername(username: string) {
    return await prisma.user.findUnique({ where: { username } });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: {
    name: string;
    surname: string;
    username: string;
    email: string;
    password?: string;
    branchId: number;
  }) {
    return await prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        username: data.username,
        email: data.email,
        password: data.password || "",
        branchId: data.branchId,
      },
      include: {
        branch: true,
      },
    });
  }

  async updatePassword(username: string, passwordHash: string) {
    return await prisma.user.update({
      where: { username },
      data: { password: passwordHash },
    });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({ where: { id } });
  }

  // Beyaz Liste İşlemleri (Rol Bilgisi Dahil)
  async findAuthorizedEmail(email: string) {
    return await prisma.authorizedPersonnel.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async createAuthorizedPersonnel(data: {
    name: string;
    surname: string;
    email: string;
    roleId: string;
    branchId: number;
  }) {
    return await prisma.authorizedPersonnel.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        roleId: data.roleId,
        branchId: data.branchId,
        status: "PENDING",
      },
      include: {
        role: true,
        branch: true,
      },
    });
  }

  async getAuthorizedPersonnelList() {
    return await prisma.authorizedPersonnel.findMany({
      include: {
        role: true,
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAuthorizedAsCompleted(email: string) {
    return await prisma.authorizedPersonnel.update({
      where: { email },
      data: { status: "COMPLETED" },
    });
  }

  async getUserRole(userId: string) {
    return await prisma.userRole.findUnique({
      where: { userId },
      include: { role: true },
    });
  }

  async getRolePermissions(roleId: string) {
    return await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  }

  async getUserSpecificPermissions(userId: string) {
    return await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  async assignRoleToUser(userId: string, roleId: string) {
    return await prisma.userRole.upsert({
      where: { userId },
      update: { roleId },
      create: { userId, roleId },
    });
  }

  async getAllRoles() {
    return await prisma.role.findMany({ orderBy: { name: "asc" } });
  }

  async getAllPermissions() {
    return await prisma.permission.findMany({ orderBy: { code: "asc" } });
  }

  async getAllUsersWithRoles() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        email: true,
        createdAt: true,
        userRole: { include: { role: true } },
        userPermissions: { include: { permission: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async syncUserPermissions(userId: string, permissionIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { userId } });
      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            userId,
            permissionId,
          })),
        });
      }
      return tx.userPermission.findMany({
        where: { userId },
        include: { permission: true },
      });
    });
  }
}

export default new UserRepository();
