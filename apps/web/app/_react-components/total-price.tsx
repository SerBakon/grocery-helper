"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

type RoommateGrocery = {
	name: string | null;
	grocery: string;
	price: number;
};

export default function TotalPrice({
	roommate,
	roommateGroceries,
	onSubmit,
}: {
	roommate: string | null;
	roommateGroceries: RoommateGrocery[];
	onSubmit: () => Promise<void>;
}) {
	const [saveStatus, setSaveStatus] = useState<
		"idle" | "saving" | "saved" | "error"
	>("idle");
	const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (statusTimeoutRef.current) {
				clearTimeout(statusTimeoutRef.current);
			}
		};
	}, []);

	const itemsForRoommate = roommateGroceries.filter(
		(item) => item.name === roommate,
	);
	const totalPrice = itemsForRoommate.reduce(
		(sum, item) => sum + item.price,
		0,
	);

	const handleSave = async () => {
		if (saveStatus === "saving") return;
		setSaveStatus("saving");
		try {
			await onSubmit();
			setSaveStatus("saved");
			if (statusTimeoutRef.current) {
				clearTimeout(statusTimeoutRef.current);
			}
			statusTimeoutRef.current = setTimeout(() => {
				setSaveStatus("idle");
			}, 2000);
		} catch (error) {
			console.error("Failed to save roommate groceries", error);
			setSaveStatus("error");
		}
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
			{itemsForRoommate.length > 0 && (
				<div className="flex w-full justify-between border-t pt-2 text-lg font-semibold">
					<span>Total</span>
					<span>${totalPrice.toFixed(2)}</span>
				</div>
			)}
			{itemsForRoommate.length > 0 ? (
				<div className="flex flex-col items-center gap-3">
					<Button
						disabled={saveStatus === "saving"}
						className="cursor-pointer hover:bg-primary/70 w-full"
						onClick={handleSave}
					>
						{saveStatus === "saving" ? "Saving..." : "Save"}
					</Button>
					{saveStatus === "saved" ? (
						<span className="text-sm text-green-700">Saved</span>
					) : null}
					{saveStatus === "error" ? (
						<span className="text-sm text-red-700">Save failed</span>
					) : null}
				</div>
			) : null}
		</div>
	);
}
