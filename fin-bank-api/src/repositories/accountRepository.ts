import prisma from "../config/prisma";
import type { RenewalType } from "@prisma/client";
import type { AccountStatus } from "@prisma/client";

export const findLastAccountNumberByCustomer = async (
  customerId: number,
): Promise<number | null> => {
  const lastAccount = await prisma.account.findFirst({
    where: { customerId },
    orderBy: { accountNumber: "desc" },
    select: { accountNumber: true },
  });
  return lastAccount?.accountNumber ?? null;
};

export const findProductById = async (productId: number) => {
  return prisma.product.findUnique({
    where: { id: productId },
  });
};

export const createAccount = async (data: {
  accountNumber: number;
  iban: string;
  name: string;
  currency: string;
  customerId: number;
  branchId: number;
  productId: number;
  createdById: string;
  interestRate?: number | null;
  renewalType?: RenewalType | null;
  maturityStart?: Date | null;
  maturityEnd?: Date | null;
  maturityDays?: number | null;
}) => {
  return prisma.account.create({
    data,
    include: {
      product: true,
      branch: true,
      customer: true,
    },
  });
};

export const listAccountsByCustomerId = async (customerId: number) => {
  return prisma.account.findMany({
    where: { customerId },
    include: {
      product: true,
      branch: true,
    },
    orderBy: { accountNumber: "asc" },
  });
};

export const updateAccountStatus = async (
  accountId: number,
  status: AccountStatus,
  updatedById: string,
) => {
  return prisma.account.update({
    where: { id: accountId },
    data: {
      status,
      updatedById,
    },
    include: {
      product: true,
      branch: true,
    },
  });
};

export const findAccountById = async (id: number) => {
  return prisma.account.findUnique({
    where: { id },
  });
};
