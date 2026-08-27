import { Router } from "express";
import {
  openAccountHandler,
  getCustomerAccountsHandler,
  listProductsHandler,
  updateAccountStatusHandler,
  updateAccountNameHandler,
  getAccountParametersHandler,
} from "../controllers/accountController";
import { authenticateToken } from "../middlewares/authMiddleware";

import {
  getAccountingRecordsHandler,
  createManualRecordHandler,
} from "../controllers/accountingController";

const router = Router();

router.use(authenticateToken);

router.get("/parameters", getAccountParametersHandler);
router.get("/products", listProductsHandler);

router.post("/", openAccountHandler);
router.get("/customer/:customerId", getCustomerAccountsHandler);
router.patch("/:id/status", updateAccountStatusHandler);
router.patch("/:id/name", updateAccountNameHandler);

router.get("/", getAccountingRecordsHandler);
router.post("/", createManualRecordHandler);

export default router;
