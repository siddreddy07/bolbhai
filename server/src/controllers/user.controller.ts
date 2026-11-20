import type { Request, Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/id.schema.js";
import { COOKIE_OPTIONS } from "../config/constant.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../helper/jwt.helper.js";
import { loginSchema, signupSchema, updateUserSchema } from "../schemas/user.schema.js";
import { createUser, deleteUser, getUserByEmail, getUserById, getUsers, loginUser, updateUser } from "../services/user.service.js";

export async function signup(req: Request, res: Response) {
  try {
    const body = signupSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    if (await getUserByEmail(body.data.email)) return res.status(409).json({ message: "Email already registered" });

    const user = await createUser(body.data);
    res.cookie("accessToken", signAccessToken(user.id), COOKIE_OPTIONS);
    res.cookie("refreshToken", signRefreshToken(user.id), COOKIE_OPTIONS);
    res.status(201).json(user);
  } catch (error) {
    console.error("Could not sign up:", error);
    res.status(500).json({ message: "Could not sign up" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    const user = await loginUser(body.data.email, body.data.password);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    res.cookie("accessToken", signAccessToken(user.id), COOKIE_OPTIONS);
    res.cookie("refreshToken", signRefreshToken(user.id), COOKIE_OPTIONS);
    res.json(user);
  } catch (error) {
    console.error("Could not log in:", error);
    res.status(500).json({ message: "Could not log in" });
  }
}

// Returns the logged-in user (set by the auth middleware), so the client can restore its session on reload.
export function me(req: Request, res: Response) {
  res.json(req.user);
}

export async function refresh(req: Request, res: Response) {
  try {
    const { id } = verifyRefreshToken(req.cookies.refreshToken);
    res.cookie("accessToken", signAccessToken(id), COOKIE_OPTIONS);
    res.json({ message: "Token refreshed" });
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
}

export async function listUsers(_req: Request, res: Response) {
  try {
    res.json(await getUsers());
  } catch (error) {
    console.error("Could not get users:", error);
    res.status(500).json({ message: "Could not get users" });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    const user = await getUserById(id.data);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Could not get user:", error);
    res.status(500).json({ message: "Could not get user" });
  }
}

export async function editUser(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    const body = updateUserSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    if (!(await getUserById(id.data))) return res.status(404).json({ message: "User not found" });
    res.json(await updateUser(id.data, body.data));
  } catch (error) {
    console.error("Could not update user:", error);
    res.status(500).json({ message: "Could not update user" });
  }
}

export async function removeUser(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    if (!(await getUserById(id.data))) return res.status(404).json({ message: "User not found" });
    await deleteUser(id.data);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Could not delete user:", error);
    res.status(500).json({ message: "Could not delete user" });
  }
}
