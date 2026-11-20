import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { editUser, getUser, listUsers, refresh, removeUser, signup } from "../controllers/user.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/refresh", refresh);
router.get("/", auth, listUsers);
router.get("/:id", auth, getUser);
router.put("/:id", auth, editUser);
router.delete("/:id", auth, removeUser);

export default router;
