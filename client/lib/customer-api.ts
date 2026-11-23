import { api } from "@/lib/proxy"

export type Customer = {
  id: string
  shopId: string
  name: string
  phone: string
}

/** POST /api/customers/shop/:shopId: a new customer of this shop. */
export async function createCustomer(
  shopId: string,
  name: string,
  phone: string
) {
  const { data } = await api.post<Customer>(`/api/customers/shop/${shopId}`, {
    name,
    phone,
  })
  return data
}
