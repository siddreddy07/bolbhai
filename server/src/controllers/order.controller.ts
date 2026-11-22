import type { Request, Response } from "express";
import { runOrder } from "../agent/bolbhai.graph.js";
import { checkModel } from "../ai/model.js";
import { idSchema } from "../schemas/id.schema.js";
import { getShopById } from "../services/shop.service.js";

// POST /api/orders/confirm   body = { shopId, text }   the items are found on THIS shop's shelf
// The shopkeeper checked (and maybe fixed) the transcript and pressed Confirm: now the order graph runs on it.
export async function confirmOrder(req: Request, res: Response) {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const shopId = idSchema.safeParse(req.body?.shopId);
  if (!shopId.success)
    return res.status(400).json({ message: "Pick a shop first" });
  if (!text) return res.status(400).json({ message: "Nothing to order" });
  if (text.length > 1000)
    return res.status(400).json({ message: "That is too long" });

  // only the owner may order from a shop
  if (!(await getShopById(shopId.data, req.user!.id)))
    return res.status(404).json({ message: "Shop not found" });

  // check the AI first, so a down model gives a clear answer and not a slow failure
  const model = await checkModel();
  if (!model.ok) {
    console.error("AI model not ready:", model.reason);
    return res.status(503).json({ message: model.reason });
  }

  try {
    res.json({ order: await runOrder(shopId.data, text) });
  } catch (error) {
    console.error(
      "Order failed:",
      error instanceof Error ? error.message : error,
    );
    res.status(500).json({ message: "Could not find the items" });
  }
}
