// Helpers for pack sizes: "500g", "1kg", "2" (countable, like chocolates).

type Row = {
  name: string;
  brand: string | null;
  quantity: string | null;
  unit: string | null;
  category: string | null;
  barcode: string;
};

// How many grams (weights) or ml (liquids) is this? null if it is not a weight or a liquid.
function toBase(amount: number, unit: string | null) {
  const u = (unit ?? "").toLowerCase();
  if (u === "g") return { kind: "weight", value: amount };
  if (u === "kg") return { kind: "weight", value: amount * 1000 };
  if (u === "mg") return { kind: "weight", value: amount / 1000 };
  if (u === "ml") return { kind: "liquid", value: amount };
  if (u === "l") return { kind: "liquid", value: amount * 1000 };
  return null;
}

// "500g", "5.5kg". With no unit but a number it is a count ("1"). With nothing, null.
export function sizeLabel(row: Pick<Row, "quantity" | "unit">) {
  if (row.quantity === null) return null;
  return `${Number(row.quantity)}${row.unit ?? ""}`;
}

// Keeps the options that make sense for what was asked.
// Asked 2kg: 1kg, 500g and 2kg packs are useful (you can add several). A 25kg pack is not.
export function pickOptions(
  rows: Row[],
  wantedAmount: number,
  wantedUnit: string | null,
  max = 5,
) {
  return pickRows(rows, wantedAmount, wantedUnit, max).map((row) => ({
    name: row.name,
    brand: row.brand,
    size: sizeLabel(row),
    category: row.category,
    barcode: row.barcode,
  }));
}

// The choosing itself: gives back the same rows (with all their own fields), the ones that make sense for the amount asked.
// `keepUnsized` keeps rows with no pack size (a shop's own item) instead of leaving them out.
export function pickRows<R extends Pick<Row, "quantity" | "unit">>(
  rows: R[],
  wantedAmount: number,
  wantedUnit: string | null,
  max = 5,
  keepUnsized = false,
): R[] {
  const wanted = toBase(wantedAmount, wantedUnit);
  const all = rows;
  // Products with no size are left out (unless asked to keep them).
  if (!keepUnsized) rows = rows.filter((row) => sizeLabel(row) !== null);
  let list = rows;

  if (wanted) {
    const sized = rows.map((row) => ({
      row,
      base:
        row.quantity === null ? null : toBase(Number(row.quantity), row.unit),
    }));
    const same = sized.filter((s) => s.base && s.base.kind === wanted.kind);
    const fits = same.filter((s) => s.base!.value <= wanted.value);
    // If every pack is bigger than asked, show the smallest ones instead of nothing.
    const chosen = fits.length
      ? fits
      : [...same].sort((a, b) => a.base!.value - b.base!.value);
    // Packs that divide the amount evenly come first (500g for 2kg), then the bigger packs.
    chosen.sort((a, b) => {
      const evenA = wanted.value % a.base!.value === 0 ? 1 : 0;
      const evenB = wanted.value % b.base!.value === 0 ? 1 : 0;
      return evenB - evenA || b.base!.value - a.base!.value;
    });
    list = chosen.map((s) => s.row);
    if (!list.length && keepUnsized) list = all;
  }

  return list.slice(0, max);
}
