"use client"

import * as React from "react"
import axios from "axios"
import { UserPlus, X } from "lucide-react"

import { SearchBox } from "@/components/ui/search-box"
import { createCustomer, type Customer } from "@/lib/customer-api"
import { useShopStore } from "@/store/shop-store"

/**
 * Who the bill is for (optional). Search this shop's customers by name or phone number,
 * or add a new one. The picked customer shows as a small tag with a cross to take it off.
 */
export function CustomerPick({
  value,
  onChange,
}: {
  value: Customer | null
  onChange: (c: Customer | null) => void
}) {
  const shopId = useShopStore((s) => s.shop?.id)
  const [adding, setAdding] = React.useState(false)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [error, setError] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  if (!shopId) return null

  if (value)
    return (
      <p className="flex items-center gap-2 rounded-full border border-foreground/15 py-1 pr-1 pl-3.5 text-sm">
        <span className="min-w-0 flex-1 truncate font-semibold">
          {value.name}{" "}
          <span className="font-normal text-muted-foreground">
            {value.phone}
          </span>
        </span>
        <button
          type="button"
          aria-label="Take the customer off this bill"
          onClick={() => onChange(null)}
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-foreground/10"
        >
          <X className="size-4" />
        </button>
      </p>
    )

  async function add() {
    setSaving(true)
    setError("")
    try {
      onChange(await createCustomer(shopId!, name.trim(), phone.trim()))
      setAdding(false)
      setName("")
      setPhone("")
    } catch (e) {
      setError(
        axios.isAxiosError(e) && e.response?.data?.message
          ? String(e.response.data.message)
          : "Could not add the customer"
      )
    } finally {
      setSaving(false)
    }
  }

  if (adding)
    return (
      <div className="grid gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name"
          aria-label="Customer name"
          className="h-10 rounded-full border border-foreground/15 bg-card px-4 text-sm outline-none focus-visible:border-foreground/50"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="Phone number"
          aria-label="Phone number"
          className="h-10 rounded-full border border-foreground/15 bg-card px-4 text-sm outline-none focus-visible:border-foreground/50"
        />
        {error && <p className="px-2 text-xs text-destructive">{error}</p>}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={saving || !name.trim() || phone.trim().length < 7}
            onClick={add}
            className="h-10 rounded-full bg-foreground text-sm font-semibold text-background disabled:opacity-40"
          >
            {saving ? "Adding…" : "Add customer"}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="h-10 rounded-full border border-foreground/15 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    )

  return (
    <div className="flex items-start gap-1.5">
      <div className="min-w-0 flex-1">
        <SearchBox<Customer>
          url={`/api/customers/shop/${shopId}`}
          minChars={1}
          placeholder="Customer name or phone (optional)"
          clearOnSelect
          getKey={(c) => c.id}
          getLabel={(c) => c.name}
          getHint={(c) => c.phone}
          onSelect={onChange}
        />
      </div>
      <button
        type="button"
        aria-label="Add a new customer"
        onClick={() => setAdding(true)}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-foreground/15 bg-card hover:bg-foreground/6"
      >
        <UserPlus className="size-4.5" />
      </button>
    </div>
  )
}
