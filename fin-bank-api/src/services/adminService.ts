import userRepository from "../repositories/userRepository";
import prisma from "../config/prisma";

export interface SystemAuditLogItem {
  id: string;
  category: "FINANCIAL" | "CUSTOMER" | "ACCOUNT";
  action: string;
  description: string;
  performedBy: string;
  branchName?: string;
  date: Date;
}

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
  // YENİ EKLENEN METOT: Mevcut verilerden log sentezleme
  async getAuditLogs(limit: number = 100): Promise<SystemAuditLogItem[]> {
    // 1. Finansal / Kasa Hareketleri
    const accountingRecords = await prisma.accountingRecord.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, surname: true } },
        branch: { select: { name: true } },
        account: { select: { iban: true, accountNumber: true } },
      },
    });

    // 2. Müşteri Oluşturma ve Güncellemeleri
    const customers = await prisma.customer.findMany({
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { name: true, surname: true } },
        updatedBy: { select: { name: true, surname: true } },
        branch: { select: { name: true } },
      },
    });

    // 3. Hesap Açılış ve Güncellemeleri
    const accounts = await prisma.account.findMany({
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        createdBy: { select: { name: true, surname: true } },
        updatedBy: { select: { name: true, surname: true } },
        customer: {
          select: { firstName: true, lastName: true, customerNumber: true },
        },
        branch: { select: { name: true } },
      },
    });

    const logs: SystemAuditLogItem[] = [];

    // Finansal hareketleri ekle
    for (const record of accountingRecords) {
      logs.push({
        id: `fin-${record.id}`,
        category: "FINANCIAL",
        action: record.type, // DEPOSIT, WITHDRAWAL, TRANSFER, OTHER
        description: `${record.receiptNumber} nolu dekont/fiş: ${record.description} (${Number(record.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL)`,
        performedBy: `${record.createdBy.name} ${record.createdBy.surname}`,
        branchName: record.branch?.name,
        date: record.createdAt,
      });
    }

    // Müşteri hareketlerini ekle
    for (const cust of customers) {
      const isUpdated =
        cust.updatedAt.getTime() > cust.createdAt.getTime() + 1000;
      logs.push({
        id: `cust-${cust.id}-${isUpdated ? "upd" : "cre"}`,
        category: "CUSTOMER",
        action: isUpdated ? "MÜŞTERİ GÜNCELLEME" : "YENİ MÜŞTERİ",
        description: `${cust.customerNumber} nolu müşteri (${cust.firstName} ${cust.lastName}) ${
          isUpdated ? "bilgileri güncellendi" : "kaydı oluşturuldu"
        }.`,
        performedBy:
          isUpdated && cust.updatedBy
            ? `${cust.updatedBy.name} ${cust.updatedBy.surname}`
            : `${cust.createdBy.name} ${cust.createdBy.surname}`,
        branchName: cust.branch?.name,
        date: isUpdated ? cust.updatedAt : cust.createdAt,
      });
    }

    // Hesap hareketlerini ekle
    for (const acc of accounts) {
      const isUpdated =
        acc.updatedAt.getTime() > acc.createdAt.getTime() + 1000;
      logs.push({
        id: `acc-${acc.id}-${isUpdated ? "upd" : "cre"}`,
        category: "ACCOUNT",
        action: isUpdated ? "HESAP GÜNCELLEME" : "HESAP AÇILIŞI",
        description: `${acc.name} (${acc.iban}) ${
          isUpdated ? "hesabı güncellendi" : "hesabı açıldı"
        }. Müşteri: ${acc.customer.firstName} ${acc.customer.lastName}`,
        performedBy:
          isUpdated && acc.updatedBy
            ? `${acc.updatedBy.name} ${acc.updatedBy.surname}`
            : `${acc.createdBy.name} ${acc.createdBy.surname}`,
        branchName: acc.branch?.name,
        date: isUpdated ? acc.updatedAt : acc.createdAt,
      });
    }

    // Tarihe göre en yeniden eskiye sıralayıp limit kadarını dön
    return logs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
}

export default new AdminService();
