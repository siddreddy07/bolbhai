import type { Request, Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/id.schema.js";
import { shopSchema, updateShopSchema } from "../schemas/shop.schema.js";
import { createShop, deleteShop, getShopById, getShops, updateShop } from "../services/shop.service.js";

export async function addShop(req: Request, res: Response) {
  try {
    const body = shopSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    res.status(201).json(await createShop({ ...body.data, ownerId: req.user!.id }));
  } catch (error) {
    console.error("Could not create shop:", error);
    res.status(500).json({ message: "Could not create shop" });
  }
}

export async function listShops(req: Request, res: Response) {
  try {
    res.json(await getShops(req.user!.id));
  } catch (error) {
    console.error("Could not get shops:", error);
    res.status(500).json({ message: "Could not get shops" });
  }
}

export async function getShop(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    const shop = await getShopById(id.data);
    if (!shop || shop.ownerId !== req.user!.id) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (error) {
    console.error("Could not get shop:", error);
    res.status(500).json({ message: "Could not get shop" });
  }
}

export async function editShop(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    const body = updateShopSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    const shop = await getShopById(id.data);
    if (!shop || shop.ownerId !== req.user!.id) return res.status(404).json({ message: "Shop not found" });
    res.json(await updateShop(id.data, body.data));
  } catch (error) {
    console.error("Could not update shop:", error);
    res.status(500).json({ message: "Could not update shop" });
  }
}

export async function removeShop(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    const shop = await getShopById(id.data);
    if (!shop || shop.ownerId !== req.user!.id) return res.status(404).json({ message: "Shop not found" });
    await deleteShop(id.data);
    res.json({ message: "Shop deleted" });
  } catch (error) {
    console.error("Could not delete shop:", error);
    res.status(500).json({ message: "Could not delete shop" });
  }
}
