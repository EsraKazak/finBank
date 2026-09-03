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
  initialAmount?: number;
  sourceAccountId?: number;
  targetAccountId?: number;
  interestRate?: number;
  renewalType?: RenewalType;
  maturityDays?: number;
  maturityStart?: Date;
  maturityEnd?: Date;
  userId: string;
}

export const openAccount = async (dto: OpenAccountDTO) => {
  const {
    customerId,
    productId,
    currencyId,
    name,
    initialAmount = 0,
    sourceAccountId,
    targetAccountId,
    interestRate,
    renewalType,
    maturityDays,
    maturityStart,
    maturityEnd,
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
  const isTimeDeposit = product.type === "TIME";

  // 3. Vadeli / Vadesiz Kontrolleri
  let finalInterestRate: number | null = null;
  let finalRenewalType: RenewalType | null = null;
  let finalMaturityStart: Date | null = null;
  let finalMaturityEnd: Date | null = null;
  let finalMaturityDays: number | null = null;

  if (isTimeDeposit) {
    if (!maturityDays || maturityDays < 1) {
      throw new Error("Vadeli hesap için vade gün sayısı belirtilmelidir.");
    }
    if (!renewalType) {
      throw new Error("Vadeli hesap için temdit tipi seçilmelidir.");
    }
    if (initialAmount <= 0 || !sourceAccountId) {
      throw new Error(
        "Vadeli hesap açılışında bir kaynak vadesiz hesap ve başlangıç açılış tutarı belirtilmelidir.",
      );
    }

    if (initialAmount <= 0 || !sourceAccountId) {
      throw new Error(
        "Vadeli hesap açılışında bir kaynak vadesiz hesap ve başlangıç açılış tutarı belirtilmelidir.",
      );
    }

    // Faiz oranı ve vade gün sayısına göre uygun faiz oranını bul
    const matchingRateRecord = await accountRepository.findMatchingInterestRate(
      currencyId,
      maturityDays,
      initialAmount,
    );

    if (!matchingRateRecord) {
      throw new Error(
        `${rule.currency.code} para biriminde ${maturityDays} gün vade ve ${initialAmount.toFixed(2)} tutar için tanımlı faiz oranı bulunamadı.`,
      );
    }

    finalInterestRate = Number(matchingRateRecord.rate);

    //tavan taban faiz oranı kontrolü
    if (rule.minInterest && finalInterestRate < Number(rule.minInterest)) {
      throw new Error(
        `Belirlenen faiz oranı (%${finalInterestRate}), ürün taban faizinden (%${rule.minInterest}) düşük olamaz.`,
      );
    }
    if (rule.maxInterest && finalInterestRate > Number(rule.maxInterest)) {
      throw new Error(
        `Belirlenen faiz oranı (%${finalInterestRate}), ürün tavan faizinden (%${rule.maxInterest}) yüksek olamaz.`,
      );
    }

    finalRenewalType = renewalType;
    finalMaturityDays = maturityDays;

    // Hafta sonunu bir sonraki iş gününe öteleyen yardımcı fonksiyon
    const adjustToNextBusinessDay = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      if (day === 6)
        d.setDate(d.getDate() + 2); // Cumartesi -> Pazartesi
      else if (day === 0) d.setDate(d.getDate() + 1); // Pazar -> Pazartesi
      return d;
    };

    finalMaturityStart = maturityStart || new Date();

    if (maturityEnd) {
      finalMaturityEnd = adjustToNextBusinessDay(new Date(maturityEnd));
    } else {
      const calculatedEnd = new Date(finalMaturityStart);
      calculatedEnd.setDate(calculatedEnd.getDate() + maturityDays);
      finalMaturityEnd = adjustToNextBusinessDay(calculatedEnd);
    }
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

  // 5. Transaction: Kaynak hesaptan düş + Yeni hesabı aç + Muhasebe Fişi kes
  return await prisma.$transaction(async (tx) => {
    // Vadeli hesap ise kaynak vadesiz hesabın bakiyesini kontrol et ve düş
    if (isTimeDeposit && initialAmount > 0 && sourceAccountId) {
      const sourceAccount = await tx.account.findUnique({
        where: { id: sourceAccountId },
        include: { currency: true },
      });

      if (!sourceAccount || sourceAccount.status !== "ACTIVE") {
        throw new Error("Kaynak vadesiz hesap bulunamadı veya aktif değil.");
      }

      if (sourceAccount.currencyId !== currencyId) {
        throw new Error(
          `Kaynak hesap para birimi (${sourceAccount.currency.code}) ile vadeli hesap para birimi (${rule.currency.code}) aynı olmalıdır.`,
        );
      }

      if (Number(sourceAccount.balance) < initialAmount) {
        throw new Error(
          `Kaynak hesapta yetersiz bakiye. Mevcut Bakiye: ${Number(sourceAccount.balance).toFixed(2)} ${sourceAccount.currency.code}`,
        );
      }

      // Kaynak vadesiz hesaptan tutarı düş
      await tx.account.update({
        where: { id: sourceAccountId },
        data: { balance: { decrement: initialAmount } },
      });
    }

    // Yeni vadeli/vadesiz hesabı oluştur
    const newAccount = await tx.account.create({
      data: {
        accountNumber: nextAccountNumber,
        iban,
        name: name.trim(),
        balance: isTimeDeposit ? initialAmount : 0,
        customerId,
        branchId: customer.branchId,
        productId,
        currencyId,
        createdById: userId,
        interestRate: finalInterestRate,
        renewalType: finalRenewalType,
        maturityStart: finalMaturityStart,
        maturityEnd: finalMaturityEnd,
        maturityDays: finalMaturityDays,
        targetAccountId:
          finalRenewalType !== "PRINCIPAL_AND_INTEREST"
            ? (targetAccountId ?? null)
            : null,
      },
      include: {
        product: true,
        currency: true,
        branch: true,
        customer: true,
      },
    });

    // Muhasebe Fişi Kaydı
    const receiptNumber = generateReceiptNumber(customer.branch.code);
    await tx.accountingRecord.create({
      data: {
        receiptNumber,
        type: isTimeDeposit ? "TRANSFER" : "OTHER",
        amount: isTimeDeposit ? initialAmount : 0.0,
        description: isTimeDeposit
          ? `Vadeli Hesap Açılış Virmanı: [${sourceAccountId}] -> [${newAccount.accountNumber}] (${initialAmount} ${rule.currency.code})`
          : `Hesap Açılış Kaydı: ${newAccount.accountNumber} - ${newAccount.name} (${rule.currency.code})`,
        branchId: customer.branchId,
        accountId: newAccount.id,
        createdById: userId,
      },
    });

    return newAccount;
  });
};

export const getCustomerAccounts = async (
  customerId: number,
  accountType?: "DEMAND" | "TIME",
) => {
  return await accountRepository.listAccountsByCustomerId(
    customerId,
    accountType,
  );
};

export const changeAccountStatus = async (
  accountId: number,
  newStatus: AccountStatus,
  userId: string,
  transferToAccountId?: number,
) => {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { branch: true, currency: true },
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

  const balance = Number(account.balance);

  const statusDescriptions: Record<AccountStatus, string> = {
    BLOCKED: `Hesap Bloke Fişi: ${account.accountNumber} nolu hesaba bloke konuldu.`,
    ACTIVE: `Hesap Bloke Kaldırma Fişi: ${account.accountNumber} nolu hesabın blokesi kaldırıldı.`,
    CLOSED: `Hesap Kapanış Fişi: ${account.accountNumber} nolu hesap kapatıldı.`,
  };

  return await prisma.$transaction(async (tx) => {
    if (newStatus === "CLOSED" && balance > 0) {
      if (!transferToAccountId) {
        throw new Error(
          `Hesap bakiyesi (${balance.toFixed(2)} ${account.currency.code}) sıfır olmadan hesap kapatılamaz. Lütfen bir hedef transfer hesabı seçiniz veya bakiyeyi gişeden çekiniz.`,
        );
      }

      if (transferToAccountId === accountId) {
        throw new Error(
          "Bakiyeyi kapatılmak istenen hesabın kendisine aktaramazsınız.",
        );
      }

      const targetAccount = await tx.account.findUnique({
        where: { id: transferToAccountId },
        include: { branch: true, currency: true },
      });

      if (!targetAccount || targetAccount.status !== "ACTIVE") {
        throw new Error(
          "Seçilen hedef transfer hesabı bulunamadı veya aktif değil.",
        );
      }

      if (targetAccount.currencyId !== account.currencyId) {
        throw new Error(
          `Hedef hesap para birimi (${targetAccount.currency.code}) ile kapatılan hesap para birimi (${account.currency.code}) aynı olmalıdır.`,
        );
      }

      await tx.account.update({
        where: { id: accountId },
        data: { balance: 0 },
      });

      await tx.account.update({
        where: { id: transferToAccountId },
        data: { balance: { increment: balance } },
      });

      const transferReceiptNumber = generateReceiptNumber(account.branch.code);
      await tx.accountingRecord.create({
        data: {
          receiptNumber: transferReceiptNumber,
          type: "TRANSFER",
          amount: balance,
          description: `Hesap Kapatma Bakiye Virmanı: ${account.accountNumber} -> ${targetAccount.accountNumber}`,
          branchId: account.branchId,
          accountId: account.id,
          createdById: userId,
        },
      });
    }

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

//vade değiştiğinde mevcut bakiye üzerinden faiz oranını otomatik bulup güncelleme
export const updateTimeAccount = async (data: {
  accountId: number;
  maturityDays?: number;
  maturityStart?: Date;
  maturityEnd?: Date;
  renewalType?: RenewalType;
  targetAccountId?: number | null;
  userId: string;
}) => {
  const account = await accountRepository.findAccountById(data.accountId);

  if (!account) {
    throw new Error("Hesap bulunamadı.");
  }
  if (account.product.type !== "TIME") {
    throw new Error(
      "Sadece vadeli mevduat hesapları bu ekrandan güncellenebilir.",
    );
  }
  if (account.status !== "ACTIVE") {
    throw new Error(
      "Yalnızca aktif vadeli hesaplar üzerinde güncelleme yapılabilir.",
    );
  }

  let finalInterestRate = Number(account.interestRate);
  const newMaturityDays = data.maturityDays ?? account.maturityDays;

  // Vade günü değiştiyse yeni faiz oranını tablodan otomatik bul
  if (data.maturityDays && data.maturityDays !== account.maturityDays) {
    const rateRecord = await accountRepository.findMatchingInterestRate(
      account.currencyId,
      newMaturityDays!,
      Number(account.balance),
    );

    if (!rateRecord) {
      throw new Error(
        `${account.currency.code} para biriminde ${newMaturityDays} gün ve ${Number(account.balance).toFixed(2)} bakiye için uygun faiz oranı bulunamadı.`,
      );
    }
    finalInterestRate = Number(rateRecord.rate);
  }

  // Temdit tipi "Sadece Anapara" veya "Kapat" seçildiyse hedef hesap kontrolü
  if (
    data.renewalType &&
    data.renewalType !== "PRINCIPAL_AND_INTEREST" &&
    !data.targetAccountId
  ) {
    throw new Error(
      "Seçilen temdit türü için hedef vadesiz hesap seçilmelidir.",
    );
  }

  return await accountRepository.updateTimeDepositAccount(data.accountId, {
    maturityDays: newMaturityDays ?? undefined,
    maturityStart: data.maturityStart,
    maturityEnd: data.maturityEnd,
    interestRate: finalInterestRate,
    renewalType: data.renewalType,
    targetAccountId:
      data.renewalType === "PRINCIPAL_AND_INTEREST"
        ? null
        : (data.targetAccountId ?? null),
    updatedById: data.userId,
  });
};
