"use client";
import { useState } from "react";
import GroceryPicker from "./grocery-picker";
import RoommatePicker from "./roommate-picker";
import TotalPrice from "./total-price";

export default function Main() {
	const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);
	const [roommateSelections, setRoommateSelections] = useState<
		Record<string, { groceries: string[]; prices: number[] }>
	>({});

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
	const selectRoommate = (roommate: string) => {
		setSelectedRoommate(roommate);
	};
	const selectGrocery = (grocery: string, price: number) => {
		if (!selectedRoommate) return;
		setRoommateSelections((prev) => {
			const existing = prev[selectedRoommate] ?? {
				groceries: [],
				prices: [],
			};

			const index = existing.groceries.indexOf(grocery);
			let groceries: string[];
			let prices: number[];

			if (index !== -1) {
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
			/>
			<TotalPrice
				roommate={selectedRoommate}
				roommateGroceries={roommateGroceries}
			/>
		</main>
	);
}
