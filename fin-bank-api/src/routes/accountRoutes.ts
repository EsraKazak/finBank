import { Router } from "express";
import {
  openAccountHandler,
  getCustomerAccountsHandler,
  listProductsHandler,
  updateAccountStatusHandler,
  updateAccountNameHandler,
  getAccountParametersHandler,
  getApplicableInterestRate,
  updateTimeDepositAccountController,
  getAccountByIdHandler,
  withdrawFromTimeAccountHandler,
  depositToTimeAccountHandler,
} from "../controllers/accountController";
import { authenticateToken } from "../middlewares/authMiddleware";

import {
  getAccountingRecordsHandler,
  createManualRecordHandler,
} from "../controllers/accountingController";

const router = Router();

router.use(authenticateToken);

// 1. Sabit (Statik) İsimli GET Rotaları (Her zaman en üstte olmalı)
router.get("/parameters", getAccountParametersHandler);
router.get("/products", listProductsHandler);
router.get("/interest-rate-preview", getApplicableInterestRate); // <-- /:id'den önceye alındı
router.get("/customer/:customerId", getCustomerAccountsHandler);

// 2. Özel PUT / POST / PATCH Rotaları
router.put("/time-deposit/:id", updateTimeDepositAccountController); // <-- /:id'den önce tanımlanmalı
router.post("/time-deposit/withdraw", withdrawFromTimeAccountHandler);
router.post("/time-deposit/deposit", depositToTimeAccountHandler);
router.patch("/:id/status", updateAccountStatusHandler);
router.patch("/:id/name", updateAccountNameHandler);

// 3. Genel Kök Rotalar (/)
router.get("/", getAccountingRecordsHandler);
router.post("/", openAccountHandler);

// 4. Dinamik GET /:id Rotası (En altta olmalı ki üstteki kelimeleri ID sanmasın)
router.get("/:id", getAccountByIdHandler);

export default router;
