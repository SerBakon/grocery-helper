"use client";
import { Button } from "@/components/ui/button";
import type { GroceryItemList } from "../../../api/src/_schemas/zod-schemas";
import { addGroceryList } from "../_rpc-client/rpc-client";

type RoommateGrocery = {
	name: string | null;
	grocery: string;
	price: number;
};

export default function TotalPrice({
	roommate,
	roommateGroceries,
}: {
	roommate: string | null;
	roommateGroceries: RoommateGrocery[];
}) {
	const itemsForRoommate = roommateGroceries.filter(
		(item) => item.name === roommate,
	);

	const handleSubmit = async () => {
		if (!roommate || itemsForRoommate.length === 0) return;
		const payload: GroceryItemList = {
			name: roommate,
			groceries: itemsForRoommate.map((item) => ({
				name: item.grocery,
				price: item.price,
			})),
		};
		await addGroceryList(payload);
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-red-300 p-5">
			<h2 className="font-bold text-2xl">Total Price for {roommate}:</h2>
			<div className="w-full border" />
			<div className="flex flex-col gap-1">
				{itemsForRoommate.map((item, index) => (
					<div
						key={`${item.grocery}-${index}`}
						className="flex w-full justify-between text-lg"
					>
						<span>{item.grocery}</span>
						<span>${item.price.toFixed(2)}</span>
					</div>
				))}
				{itemsForRoommate.length === 0 && (
					<span className="text-gray-700 text-sm">
						No groceries selected for this roommate yet.
					</span>
				)}
			</div>
			{itemsForRoommate.length > 0 ? (
				<Button
					className="cursor-pointer hover:bg-primary/70"
					onClick={handleSubmit}
				>
					Submit
				</Button>
			) : null}
		</div>
	);
}
