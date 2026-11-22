import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  addInvoice,
  editInvoice,
  listInvoices,
  listUnpaid,
  readInvoice,
  removeInvoice,
} from "../controllers/invoice.controller.js";

const router = Router();

router.use(auth); // every invoice route needs a logged-in user
router.get("/shop/:shopId", listInvoices);
router.get("/shop/:shopId/unpaid", listUnpaid);
router.post("/shop/:shopId", addInvoice);
router.get("/:id", readInvoice);
router.put("/:id", editInvoice);
router.delete("/:id", removeInvoice);

export default router;
