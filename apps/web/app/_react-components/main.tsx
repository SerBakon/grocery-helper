"use client";
import { useState } from "react";
import GroceryPicker from "./grocery-picker";
import RoommatePicker from "./roommate-picker";
import TotalPrice from "./total-price";
import {
	addGroceryList,
	decrementGroceryPeople,
	getRoommateGroceries,
	incrementGroceryPeople,
} from "../_rpc-client/rpc-client";

export default function Main() {
	const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);
	const [roommateSelections, setRoommateSelections] = useState<
		Record<string, { groceries: string[]; prices: number[] }>
	>({});
	const [committedSelections, setCommittedSelections] = useState<
		Record<string, { groceries: string[]; prices: number[] }>
	>({});
	const [groceryRefreshToken, setGroceryRefreshToken] = useState(0);

	const currentSelection =
		selectedRoommate && roommateSelections[selectedRoommate]
			? roommateSelections[selectedRoommate]
			: { groceries: [], prices: [] };

	const roommateGroceries = selectedRoommate
		? currentSelection.groceries.reduce<
				{ name: string; grocery: string; price: number }[]
			>((acc, grocery, index) => {
				const price = currentSelection.prices[index];
				if (price === undefined) return acc;
				acc.push({ name: selectedRoommate, grocery, price });
				return acc;
			}, [])
		: [];
	const selectRoommate = async (roommate: string) => {
		setSelectedRoommate(roommate);
		try {
			const groceryList = await getRoommateGroceries(roommate);
			const nextSelection = {
				groceries: groceryList.map((item) => item.name),
				prices: groceryList.map((item) => item.price),
			};
			setRoommateSelections((prev) => ({
				...prev,
				[roommate]: nextSelection,
			}));
			setCommittedSelections((prev) => ({
				...prev,
				[roommate]: nextSelection,
			}));
			setGroceryRefreshToken((prev) => prev + 1);
		} catch (error) {
			console.error("Failed to load roommate grocery list", error);
		}
	};
	const selectGrocery = async (grocery: string, price: number) => {
		if (!selectedRoommate) return;
		const existing = roommateSelections[selectedRoommate] ?? {
			groceries: [],
			prices: [],
		};

		const index = existing.groceries.indexOf(grocery);
		const isRemoving = index !== -1;

		setRoommateSelections((prev) => {
			let groceries: string[];
			let prices: number[];

			if (isRemoving) {
				groceries = existing.groceries.filter((_, i) => i !== index);
				prices = existing.prices.filter((_, i) => i !== index);
			} else {
				groceries = [...existing.groceries, grocery];
				prices = [...existing.prices, price];
			}

			return {
				...prev,
				[selectedRoommate]: { groceries, prices },
			};
		});
	};
	const submitRoommateGroceries = async () => {
		if (!selectedRoommate) return;
		const draft = roommateSelections[selectedRoommate];
		if (!draft || draft.groceries.length === 0) return;
		const committed = committedSelections[selectedRoommate] ?? {
			groceries: [],
			prices: [],
		};

		const committedSet = new Set(committed.groceries);
		const draftSet = new Set(draft.groceries);
		const toAdd = draft.groceries.filter((name) => !committedSet.has(name));
		const toRemove = committed.groceries.filter((name) => !draftSet.has(name));

		try {
			await addGroceryList({
				name: selectedRoommate,
				groceries: draft.groceries.map((grocery, index) => ({
					name: grocery,
					price: draft.prices[index] ?? 0,
				})),
			});

			await Promise.all([
				...toAdd.map((name) => incrementGroceryPeople(name)),
				...toRemove.map((name) => decrementGroceryPeople(name)),
			]);

			setCommittedSelections((prev) => ({
				...prev,
				[selectedRoommate]: draft,
			}));
			setGroceryRefreshToken((prev) => prev + 1);
		} catch (error) {
			console.error("Failed to submit grocery list", error);
		}
	};
	return (
		<main className="m-10 grid grid-cols-3 gap-5 rounded-lg border-5 border-secondary p-10">
			<RoommatePicker
				selectedRoommate={selectedRoommate}
				selectRoommate={(roommate) => selectRoommate(roommate)}
			/>
			<GroceryPicker
				selectedGroceries={currentSelection.groceries}
				selectGrocery={(grocery: string, price: number) =>
					selectGrocery(grocery, price)
				}
				refreshToken={groceryRefreshToken}
			/>
			<TotalPrice
				roommate={selectedRoommate}
				roommateGroceries={roommateGroceries}
				onSubmit={submitRoommateGroceries}
			/>
		</main>
	);
}
