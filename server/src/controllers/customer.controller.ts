import type { Request, Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/id.schema.js";
import {
  customerSchema,
  updateCustomerSchema,
} from "../schemas/customer.schema.js";
import {
  createCustomer,
  customerByPhone,
  deleteCustomer,
  getCustomer,
  searchCustomers,
  updateCustomer,
} from "../services/customer.service.js";
import { getShopById } from "../services/shop.service.js";

const PHONE_TAKEN = "A customer with this phone number already exists";

// A customer belongs to a shop, and a shop to its owner: only the owner may touch it.
// Gives the customer, or answers the error itself and gives nothing.
async function ownCustomer(req: Request, res: Response) {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ message: "Invalid id" });
    return null;
  }
  const customer = await getCustomer(id.data);
  if (!customer || !(await getShopById(customer.shopId, req.user!.id))) {
    res.status(404).json({ message: "Customer not found" });
    return null;
  }
  return customer;
}

// POST /api/customers/shop/:shopId   body = { name, phone }
export async function addCustomer(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    const body = customerSchema.safeParse(req.body);
    if (!shopId.success) return res.status(400).json({ message: "Invalid id" });
    if (!body.success)
      return res.status(400).json({ message: z.prettifyError(body.error) });

    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    if (await customerByPhone(shopId.data, body.data.phone))
      return res.status(409).json({ message: PHONE_TAKEN });
    res.status(201).json(await createCustomer(shopId.data, body.data));
  } catch (error) {
    console.error("Could not create customer:", error);
    res.status(500).json({ message: "Could not create the customer" });
  }
}

// GET /api/customers/shop/:shopId?q=ram   search by name or phone number (no q = everyone)
export async function listCustomers(req: Request, res: Response) {
  try {
    const shopId = idSchema.safeParse(req.params.shopId);
    if (!shopId.success) return res.status(400).json({ message: "Invalid id" });

    if (!(await getShopById(shopId.data, req.user!.id)))
      return res.status(404).json({ message: "Shop not found" });
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    res.json(await searchCustomers(shopId.data, q));
  } catch (error) {
    console.error("Could not list customers:", error);
    res.status(500).json({ message: "Could not get the customers" });
  }
}

// GET /api/customers/:id
export async function readCustomer(req: Request, res: Response) {
  try {
    const customer = await ownCustomer(req, res);
    if (customer) res.json(customer);
  } catch (error) {
    console.error("Could not get customer:", error);
    res.status(500).json({ message: "Could not get the customer" });
  }
}

// PUT /api/customers/:id   body = { name?, phone? }
export async function editCustomer(req: Request, res: Response) {
  try {
    const body = updateCustomerSchema.safeParse(req.body);
    if (!body.success)
      return res.status(400).json({ message: z.prettifyError(body.error) });

    const customer = await ownCustomer(req, res);
    if (!customer) return;
    if (body.data.phone && body.data.phone !== customer.phone) {
      if (await customerByPhone(customer.shopId, body.data.phone))
        return res.status(409).json({ message: PHONE_TAKEN });
    }
    res.json(await updateCustomer(customer.id, body.data));
  } catch (error) {
    console.error("Could not update customer:", error);
    res.status(500).json({ message: "Could not update the customer" });
  }
}

// DELETE /api/customers/:id   their bills stay, they just no longer name a customer
export async function removeCustomer(req: Request, res: Response) {
  try {
    const customer = await ownCustomer(req, res);
    if (!customer) return;
    await deleteCustomer(customer.id);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    console.error("Could not delete customer:", error);
    res.status(500).json({ message: "Could not delete the customer" });
  }
}
