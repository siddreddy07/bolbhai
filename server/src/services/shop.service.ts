import { db } from "../prisma/db.js";
import type { ShopInput, UpdateShopInput } from "../schemas/shop.schema.js";

const shops = db.orm.public.shops;

// The only shop fields that ever leave the server.
function publicShop(shop: { id: string; name: string | null; type: string; gstin: string }) {
  return { id: shop.id, name: shop.name, type: shop.type, gstin: shop.gstin };
}

export async function createShop(data: ShopInput & { ownerId: string }) {
  return publicShop(await shops.create(data));
}

export async function updateShop(id: string, data: UpdateShopInput) {
  const shop = await shops.where({ id }).update(data);
  return shop ? publicShop(shop) : null;
}

export function deleteShop(id: string) {
  return shops.where({ id }).delete();
}

export function getShops(ownerId: string) {
  return shops.select("id", "name", "type", "gstin").where({ ownerId }).all();
}

// Only finds the shop if it belongs to this owner.
export function getShopById(id: string, ownerId: string) {
  return shops.select("id", "name", "type", "gstin").first({ id, ownerId });
}
