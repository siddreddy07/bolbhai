import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  addCustomer,
  editCustomer,
  listCustomers,
  readCustomer,
  removeCustomer,
} from "../controllers/customer.controller.js";

const router = Router();

router.use(auth); // every customer route needs a logged-in user
router.get("/shop/:shopId", listCustomers); // ?q= searches name or phone
router.post("/shop/:shopId", addCustomer);
router.get("/:id", readCustomer);
router.put("/:id", editCustomer);
router.delete("/:id", removeCustomer);

export default router;
