
import { generateText, Output } from "ai";
import { requestedOrderSchema } from "../schemas/requested-order.schema.js";
import { aiOptions, getModel } from "./model.js";

export async function extractOrder(userMessage: string) {
  const { output } = await generateText({
    model: getModel(),

    system: `
      Extract the products the shopkeeper wants.

      For each item:
      - Keep the brand, if mentioned.
      - Include product words in query.
      - Do not include quantity or unit in query.
      - Extract quantity and unit separately.
      - Do not invent missing quantities or units.
      - Do not invent products.
    `,

    prompt: userMessage,

    output: Output.object({
      schema: requestedOrderSchema,
    }),

    providerOptions: aiOptions,
  });

  return output;
}
