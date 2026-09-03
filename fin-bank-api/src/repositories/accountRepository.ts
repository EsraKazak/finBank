import prisma from "../config/prisma";
import type { RenewalType, AccountStatus, AccountType } from "@prisma/client";

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

export const findCurrencyById = async (currencyId: number) => {
  return prisma.currency.findUnique({
    where: { id: currencyId },
  });
};

export const findProductCurrencyRule = async (
  productId: number,
  currencyId: number,
) => {
  return prisma.productCurrency.findUnique({
    where: {
      productId_currencyId: { productId, currencyId },
    },
    include: {
      product: true,
      currency: true,
    },
  });
};

export const createAccount = async (data: {
  accountNumber: number;
  iban: string;
  name: string;
  customerId: number;
  branchId: number;
  productId: number;
  currencyId: number;
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
      currency: true,
      branch: true,
      customer: true,
    },
  });
};

export const listAccountsByCustomerId = async (
  customerId: number,
  accountType?: string,
) => {
  const types = accountType
    ? (accountType
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) as AccountType[])
    : undefined;

  return prisma.account.findMany({
    where: {
      customerId,
      ...(types &&
        types.length > 0 && {
          product: {
            type: { in: types },
          },
        }),
    },
    include: {
      product: true,
      currency: true,
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
      currency: true,
      branch: true,
    },
  });
};

export const findAccountById = async (id: number) => {
  return prisma.account.findUnique({
    where: { id },
    include: {
      product: true,
      currency: true,
      customer: true,
    },
  });
};

export const updateAccountName = async (
  accountId: number,
  name: string,
  updatedById: string,
) => {
  return prisma.account.update({
    where: { id: accountId },
    data: { name: name.trim(), updatedById },
    include: {
      product: true,
      currency: true,
    },
  });
};

// tablosmuzdan faiz oranlırnı çektiğimiz kısım
export const findMatchingInterestRate = async (
  currencyId: number,
  termDays: number,
  amount: number,
) => {
  return await prisma.interestRate.findFirst({
    where: {
      currencyId,
      isActive: true,
      minTermDays: { lte: termDays },
      maxTermDays: { gte: termDays },
      minAmount: { lte: amount },
      maxAmount: { gte: amount },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// vadeli güncellemede günü değiştirdiğimizde faizin değişmesini sağlayan method
export const updateTimeDepositAccount = async (
  accountId: number,
  data: {
    name?: string;
    maturityDays?: number;
    maturityStart?: Date;
    maturityEnd?: Date;
    interestRate?: number;
    renewalType?: RenewalType;
    updatedById: string;
  },
) => {
  return prisma.account.update({
    where: { id: accountId },
    data,
    include: {
      product: true,
      currency: true,
      branch: true,
      customer: true,
    },
  });
};
