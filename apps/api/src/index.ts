// server.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { os } from "@orpc/server";
import {
	GroceryItemSchema,
	GroceryListSchema,
	GroceryNameSchema,
	RoommateSchema,
} from "./_schemas/zod-schemas";
import {
	GroceryItem,
	GroceryList,
	Roommate,
} from "./_schemas/mongoose-schemas";

// Define your router
const router = os.router({
	addGroceryList: os.input(GroceryListSchema).handler(async ({ input }) => {
		// Upsert by name so existing lists are mutated instead of duplicated.
		const savedList = await GroceryList.findOneAndUpdate(
			{ name: input.name },
			{ $set: { groceries: input.groceries } },
			{ new: true, upsert: true },
		);
		console.log("Saved grocery list", savedList);
		return savedList;
	}),
	addGrocery: os.input(GroceryItemSchema).handler(async ({ input }) => {
		const savedGrocery = await GroceryItem.create(input);
		console.log("Saved grocery item", savedGrocery);
		return savedGrocery;
	}),
	listGroceries: os.handler(async () => {
		const groceries = await GroceryItem.find({}, { name: 1, price: 1, _id: 0 })
			.sort({ name: 1 })
			.lean();
		return groceries;
	}),
	deleteGrocery: os.input(GroceryNameSchema).handler(async ({ input }) => {
		const result = await GroceryItem.deleteOne({ name: input.name });
		return { deletedCount: result.deletedCount };
	}),
	addRoommate: os.input(RoommateSchema).handler(async ({ input }) => {
		const savedRoommate = await Roommate.create({
			name: input.name,
		});
		console.log("Saved roommate", savedRoommate);
		return savedRoommate;
	}),
	listRoommates: os.handler(async () => {
		const roommates = await Roommate.find({}, { name: 1, _id: 0 })
			.sort({ name: 1 })
			.lean();
		return roommates;
	}),
	deleteRoommate: os.input(RoommateSchema).handler(async ({ input }) => {
		const result = await Roommate.deleteOne({ name: input.name });
		return { deletedCount: result.deletedCount };
	}),
});

export type AppRouter = typeof router;

const handler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const app = new Elysia().use(
	cors({
		origin: "http://localhost:3000",
		methods: ["POST", "GET", "OPTIONS"],
	}),
);

// Test endpoints
app.get("/ping", () => "pong");
app.get("/", () => "Hello Elysia");

// RPC endpoint
app.all(
	"/rpc*",
	async ({ request }: { request: Request }) => {
		const { response } = await handler.handle(request, {
			prefix: "/rpc",
		});
		return response ?? new Response("Not Found", { status: 404 });
	},
	{
		parse: "none", // Disable Elysia body parser to prevent "body already used" error
	},
);

app.listen(process.env.ELYSIA_LISTEN || 3001, () =>
	console.log(`🦊 Elysia is running at http://localhost:3001`),
);
