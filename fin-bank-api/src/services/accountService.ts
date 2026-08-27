import * as accountRepository from "../repositories/accountRepository";
import { generateTurkishIban } from "../utils/ibanGenerator";
import { generateReceiptNumber } from "../utils/receiptGenerator";
import prisma from "../config/prisma";
import type { RenewalType, AccountStatus } from "@prisma/client";

interface OpenAccountDTO {
  customerId: number;
  productId: number;
  currencyId: number;
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
    currencyId,
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

  // 2. Ürün ve Para Birimi Kural Kontrolü
  const rule = await accountRepository.findProductCurrencyRule(
    productId,
    currencyId,
  );
  if (
    !rule ||
    !rule.isActive ||
    !rule.product.isActive ||
    !rule.currency.isActive
  ) {
    throw new Error(
      "Seçilen bankacılık ürünü bu para biriminde hesap açılışına kapalıdır.",
    );
  }

  const product = rule.product;

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

    if (rule.minInterest && interestRate < Number(rule.minInterest)) {
      throw new Error(
        `Uygulanan faiz, taban faizden (%${rule.minInterest}) düşük olamaz.`,
      );
    }
    if (rule.maxInterest && interestRate > Number(rule.maxInterest)) {
      throw new Error(
        `Uygulanan faiz, tavan faizden (%${rule.maxInterest}) yüksek olamaz.`,
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

  // 4. Hesap sırasını ve IBAN'ı belirle
  const lastAccountNumber =
    await accountRepository.findLastAccountNumberByCustomer(customerId);
  const nextAccountNumber = lastAccountNumber ? lastAccountNumber + 1 : 1001;

  const iban = generateTurkishIban(
    customer.branch.code,
    customer.customerNumber,
    nextAccountNumber,
  );

  // 5. Transaction: Hem hesabı aç hem de Açılış Muhasebe Fişini kes
  return await prisma.$transaction(async (tx) => {
    const newAccount = await tx.account.create({
      data: {
        accountNumber: nextAccountNumber,
        iban,
        name: name.trim(),
        customerId,
        branchId: customer.branchId,
        productId,
        currencyId,
        createdById: userId,
        interestRate: finalInterestRate,
        renewalType: finalRenewalType,
        maturityStart,
        maturityEnd,
        maturityDays: finalMaturityDays,
      },
      include: {
        product: true,
        currency: true,
        branch: true,
        customer: true,
      },
    });

    // Açılış Fişi Kaydı
    const receiptNumber = generateReceiptNumber(customer.branch.code);
    await tx.accountingRecord.create({
      data: {
        receiptNumber,
        type: "OTHER",
        amount: 0.0,
        description: `Hesap Açılış Kaydı: ${newAccount.accountNumber} - ${newAccount.name} (${rule.currency.code})`,
        branchId: customer.branchId,
        accountId: newAccount.id,
        createdById: userId,
      },
    });

    return newAccount;
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
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { branch: true },
  });

  if (!account) {
    throw new Error("Hesap bulunamadı.");
  }

  if (account.status === "CLOSED") {
    throw new Error(
      "Kapatılmış hesaplar üzerinde durum değişikliği veya işlem yapılamaz.",
    );
  }

  if (account.status === newStatus) {
    throw new Error(`Hesap zaten ${newStatus} durumundadır.`);
  }

  // Bakiye kontrolü: Kapatılacak hesapta bakiye sıfır olmalıdır
  if (newStatus === "CLOSED" && Number(account.balance) > 0) {
    throw new Error(
      `Hesap bakiyesi (${account.balance}) sıfır olmadan hesap kapatılamaz. Lütfen önce bakiyeyi çekiniz.`,
    );
  }

  // Fiş açıklamalarını duruma göre dinamik belirle
  const statusDescriptions: Record<AccountStatus, string> = {
    BLOCKED: `Hesap Bloke Fişi: ${account.accountNumber} nolu hesaba bloke konuldu.`,
    ACTIVE: `Hesap Bloke Kaldırma Fişi: ${account.accountNumber} nolu hesabın blokesi kaldırıldı.`,
    CLOSED: `Hesap Kapanış Fişi: ${account.accountNumber} nolu hesap kapatıldı.`,
  };

  return await prisma.$transaction(async (tx) => {
    // 1. Hesap durumunu güncelle
    const updatedAccount = await tx.account.update({
      where: { id: accountId },
      data: {
        status: newStatus,
        updatedById: userId,
      },
      include: {
        product: true,
        currency: true,
        branch: true,
      },
    });

    // 2. Her durum değişikliği için Muhasebe Fişi kes
    const receiptNumber = generateReceiptNumber(account.branch.code);
    await tx.accountingRecord.create({
      data: {
        receiptNumber,
        type: "OTHER",
        amount: 0.0,
        description: statusDescriptions[newStatus],
        branchId: account.branchId,
        accountId: account.id,
        createdById: userId,
      },
    });

    return updatedAccount;
  });
};

export const renameAccount = async (
  accountId: number,
  newName: string,
  userId: string,
) => {
  const account = await accountRepository.findAccountById(accountId);
  if (!account) {
    throw new Error("Hesap bulunamadı.");
  }
  if (account.status === "CLOSED") {
    throw new Error("Kapatılmış hesapların adı güncellenemez.");
  }
  if (!newName.trim()) {
    throw new Error("Hesap adı boş bırakılamaz.");
  }
  return await accountRepository.updateAccountName(accountId, newName, userId);
};
