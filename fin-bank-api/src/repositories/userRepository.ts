import prisma from "../config/prisma";
import { Role } from "@prisma/client";

class UserRepository {
  // Kullanıcı tablosu işlemleri
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
    role?: Role;
  }) {
    return await prisma.user.create({ data });
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

  // Beyaz Liste (Whitelist) işlemleri
  async findAuthorizedEmail(email: string) {
    return await prisma.authorizedPersonnel.findUnique({ where: { email } });
  }

  // Yöneticinin yeni personel için beyaz liste kaydı açması:
  async createAuthorizedPersonnel(data: {
    name: string;
    surname: string;
    email: string;
    role: Role;
  }) {
    return await prisma.authorizedPersonnel.create({ data });
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
}

export default new UserRepository();
