import { number, z } from "zod";

export const GroceryListSchema = z.object({
	name: z.string(),
	groceries: z.array(
		z.object({
			name: z.string(),
			price: z.number(),
		}),
	),
});

export const GroceryItemSchema = z.object({
	name: z.string(),
	price: z.number(),
	numberOfItems: z.number().optional(),
	numberOfPeople: z.number(),
});

export type GroceryItemList = z.infer<typeof GroceryListSchema>;
export type GroceryItem = z.infer<typeof GroceryItemSchema>;
