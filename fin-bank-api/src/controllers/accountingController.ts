import { Request, Response } from "express";
import * as accountingService from "../services/accountingService";

export const getAccountingRecordsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { branchId, accountId, startDate, endDate, receiptNumber } =
      req.query;

    const records = await accountingService.getAccountingRecords({
      branchId: branchId ? Number(branchId) : undefined,
      accountId: accountId ? Number(accountId) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      receiptNumber: receiptNumber as string,
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Muhasebe kayıtları alınamadı.",
    });
  }
};

export const createManualRecordHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { branchId, accountId, targetAccountId, type, amount, description } =
      req.body;
    const userId = (req as any).user?.id;

    if (!branchId || !type || amount === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: "Şube, işlem türü, tutar ve açıklama zorunludur.",
      });
    }

    const record = await accountingService.createManualAccountingRecord({
      branchId: Number(branchId),
      accountId: accountId ? Number(accountId) : undefined,
      type,
      targetAccountId: targetAccountId ? Number(targetAccountId) : undefined,
      amount: Number(amount),
      description,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Muhasebe fişi başarıyla kesildi.",
      data: record,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Fiş oluşturulurken bir hata oluştu.",
    });
  }
};
