import type { Request, Response } from "express";
import { inventorySearchSchema } from "../schemas/inventory.schema.js";
import { searchInventory } from "../services/inventory.service.js";
import { getShopById } from "../services/shop.service.js";

// GET /api/inventory/search?shopId=...&q=atta   the items on this shop's shelf that match, best first
export async function searchShopInventory(req: Request, res: Response) {
  const query = inventorySearchSchema.safeParse(req.query);
  if (!query.success) return res.json([]); // too short to search (or no shop): nothing to show

  try {
    // only the owner may search a shop's inventory
    if (!(await getShopById(query.data.shopId, req.user!.id))) return res.status(404).json({ message: "Shop not found" });
    res.json(await searchInventory(query.data.shopId, query.data.q, 10));
  } catch (error) {
    console.error("Inventory search failed:", error);
    res.status(500).json({ message: "Could not search" });
  }
}
