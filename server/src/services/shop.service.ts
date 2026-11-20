import { db } from "../prisma/db.js";
import type { ShopInput, UpdateShopInput } from "../schemas/shop.schema.js";

const shops = db.orm.public.shops;

export function createShop(data: ShopInput & { ownerId: string }) {
  return shops.create(data);
}

export function updateShop(id: string, data: UpdateShopInput) {
  return shops.where({ id }).update(data);
}

export function deleteShop(id: string) {
  return shops.where({ id }).delete();
}

export function getShops(ownerId: string) {
  return shops.where({ ownerId }).all();
}

export function getShopById(id: string) {
  return shops.first({ id });
}
