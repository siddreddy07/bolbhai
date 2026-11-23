import { db } from "../prisma/db.js";
import { forgetShelf } from "./stock-cache.service.js";
import type { ShopInput, UpdateShopInput } from "../schemas/shop.schema.js";

const shops = db.orm.public.shops;
const inventory = db.orm.public.shop_inventory;
const invoices = db.orm.public.invoices;
const customers = db.orm.public.customers;
const transactions = db.orm.public.customer_transactions;

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

// A shop's inventory and invoices go with it (they cannot exist without a shop).
export async function deleteShop(id: string) {
  await transactions.where({ shopId: id }).delete();
  await inventory.where({ shopId: id }).delete();
  await invoices.where({ shopId: id }).delete();
  await customers.where({ shopId: id }).delete();
  await forgetShelf(id);
  return shops.where({ id }).delete();
}

export function gstinTaken(gstin: string) {
  return shops.first({ gstin });
}

export function getShops(ownerId: string) {
  return shops.select("id", "name", "type", "gstin").where({ ownerId }).all();
}

// Only finds the shop if it belongs to this owner.
export function getShopById(id: string, ownerId: string) {
  return shops.select("id", "name", "type", "gstin").first({ id, ownerId });
}
