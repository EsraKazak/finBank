import prisma from "../config/prisma";
import { generateReceiptNumber } from "../utils/receiptGenerator";
import type { TransactionType } from "@prisma/client";

export const createManualAccountingRecord = async (data: {
  branchId: number;
  accountId?: number;
  type: TransactionType;
  targetAccountId?: number;
  amount: number;
  description: string;
  userId: string;
}) => {
  const branch = await prisma.branch.findUnique({
    where: { id: data.branchId },
  });

  if (!branch) {
    throw new Error("Geçerli bir şube bulunamadı.");
  }

  const normalizedType = data.type === "WITHDRAWAL" ? "WITHDRAWAL" : data.type;

  const receiptNumber = generateReceiptNumber(branch.code);

  return await prisma.$transaction(async (tx) => {
    let updatedAccount = null;

    if (data.accountId) {
      const account = await tx.account.findUnique({
        where: { id: data.accountId },
      });

      if (!account) {
        throw new Error("İşlem yapılacak hesap bulunamadı.");
      }

      if (account.status === "CLOSED") {
        throw new Error(
          "Kapatılmış hesaplar üzerinde finansal işlem yapılamaz.",
        );
      }

      if (account.status === "BLOCKED" && data.type === "WITHDRAWAL") {
        throw new Error("Blokeli hesaplardan para çekme işlemi yapılamaz.");
      }

      // Para Çekme Kontrolü & Bakiye Düşüşü
      if (data.type === "WITHDRAWAL") {
        if (Number(account.balance) < data.amount) {
          throw new Error(
            `Yetersiz bakiye! Mevcut bakiye: ${account.balance}, Çekilmek istenen: ${data.amount}`,
          );
        }
        updatedAccount = await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              decrement: data.amount,
            },
          },
        });
      }

      // Para Yatırma - Bakiye Artışı
      if (data.type === "DEPOSIT") {
        updatedAccount = await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              increment: data.amount,
            },
          },
        });
      }

      if (normalizedType === "TRANSFER") {
        if (!data.targetAccountId) {
          throw new Error("Transfer için hedef hesap seçilmelidir.");
        }

        if (data.accountId === data.targetAccountId) {
          throw new Error("Kaynak hesap ile hedef hesap aynı olamaz.");
        }

        // 1. Kaynak hesap kontrolleri
        if (account.status === "BLOCKED") {
          throw new Error(
            "Kaynak hesap blokeli olduğu için transfer yapılamaz.",
          );
        }

        if (Number(account.balance) < data.amount) {
          throw new Error(
            `Yetersiz bakiye! Mevcut bakiye: ${account.balance}, Gönderilmek istenen: ${data.amount}`,
          );
        }

        // 2. Hedef hesabı bul ve kontrol et
        const targetAccount = await tx.account.findUnique({
          where: { id: data.targetAccountId },
        });

        if (!targetAccount || targetAccount.status === "CLOSED") {
          throw new Error("Hedef hesap bulunamadı veya kapatılmış.");
        }

        // 3. Kaynaktan parayı düş
        updatedAccount = await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { decrement: data.amount } },
        });

        // 4. Hedefe parayı ekle
        await tx.account.update({
          where: { id: data.targetAccountId },
          data: { balance: { increment: data.amount } },
        });
      }
    }

    // Muhasebe Fişi Kaydı
    const record = await tx.accountingRecord.create({
      data: {
        receiptNumber,
        type: data.type,
        amount: data.amount,
        description: data.description.trim(),
        branchId: data.branchId,
        accountId: data.accountId || null,
        createdById: data.userId,
      },
      include: {
        branch: true,
        account: {
          include: {
            currency: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            surname: true,
            username: true,
          },
        },
      },
    });

    return {
      ...record,
      updatedAccount,
    };
  });
};

export const getAccountingRecords = async (filters: {
  branchId?: number;
  startDate?: string;
  endDate?: string;
  accountId?: number;
  receiptNumber?: string;
}) => {
  const where: any = {};

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }
  if (filters.accountId) {
    where.accountId = filters.accountId;
  }

  if (filters.receiptNumber) {
    where.receiptNumber = {
      contains: filters.receiptNumber.trim(),
      mode: "insensitive",
    };
  }

  if (filters.startDate || filters.endDate) {
    where.transactionDate = {};
    if (filters.startDate) {
      where.transactionDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.transactionDate.lte = end;
    }
  }

  return await prisma.accountingRecord.findMany({
    where,
    include: {
      branch: true,
      account: {
        include: {
          currency: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          surname: true,
          username: true,
        },
      },
    },
    orderBy: { transactionDate: "desc" },
  });
};
