"use client";
import { useState } from "react";
import GroceryPicker from "./grocery-picker";
import RoommatePicker from "./roommate-picker";
import TotalPrice from "./total-price";

export default function Main() {
	const [selectedRoommate, setSelectedRoommate] = useState<string | null>(
		"Alex",
	);
	const [selectedGroceries, setSelectedGroceries] = useState<string[] | null>(
		null,
	);
	const [selectedPrices, setSelectedPrices] = useState<number[] | null>(null);
	const selectRoommate = (roommate: string) => {
		setSelectedRoommate(roommate);
	};
	const selectGrocery = (grocery: string, price: number) => {
		setSelectedGroceries((prev) => {
			if (prev?.includes(grocery)) {
				return prev.filter((g) => g !== grocery);
			} else {
				return prev ? [...prev, grocery] : [grocery];
			}
		});
		setSelectedPrices((prev) => {
			if (prev?.includes(price)) {
				return prev.filter((p) => p !== price);
			} else {
				return prev ? [...prev, price] : [price];
			}
		});
	};
	return (
		<main className="m-10 grid grid-cols-3 gap-5 rounded-lg border-5 border-secondary p-10">
			<RoommatePicker
				selectedRoommate={selectedRoommate}
				selectRoommate={(roommate) => selectRoommate(roommate)}
			/>
			<GroceryPicker
				selectedGroceries={selectedGroceries}
				selectGrocery={(grocery: string, price: number) =>
					selectGrocery(grocery, price)
				}
			/>
			<TotalPrice roommate={selectedRoommate} />
		</main>
	);
}
