import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../../../api/src/index";
import type {
	GroceryItem,
	GroceryItemList,
	Roommate,
	WeeklyList,
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

export async function listGroceries() {
	return client.listGroceries();
}

export async function deleteGrocery(name: GroceryItem["name"]) {
	return client.deleteGrocery({ name });
}

export async function addRoommate(name: Roommate["name"]) {
	return client.addRoommate({ name });
}

export async function listRoommates() {
	return client.listRoommates();
}

export async function deleteRoommate(name: Roommate["name"]) {
	return client.deleteRoommate({ name });
}

export async function getRoommateGroceries(name: Roommate["name"]) {
	return client.getRoommateGroceries({ name });
}

export async function incrementGroceryPeople(name: string) {
	return client.incrementGroceryPeople({ name });
}

export async function decrementGroceryPeople(name: string) {
	return client.decrementGroceryPeople({ name });
}

export async function resetGroceries() {
	return client.resetGroceries();
}

export async function saveWeeklyList(list: WeeklyList) {
	return client.saveWeeklyList(list);
}

export async function getWeeklyList() {
	return client.getWeeklyList();
}

export async function add() {
	return client.add();
}
