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
	numberOfPeople: z.number().optional(),
});

export const GroceryNameSchema = z.object({
	name: z.string(),
});

export const RoommateSchema = z.object({
	name: z.string(),
});

const WeeklyListItemSchema = z.object({
	name: z.string(),
	count: z.number().int().min(1),
});

export const WeeklyListSchema = z.object({
	groceries: z.union([z.array(z.string()), z.array(WeeklyListItemSchema)]),
});

export type GroceryItemList = z.infer<typeof GroceryListSchema>;
export type GroceryItem = z.infer<typeof GroceryItemSchema>;
export type Roommate = z.infer<typeof RoommateSchema>;
export type WeeklyList = z.infer<typeof WeeklyListSchema>;
