import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../../../api/src/index";
import type {
	GroceryItem,
	GroceryItemList,
} from "../../../api/src/_schemas/zod-schemas";

const link = new RPCLink({
	url: "http://localhost:3001/rpc",
	headers: { Authorization: "Bearer token" },
});

export const client = createORPCClient<RouterClient<AppRouter>>(link);

export async function addGroceryList(groceryList: GroceryItemList) {
	return client.addGroceryList(groceryList);
}

export async function addGrocery(groceryItem: GroceryItem) {
	return client.addGrocery(groceryItem);
}
