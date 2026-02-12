const { z } = require("zod");

export const GroceryItemSchema = z.object({
	name: z.string(),
	groceries: z.array(
		z.object({
			name: z.string(),
			price: z.number(),
		}),
	),
});
