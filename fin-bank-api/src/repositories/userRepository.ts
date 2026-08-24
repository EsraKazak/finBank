import prisma from "../config/prisma";

class UserRepository {
  // --- Kullanıcı Tablosu İşlemleri ---
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
  }) {
    return await prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        username: data.username,
        email: data.email,
        password: data.password || "",
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
    return await prisma.user.delete({
      where: { id },
    });
  }

  // --- Beyaz Liste (Whitelist) İşlemleri ---
  async findAuthorizedEmail(email: string) {
    return await prisma.authorizedPersonnel.findUnique({ where: { email } });
  }

  async createAuthorizedPersonnel(data: {
    name: string;
    surname: string;
    email: string;
  }) {
    return await prisma.authorizedPersonnel.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
      },
    });
  }

  async getAuthorizedPersonnelList() {
    return await prisma.authorizedPersonnel.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async markAuthorizedAsCompleted(email: string) {
    return await prisma.authorizedPersonnel.update({
      where: { email },
      data: { status: "COMPLETED" },
    });
  }

  // --- Dinamik Rol ve İzin Çözümleme İşlemleri ---
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

  // --- Yönetici Rol / Yetki Atama İşlemleri ---
  async assignRoleToUser(userId: string, roleId: string) {
    return await prisma.userRole.upsert({
      where: { userId },
      update: { roleId },
      create: { userId, roleId },
    });
  }

  // Tüm rolleri listeleme
  async getAllRoles() {
    return await prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  }

  // Tüm izinleri listeleme
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: { code: "asc" },
    });
  }

  // Rolü henüz atanmamış veya atanmış tüm kullanıcıları rolleriyle listeleme
  async getAllUsersWithRoles() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        email: true,
        createdAt: true,
        userRole: {
          include: { role: true },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Kullanıcıya özel atanmış izinleri toplu güncelleme
  async syncUserPermissions(userId: string, permissionIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      // 1. Kullanıcının mevcut özel izinlerini temizle
      await tx.userPermission.deleteMany({
        where: { userId },
      });

      // 2. Yeni seçilen izinleri toplu ekle
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
