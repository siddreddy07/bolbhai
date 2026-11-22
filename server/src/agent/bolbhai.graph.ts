import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { extractOrder } from "../ai/extract-order.js";
import { searchInventories } from "../services/inventory.service.js";
import { pickRows } from "../services/pack-size.js";

// One thing the shopkeeper asked for: how much, and the shelf items that fit (ids only: the page has the rest in its own copy of the inventory).
export type OrderItem = {
  query: string;
  quantity: number | null;
  unit: string | null;
  /** shop_inventory ids, best match first, and the catalog product each one is */
  options: { id: string; productId: string | null }[];
};

const RequestState = Annotation.Root({
  userMessage: Annotation<string>(),
  // whose shelf is searched
  shopId: Annotation<string>(),
  requestedItems: Annotation<Awaited<ReturnType<typeof extractOrder>> | null>(),
  searchResults: Annotation<Awaited<ReturnType<typeof searchInventories>>>(),
  // the final answer: each requested item with the packs that make sense for the amount asked
  orderItems: Annotation<OrderItem[]>(),
});

const extractOrderNode = async (state: typeof RequestState.State) => {
  const requestedItems = await extractOrder(state.userMessage);

  return { requestedItems };
};

async function searchShelf(state: typeof RequestState.State) {
  if (!state.requestedItems) throw new Error("Requested Items are Missing");

  const queries = state.requestedItems?.items.map((item) => item.query);
  // the shop's own inventory, not the whole catalog: only what it really sells can be ordered
  const results = await searchInventories(state.shopId, queries, 12);

  return {
    searchResults: results,
  };
}

function pickPacks(state: typeof RequestState.State) {
  const items = state.requestedItems?.items ?? [];
  const orderItems = items.map((item, i) => ({
    query: item.query,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    options: pickRows(
      state.searchResults[i] ?? [],
      item.quantity ?? 0,
      item.unit ?? null,
      5,
      true,
    ).map((r) => ({
      id: r.id,
      productId: r.productId,
    })),
  }));
  return { orderItems };
}

const graph = new StateGraph(RequestState)
  .addNode("extractOrder", extractOrderNode)
  .addNode("searchShelf", searchShelf)
  .addNode("pickPacks", pickPacks)
  .addEdge("extractOrder", "searchShelf")
  .addEdge("searchShelf", "pickPacks")
  .addEdge(START, "extractOrder")
  .addEdge("pickPacks", END)
  .compile();

// "I need 2kg basmati rice and 5kg atta"  ->  each item with the packs that make sense for the amount asked.
export async function runOrder(
  shopId: string,
  userMessage: string,
): Promise<OrderItem[]> {
  const result = await graph.invoke({
    shopId,
    userMessage,
    requestedItems: null,
  });
  return result.orderItems;
}
