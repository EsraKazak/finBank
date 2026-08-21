import prisma from "../config/prisma";
import { Role } from "@prisma/client";

class UserRepository {
  // Kullanıcı tablosu işlemleri (PostgreSQL)
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

  // Beyaz Liste (Whitelist) işlemleri
  async findAuthorizedEmail(email: string) {
    return await prisma.authorizedPersonnel.findUnique({ where: { email } });
  }

  async markAuthorizedAsCompleted(email: string) {
    return await prisma.authorizedPersonnel.update({
      where: { email },
      data: { status: "COMPLETED" },
    });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

export default new UserRepository();
