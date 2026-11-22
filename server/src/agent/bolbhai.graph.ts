import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { extractOrder } from "../ai/extract-order.js";
import { searchProducts } from "../services/product.service.js";
import { pickOptions } from "../services/pack-size.js";



const RequestState = Annotation.Root({
  userMessage: Annotation<string>(),
  requestedItems: Annotation<
    Awaited<ReturnType<typeof extractOrder>> | null
  >(),
  searchResults: Annotation<
  Awaited<ReturnType<typeof searchProducts>>
>(),
  // the final answer: each requested item with the packs that make sense for the amount asked
  orderItems: Annotation<
    { query: string; quantity: number | null; unit: string | null; options: ReturnType<typeof pickOptions> }[]
  >(),
});


const extractOrderNode = async (
  state: typeof RequestState.State
) => {
  const requestedItems = await extractOrder(state.userMessage);

  return { requestedItems };
};


async function searchCatalog(state: typeof RequestState.State) {

  if(!state.requestedItems) throw new Error("Requested Items are Missing")

    const queries = state.requestedItems?.items.map((item)=> item.query)
    const results = await searchProducts(queries,12)

    return {
      searchResults : results
    }

}

function pickPacks(state: typeof RequestState.State) {
  const items = state.requestedItems?.items ?? []
  const orderItems = items.map((item, i) => ({
    query: item.query,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    options: pickOptions(state.searchResults[i] ?? [], item.quantity ?? 0, item.unit ?? null),
  }))
  return { orderItems }
}

const graph = new StateGraph(RequestState)
  .addNode("extractOrder", extractOrderNode)
  .addNode("searchCatalog",searchCatalog)
  .addNode("pickPacks", pickPacks)
  .addEdge('extractOrder','searchCatalog')
  .addEdge("searchCatalog", "pickPacks")
  .addEdge(START, "extractOrder")
  .addEdge("pickPacks", END)
  .compile();

export type OrderItem = { query: string; quantity: number | null; unit: string | null; options: ReturnType<typeof pickOptions> }

// "I need 2kg basmati rice and 5kg atta"  ->  each item with the packs that make sense for the amount asked.
export async function runOrder(userMessage: string): Promise<OrderItem[]> {
  const result = await graph.invoke({ userMessage, requestedItems: null })
  return result.orderItems
}
