import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { countLimit } from "../middleware/rate-limit.middleware.js";
import { addInventory, addShop, editShop, getShop, listInventory, listShops, removeInventory, removeShop, saveStock } from "../controllers/shop.controller.js";

const router = Router();

router.use(auth);
router.post("/", addShop);
router.get("/", listShops);
router.get("/:id", getShop);
router.get("/:id/inventory", listInventory);
router.post("/:id/inventory", addInventory);
router.patch("/:id/inventory", countLimit, saveStock);
router.delete("/:id/inventory/:itemId", removeInventory);
router.put("/:id", editShop);
router.delete("/:id", removeShop);

export default router;
