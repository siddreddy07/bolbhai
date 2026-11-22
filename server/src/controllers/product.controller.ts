import type { Request, Response } from "express";
import { searchSchema } from "../schemas/inventory.schema.js";
import { sizeLabel } from "../services/pack-size.js";
import { searchProduct } from "../services/product.service.js";

// GET /api/products/search?q=atta   the catalog products that match, best first
export async function searchCatalog(req: Request, res: Response) {
  const query = searchSchema.safeParse(req.query);
  if (!query.success) return res.json([]); // too short to search: nothing to show

  try {
    const rows = await searchProduct(query.data.q, 10);
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        size: sizeLabel(r),
        category: r.category,
        price: r.cost ? Number(r.cost) : 0,
      }))
    );
  } catch (error) {
    console.error("Product search failed:", error);
    res.status(500).json({ message: "Could not search" });
  }
}
