import prisma from "../config/prisma";
import { generateReceiptNumber } from "../utils/receiptGenerator";
import type { TransactionType } from "@prisma/client";

export const createManualAccountingRecord = async (data: {
  branchId: number;
  accountId?: number;
  type: TransactionType;
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

  const receiptNumber = generateReceiptNumber(branch.code);

  return await prisma.accountingRecord.create({
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
      account: true,
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
    where.accountId = filters.accountId; // Ekledik
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
