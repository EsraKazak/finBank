import { Request, Response } from "express";
import * as accountService from "../services/accountService";
import prisma from "../config/prisma";

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
      interestRate,
      renewalType,
      maturityDays,
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
      interestRate:
        interestRate !== undefined && interestRate !== ""
          ? Number(interestRate)
          : undefined,
      renewalType,
      maturityDays:
        maturityDays !== undefined && maturityDays !== ""
          ? Number(maturityDays)
          : undefined,
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

    const accounts = await accountService.getCustomerAccounts(customerId);
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
    const { status } = req.body;
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
