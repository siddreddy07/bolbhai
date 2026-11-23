import type { Request, Response } from "express";
import { addShopId, removeShopId } from "../services/user-cache.service.js";
import { ownsShop } from "../middleware/auth.middleware.js";
import { z } from "zod";
import { idSchema } from "../schemas/id.schema.js";
import { shopSchema, updateShopSchema } from "../schemas/shop.schema.js";
import { addInventorySchema, updateStockSchema } from "../schemas/inventory.schema.js";
import { addToInventory, getInventory, removeFromInventory } from "../services/inventory.service.js";
import { setCounts } from "../services/stock-cache.service.js";
import { createShop, deleteShop, getShopById, getShops, gstinTaken, updateShop } from "../services/shop.service.js";

export async function addShop(req: Request, res: Response) {
  try {
    const body = shopSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ message: z.prettifyError(body.error) });

    if (await gstinTaken(body.data.gstin)) return res.status(409).json({ message: "That GSTIN is already registered" });

    const shop = await createShop({ ...body.data, ownerId: req.user!.id });
    await addShopId(req.user!.id, shop.id); // on the user's list of shops
    res.status(201).json(shop);
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

    const shop = await getShopById(id.data, req.user!.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
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

    const shop = await getShopById(id.data, req.user!.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
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

    const shop = await getShopById(id.data, req.user!.id);
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    await deleteShop(id.data);
    await removeShopId(req.user!.id, id.data); // off the user's list of shops
    res.json({ message: "Shop deleted" });
  } catch (error) {
    console.error("Could not delete shop:", error);
    res.status(500).json({ message: "Could not delete shop" });
  }
}

// GET /api/shops/:id/inventory   everything this shop sells
export async function listInventory(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: "Invalid id" });

    // only the owner may see a shop's inventory
    if (!ownsShop(req, id.data)) return res.status(404).json({ message: "Shop not found" });
    res.json(await getInventory(id.data));
  } catch (error) {
    console.error("Could not get inventory:", error);
    res.status(500).json({ message: "Could not get inventory" });
  }
}

// POST /api/shops/:id/inventory   body = { items: [{ productId, stock }] }   put catalog products on this shop's shelf
export async function addInventory(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    const body = addInventorySchema.safeParse(req.body);
    if (!id.success || !body.success) return res.status(400).json({ message: "Pick at least one product" });

    if (!ownsShop(req, id.data)) return res.status(404).json({ message: "Shop not found" });
    res.status(201).json({ added: await addToInventory(id.data, body.data.items) });
  } catch (error) {
    console.error("Could not add to inventory:", error);
    res.status(500).json({ message: "Could not add the products" });
  }
}

// DELETE /api/shops/:id/inventory/:itemId   take one product off this shop's shelf
export async function removeInventory(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    const itemId = idSchema.safeParse(req.params.itemId);
    if (!id.success || !itemId.success) return res.status(400).json({ message: "Invalid id" });

    if (!ownsShop(req, id.data)) return res.status(404).json({ message: "Shop not found" });
    if (!(await removeFromInventory(id.data, itemId.data))) return res.status(404).json({ message: "Product not found" });
    res.status(204).end();
  } catch (error) {
    console.error("Could not remove from inventory:", error);
    res.status(500).json({ message: "Could not remove the product" });
  }
}

// PATCH /api/shops/:id/inventory   body = { items: [{ id, stock }] }   save the new counts
export async function saveStock(req: Request, res: Response) {
  try {
    const id = idSchema.safeParse(req.params.id);
    const body = updateStockSchema.safeParse(req.body);
    if (!id.success || !body.success) return res.status(400).json({ message: "Invalid stock" });

    if (!ownsShop(req, id.data)) return res.status(404).json({ message: "Shop not found" });
    res.json({ saved: await setCounts(id.data, body.data.items) });
  } catch (error) {
    console.error("Could not save stock:", error);
    res.status(500).json({ message: "Could not save the stock" });
  }
}
