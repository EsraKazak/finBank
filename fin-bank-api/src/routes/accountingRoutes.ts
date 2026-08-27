import { Router } from "express";
import {
  getAccountingRecordsHandler,
  createManualRecordHandler,
} from "../controllers/accountingController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getAccountingRecordsHandler);
router.post("/", createManualRecordHandler);

export default router;
