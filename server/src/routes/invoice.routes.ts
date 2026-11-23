import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  addInvoice,
  editInvoice,
  listInvoices,
  listUnpaid,
  readAnalytics,
  readInvoice,
  removeInvoice,
} from "../controllers/invoice.controller.js";
import { payLink } from "../controllers/payment.controller.js";
import { countLimit, searchLimit } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.use(auth); // every invoice route needs a logged-in user
router.get("/shop/:shopId", searchLimit, listInvoices); // ?q= searches the bills
router.get("/shop/:shopId/unpaid", listUnpaid);
router.get("/shop/:shopId/analytics", readAnalytics);
router.post("/shop/:shopId", addInvoice);
router.get("/:id", readInvoice);
router.post("/:id/pay-link", countLimit, payLink);
router.put("/:id", countLimit, editInvoice);
router.delete("/:id", removeInvoice);

export default router;
