// server.ts
import { Elysia } from "elysia";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { os } from "@orpc/server";
import { GroceryItemSchema } from "./_schemas/zod-schemas";
import { GroceryList } from "./_schemas/mongoose-schemas";

// Define your router
const router = os.router({
	addGroceryList: os.input(GroceryItemSchema).handler(async (input) => {
		// Save to MongoDB
		const savedList = await GroceryList.create(input);
		return savedList;
	}),
});

const handler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const app = new Elysia();

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
