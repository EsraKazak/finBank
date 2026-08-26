import * as accountRepository from "../repositories/accountRepository";
import { generateTurkishIban } from "../utils/ibanGenerator";
import prisma from "../config/prisma";
import type { RenewalType } from "@prisma/client";
import type { AccountStatus } from "@prisma/client";

interface OpenAccountDTO {
  customerId: number;
  productId: number;
  name: string;
  interestRate?: number;
  renewalType?: RenewalType;
  maturityDays?: number;
  userId: string;
}

export const openAccount = async (dto: OpenAccountDTO) => {
  const {
    customerId,
    productId,
    name,
    interestRate,
    renewalType,
    maturityDays,
    userId,
  } = dto;

  // 1. Müşteri kontrolü ve şube bilgisi
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { branch: true },
  });

  if (!customer) {
    throw new Error("Geçerli bir müşteri bulunamadı.");
  }

  // 2. Ürün kontrolü
  const product = await accountRepository.findProductById(productId);
  if (!product || !product.isActive) {
    throw new Error("Seçilen bankacılık ürünü bulunamadı veya pasif durumda.");
  }

  // 3. Vadeli / Vadesiz Kontrolleri
  let finalInterestRate: number | null = null;
  let finalRenewalType: RenewalType | null = null;
  let maturityStart: Date | null = null;
  let maturityEnd: Date | null = null;
  let finalMaturityDays: number | null = null;

  if (product.type === "TIME") {
    if (!maturityDays || maturityDays < 1) {
      throw new Error("Vadeli hesap için vade gün sayısı belirtilmelidir.");
    }
    if (!renewalType) {
      throw new Error("Vadeli hesap için temdit tipi seçilmelidir.");
    }
    if (interestRate === undefined || interestRate === null) {
      throw new Error("Vadeli hesap için faiz oranı girilmelidir.");
    }

    // Ürün faiz aralığı kontrolü
    if (product.minInterest && interestRate < Number(product.minInterest)) {
      throw new Error(
        `Uygulanan faiz, taban faizden (%${product.minInterest}) düşük olamaz.`,
      );
    }
    if (product.maxInterest && interestRate > Number(product.maxInterest)) {
      throw new Error(
        `Uygulanan faiz, tavan faizden (%${product.maxInterest}) yüksek olamaz.`,
      );
    }

    finalInterestRate = interestRate;
    finalRenewalType = renewalType;
    finalMaturityDays = maturityDays;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + maturityDays);

    maturityStart = startDate;
    maturityEnd = endDate;
  }

  // 4. Müşterinin hesap sırasını belirle (1001'den başlar)
  const lastAccountNumber =
    await accountRepository.findLastAccountNumberByCustomer(customerId);
  const nextAccountNumber = lastAccountNumber ? lastAccountNumber + 1 : 1001;

  // 5. Otomatik IBAN üret
  const iban = generateTurkishIban(
    customer.branch.code,
    customer.customerNumber,
    nextAccountNumber,
  );

  // 6. Hesabı oluştur
  return await accountRepository.createAccount({
    accountNumber: nextAccountNumber,
    iban,
    name: name.trim(),
    currency: product.currency,
    customerId,
    branchId: customer.branchId, // Müşterinin şubesinde açılır
    productId,
    createdById: userId,
    interestRate: finalInterestRate,
    renewalType: finalRenewalType,
    maturityStart,
    maturityEnd,
    maturityDays: finalMaturityDays,
  });
};

export const getCustomerAccounts = async (customerId: number) => {
  return await accountRepository.listAccountsByCustomerId(customerId);
};

export const changeAccountStatus = async (
  accountId: number,
  newStatus: AccountStatus,
  userId: string,
) => {
  const account = await accountRepository.findAccountById(accountId);

  if (!account) {
    throw new Error("Hesap bulunamadı.");
  }

  // Kapalı hesap üzerinde tekrar işlem yapılamaz kuralı
  if (account.status === "CLOSED") {
    throw new Error(
      "Kapatılmış hesaplar üzerinde durum değişikliği veya işlem yapılamaz.",
    );
  }

  return await accountRepository.updateAccountStatus(
    accountId,
    newStatus,
    userId,
  );
};
