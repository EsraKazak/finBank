import { Request, Response } from "express";
import * as accountService from "../services/accountService";
import prisma from "../config/prisma";
import { findMatchingInterestRate } from "../repositories/accountRepository";

export const getAccountParametersHandler = async (
  _req: Request,
  res: Response,
) => {
  try {
    const [products, currencies, productCurrencies] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      }),
      prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { id: "asc" },
      }),
      prisma.productCurrency.findMany({
        where: { isActive: true },
        include: { currency: true, product: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: { products, currencies, productCurrencies },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Hesap parametreleri yüklenirken bir hata oluştu.",
    });
  }
};

export const openAccountHandler = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      productId,
      currencyId,
      name,
      initialAmount,
      sourceAccountId,
      targetAccountId,
      interestRate,
      renewalType,
      maturityDays,
      maturityStart,
      maturityEnd,
    } = req.body;
    const userId = (req as any).user?.id;

    if (!customerId || !productId || !currencyId || !name) {
      return res.status(400).json({
        success: false,
        message: "Müşteri, ürün, para birimi ve hesap adı alanları zorunludur.",
      });
    }

    const account = await accountService.openAccount({
      customerId: Number(customerId),
      productId: Number(productId),
      currencyId: Number(currencyId),
      name,
      initialAmount:
        initialAmount !== undefined && initialAmount !== ""
          ? Number(initialAmount)
          : 0,
      sourceAccountId: sourceAccountId ? Number(sourceAccountId) : undefined,
      targetAccountId: targetAccountId ? Number(targetAccountId) : undefined,
      interestRate:
        interestRate !== undefined && interestRate !== ""
          ? Number(interestRate)
          : undefined,
      renewalType,
      maturityDays:
        maturityDays !== undefined && maturityDays !== ""
          ? Number(maturityDays)
          : undefined,
      maturityStart: maturityStart ? new Date(maturityStart) : undefined,
      maturityEnd: maturityEnd ? new Date(maturityEnd) : undefined,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Hesap başarıyla açıldı.",
      data: account,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Hesap açılırken bir hata oluştu.",
    });
  }
};

export const getCustomerAccountsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz müşteri ID." });
    }
    const accountType = req.query.accountType;

    const accounts = await accountService.getCustomerAccounts(
      customerId,
      accountType === "DEMAND" || accountType === "TIME"
        ? accountType
        : undefined,
    );
    return res.status(200).json({ success: true, data: accounts });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Hesaplar listelenirken bir hata oluştu.",
    });
  }
};

export const listProductsHandler = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Ürünler listelenirken bir hata oluştu.",
    });
  }
};

export const updateAccountStatusHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const accountId = Number(req.params.id);
    const { status, transferToAccountId } = req.body;
    const userId = (req as any).user?.id;

    if (!accountId || !status) {
      return res.status(400).json({
        success: false,
        message: "Hesap ID ve yeni durum bilgisi zorunludur.",
      });
    }

    const updatedAccount = await accountService.changeAccountStatus(
      accountId,
      status,
      userId,
      transferToAccountId ? Number(transferToAccountId) : undefined,
    );

    return res.status(200).json({
      success: true,
      message: `Hesap durumu başarıyla '${status}' olarak güncellendi.`,
      data: updatedAccount,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Hesap durumu güncellenirken bir hata oluştu.",
    });
  }
};

export const updateAccountNameHandler = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.id);
    const { name } = req.body;
    const userId = (req as any).user?.id;

    if (!accountId || !name) {
      return res.status(400).json({
        success: false,
        message: "Hesap ID ve yeni hesap adı zorunludur.",
      });
    }

    const updated = await accountService.renameAccount(accountId, name, userId);
    return res.status(200).json({
      success: true,
      message: "Hesap adı başarıyla güncellendi.",
      data: updated,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Hesap adı güncellenemedi.",
    });
  }
};

// Ekrana otomatik faiz oranı gelmesi için
export const getApplicableInterestRate = async (
  req: Request,
  res: Response,
) => {
  try {
    const { currencyId, termDays, amount } = req.query;

    if (!currencyId || !termDays || !amount) {
      return res.status(400).json({
        message: "currencyId, termDays ve amount parametreleri zorunludur.",
      });
    }

    const rateRecord = await findMatchingInterestRate(
      Number(currencyId),
      Number(termDays),
      Number(amount),
    );

    if (!rateRecord) {
      return res.status(404).json({
        message: "Girilen kriterlere uygun faiz oranı bulunamadı.",
      });
    }

    return res.json({
      success: true,
      data: {
        rate: rateRecord.rate,
        minTermDays: rateRecord.minTermDays,
        maxTermDays: rateRecord.maxTermDays,
        minAmount: rateRecord.minAmount,
        maxAmount: rateRecord.maxAmount,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Vadeli hesap güncelleme işlemi
export const updateTimeDepositAccountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const accountId = Number(req.params.id);
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const {
      maturityDays,
      maturityStart,
      maturityEnd,
      renewalType,
      targetAccountId,
    } = req.body;

    const result = await accountService.updateTimeAccount({
      accountId,
      maturityDays:
        maturityDays !== undefined && maturityDays !== ""
          ? Number(maturityDays)
          : undefined,
      maturityStart: maturityStart ? new Date(maturityStart) : undefined,
      maturityEnd: maturityEnd ? new Date(maturityEnd) : undefined,
      renewalType,
      targetAccountId: targetAccountId ? Number(targetAccountId) : null,
      userId,
    });

    return res.json({
      success: true,
      data: result,
      message: "Vadeli hesap başarıyla güncellendi.",
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Hesap detaylarını getiren controller
export const getAccountByIdHandler = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.id);
    if (!accountId) {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz hesap ID." });
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        product: true,
        currency: true,
        branch: true,
        customer: true,
        targetAccount: true, // <-- EKLENDİ: Hedef vadesiz hesap detayları dönsün
      },
    });

    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "Hesap bulunamadı." });
    }

    return res.status(200).json({ success: true, data: account });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Hesap detayları getirilirken hata oluştu.",
    });
  }
};
