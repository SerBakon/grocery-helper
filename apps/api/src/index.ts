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
	WeeklyListSchema,
} from "./_schemas/zod-schemas";
import {
	GroceryItem,
	GroceryList,
	Roommate,
	WeeklyList,
} from "./_schemas/mongoose-schemas";

const seedTestData = async () => {
	const roommateName = "Test";
	const groceries = [
		{ name: "Milk", price: 3.5, numberOfPeople: 0 },
		{ name: "Bread", price: 2.25, numberOfPeople: 0 },
		{ name: "Eggs", price: 4.1, numberOfPeople: 0 },
		{ name: "Cheese", price: 5.75, numberOfPeople: 0 },
		{ name: "Apples", price: 3.2, numberOfPeople: 0 },
		{ name: "Rice", price: 6.4, numberOfPeople: 0 },
		{ name: "Bananas", price: 1.9, numberOfPeople: 0 },
		{ name: "Chicken", price: 7.8, numberOfPeople: 0 },
		{ name: "Pasta", price: 2.6, numberOfPeople: 0 },
		{ name: "Tomatoes", price: 3.15, numberOfPeople: 0 },
		{ name: "Coffee", price: 8.5, numberOfPeople: 0 },
	].map((item) => ({
		...item,
		price: Math.round(item.price),
	}));

	const savedRoommate = await Roommate.findOneAndUpdate(
		{ name: roommateName },
		{ $set: { name: roommateName } },
		{ new: true, upsert: true },
	);

	await GroceryItem.deleteMany({
		name: { $in: groceries.map((item) => item.name) },
	});
	const savedGroceries = await GroceryItem.insertMany(groceries);

	return {
		roommate: savedRoommate,
		groceries: savedGroceries,
	};
};

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
		const groceries = await GroceryItem.find(
			{},
			{ name: 1, price: 1, numberOfPeople: 1, _id: 0 },
		)
			.sort({ name: 1 })
			.lean();
		return groceries;
	}),
	deleteGrocery: os.input(GroceryNameSchema).handler(async ({ input }) => {
		const result = await GroceryItem.deleteOne({ name: input.name });
		await WeeklyList.updateOne(
			{ name: "weeklylist" },
			{ $pull: { groceries: input.name } },
		);
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
		const listResult = await GroceryList.deleteOne({ name: input.name });
		return {
			deletedCount: result.deletedCount,
			groceryListDeletedCount: listResult.deletedCount,
		};
	}),
	getRoommateGroceries: os.input(RoommateSchema).handler(async ({ input }) => {
		const list = await GroceryList.findOne(
			{ name: input.name },
			{ groceries: 1, _id: 0 },
		).lean();
		return list?.groceries ?? [];
	}),
	incrementGroceryPeople: os
		.input(GroceryNameSchema)
		.handler(async ({ input }) => {
			const result = await GroceryItem.findOneAndUpdate(
				{ name: input.name },
				{ $inc: { numberOfPeople: 1 } },
				{ new: true },
			);
			return result;
		}),
	decrementGroceryPeople: os
		.input(GroceryNameSchema)
		.handler(async ({ input }) => {
			const result = await GroceryItem.findOneAndUpdate(
				{ name: input.name },
				{ $inc: { numberOfPeople: -1 } },
				{ new: true },
			);
			return result;
		}),
	resetGroceries: os.handler(async () => {
		await GroceryList.deleteMany({});
		const result = await GroceryItem.updateMany(
			{},
			{ $set: { numberOfPeople: 0 } },
		);
		return { updatedCount: result.modifiedCount };
	}),
	saveWeeklyList: os.input(WeeklyListSchema).handler(async ({ input }) => {
		const savedList = await WeeklyList.findOneAndUpdate(
			{ name: "weeklylist" },
			{ $set: { name: "weeklylist", groceries: input.groceries } },
			{ new: true, upsert: true },
		);
		return savedList;
	}),
	getWeeklyList: os.handler(async () => {
		const list = await WeeklyList.findOne(
			{ name: "weeklylist" },
			{ groceries: 1, _id: 0 },
		).lean();
		return { groceries: list?.groceries ?? [] };
	}),
	add: os.handler(async () => {
		return seedTestData();
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
app.get("/rpc/add", async () => seedTestData());

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
