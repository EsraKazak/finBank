import { Router } from "express";
import {
  openAccountHandler,
  getCustomerAccountsHandler,
  listProductsHandler,
  updateAccountStatusHandler,
} from "../controllers/accountController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/products", listProductsHandler);
router.post("/", openAccountHandler);
router.get("/customer/:customerId", getCustomerAccountsHandler);
router.patch("/:id/status", updateAccountStatusHandler);

export default router;
