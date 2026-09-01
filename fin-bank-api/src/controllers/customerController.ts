import { Request, Response } from "express";
import * as customerService from "../services/customerService";

export const createCustomerHandler = async (req: Request, res: Response) => {
  try {
    const { identityNumber, firstName, lastName, branchId } = req.body;
    const userId = (req as any).user?.id;

    if (!identityNumber || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "T.C. Kimlik No, Ad ve Soyad alanları zorunludur.",
      });
    }

    const newCustomer = await customerService.registerCustomer(
      identityNumber,
      firstName,
      lastName,
      userId,
      branchId ? Number(branchId) : undefined,
    );

    return res.status(201).json({
      success: true,
      message: "Müşteri başarıyla oluşturuldu.",
      data: newCustomer,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Müşteri oluşturulurken bir hata oluştu.",
    });
  }
};

export const getCustomersHandler = async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId
      ? Number(req.query.branchId)
      : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = req.query.search
      ? String(req.query.search).trim()
      : undefined;

    const { customers, pagination } = await customerService.getCustomers({
      branchId,
      page,
      limit,
      search,
    });

    return res.status(200).json({
      success: true,
      data: customers,
      pagination,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Müşteriler listelenirken bir hata oluştu.",
    });
  }
};
