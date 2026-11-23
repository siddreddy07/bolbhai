import { db } from "../prisma/db.js";
import type {
  CustomerInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema.js";

const customers = db.orm.public.customers;
const invoices = db.orm.public.invoices;
const transactions = db.orm.public.customer_transactions;

export function createCustomer(shopId: string, data: CustomerInput) {
  return customers.create({ shopId, ...data });
}

export function getCustomer(id: string) {
  return customers.first({ id });
}

// A customer of this shop, by phone number (a phone is used once in a shop).
export function customerByPhone(shopId: string, phone: string) {
  return customers.first({ shopId, phone });
}

// Is this customer one of this shop's? (a bill can only be for its own shop's customer)
export async function customerOfShop(shopId: string, id: string) {
  return !!(await customers.first({ id, shopId }));
}

export function updateCustomer(id: string, data: UpdateCustomerInput) {
  return customers.where({ id }).update(data);
}

// Their bills and payments stay, they just no longer name a customer.
export async function deleteCustomer(id: string) {
  await invoices.where({ customerId: id }).update({ customerId: null });
  await transactions.where({ customerId: id }).update({ customerId: null });
  await customers.where({ id }).delete();
}

// Search one shop's customers by name or phone number (part of it is enough). Nothing typed = everyone.
export async function searchCustomers(shopId: string, text: string) {
  const plan = db.raw.sql`
    SELECT id::text AS id, "shopId"::text AS shop_id, name, phone
    FROM customers
    WHERE "shopId" = ${shopId}::uuid
      AND (name ILIKE '%' || ${text}::text || '%' OR phone LIKE '%' || ${text}::text || '%')
    ORDER BY name
    LIMIT 20
  `
    .returnsRow({
      id: "pg/text@1",
      shop_id: "pg/text@1",
      name: "pg/text@1",
      phone: "pg/text@1",
    })
    .build();
  return (await db.query(plan)).map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    phone: r.phone,
  }));
}
