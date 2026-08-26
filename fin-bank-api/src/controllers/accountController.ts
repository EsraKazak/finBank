import { Request, Response } from "express";
import * as accountService from "../services/accountService";
import prisma from "../config/prisma";

export const openAccountHandler = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      productId,
      name,
      interestRate,
      renewalType,
      maturityDays,
    } = req.body;
    const userId = (req as any).user?.id;

    if (!customerId || !productId || !name) {
      return res.status(400).json({
        success: false,
        message: "Müşteri, ürün ve hesap adı alanları zorunludur.",
      });
    }

    const account = await accountService.openAccount({
      customerId: Number(customerId),
      productId: Number(productId),
      name,
      interestRate:
        interestRate !== undefined ? Number(interestRate) : undefined,
      renewalType,
      maturityDays: maturityDays ? Number(maturityDays) : undefined,
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
