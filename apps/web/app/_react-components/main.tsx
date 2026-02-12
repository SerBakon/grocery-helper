"use client";
import { useEffect, useState } from "react";
import GroceryPicker from "./grocery-picker";
import RoommatePicker from "./roommate-picker";
import TotalPrice from "./total-price";
import {
	addGroceryList,
	decrementGroceryPeople,
	getRoommateGroceries,
	incrementGroceryPeople,
	listGroceries,
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
	const [groceryInfoByName, setGroceryInfoByName] = useState<
		Record<string, { price: number; numberOfPeople?: number }>
	>({});

	const currentSelection =
		selectedRoommate && roommateSelections[selectedRoommate]
			? roommateSelections[selectedRoommate]
			: { groceries: [], prices: [] };
	const committedSelection =
		selectedRoommate && committedSelections[selectedRoommate]
			? committedSelections[selectedRoommate]
			: { groceries: [], prices: [] };

	useEffect(() => {
		let isMounted = true;
		const loadGroceries = async () => {
			const groceries = await listGroceries();
			if (!isMounted) return;
			const nextInfo = groceries.reduce<
				Record<string, { price: number; numberOfPeople?: number }>
			>((acc, grocery) => {
				acc[grocery.name] = {
					price: grocery.price,
					numberOfPeople: grocery.numberOfPeople,
				};
				return acc;
			}, {});
			setGroceryInfoByName(nextInfo);
		};
		loadGroceries().catch((error) => {
			console.error("Failed to load groceries", error);
		});
		return () => {
			isMounted = false;
		};
	}, [groceryRefreshToken]);

	const draftSet = new Set(currentSelection.groceries);
	const committedSet = new Set(committedSelection.groceries);

	const roommateGroceries = selectedRoommate
		? currentSelection.groceries.reduce<
				{ name: string; grocery: string; price: number }[]
			>((acc, grocery, index) => {
				const fallbackPrice = currentSelection.prices[index];
				if (fallbackPrice === undefined) return acc;
				const groceryInfo = groceryInfoByName[grocery];
				const basePrice = groceryInfo?.price ?? fallbackPrice;
				const peopleCount = Math.max(
					1,
					(groceryInfo?.numberOfPeople ?? 0) +
						(draftSet.has(grocery) ? 1 : 0) -
						(committedSet.has(grocery) ? 1 : 0),
				);
				const perPersonPrice = basePrice / peopleCount;
				acc.push({ name: selectedRoommate, grocery, price: perPersonPrice });
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

	const resetSelections = () => {
		setRoommateSelections({});
		setCommittedSelections({});
		setSelectedRoommate(null);
		setGroceryRefreshToken((prev) => prev + 1);
	};
	return (
		<main className="m-10 grid grid-cols-3 gap-5 rounded-lg border-5 border-secondary p-10">
			<RoommatePicker
				selectedRoommate={selectedRoommate}
				selectRoommate={(roommate) => selectRoommate(roommate)}
			/>
			<GroceryPicker
				selectedGroceries={currentSelection.groceries}
				committedGroceries={committedSelection.groceries}
				selectGrocery={(grocery: string, price: number) =>
					selectGrocery(grocery, price)
				}
				refreshToken={groceryRefreshToken}
				onReset={resetSelections}
			/>
			<TotalPrice
				roommate={selectedRoommate}
				roommateGroceries={roommateGroceries}
				onSubmit={submitRoommateGroceries}
			/>
		</main>
	);
}
