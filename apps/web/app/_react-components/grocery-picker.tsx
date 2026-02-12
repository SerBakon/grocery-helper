"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { useState } from "react";

export default function GroceryPicker({
	selectedGroceries,
	selectGrocery,
}: {
	selectedGroceries: string[] | null;
	selectGrocery: (grocery: string, price: number) => void;
}) {
	const [groceries, setGroceries] = useState<string[]>([
		"Lettuce",
		"Tomatoes",
		"Bread",
	]);
	const [prices, setPrices] = useState<number[]>([1.99, 2.49, 3.5]);
	const [addingGrocery, setAddingGrocery] = useState(false);

	const addingGroceryHandler = () => {
		setAddingGrocery(true);
	};
	const addGrocery = (data: FormData) => {
		const grocery = data.get("groceryName") as string;
		const price = parseFloat(data.get("groceryPrice") as string);
		setAddingGrocery(false);
		setGroceries((prev) => [...prev, grocery]);
		setPrices((prev) => [...prev, price]);
	};
	const deleteGrocery = (index: number) => {
		setGroceries((prev) => prev.filter((_, i) => i !== index));
		setPrices((prev) => prev.filter((_, i) => i !== index));
	};
	return (
		<div className="flex flex-col gap-5 rounded-lg border bg-green-200 p-5">
			<div className="flex justify-between">
				<span className="font-bold text-2xl">Select Your Groceries</span>
				<Button
					onClick={addingGroceryHandler}
					className="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-background hover:bg-gray-500"
				>
					Add Grocery
				</Button>
			</div>
			<div className="w-full border border-accent" />
			<div className="h-150 overflow-auto">
				{addingGrocery && (
					<form
						action={addGrocery}
						className="mt-1 mb-5 ml-1 flex items-center justify-between gap-5"
					>
						<Input
							name="groceryName"
							placeholder="Grocery"
							className="border-primary"
						/>
						<Input
							name="groceryPrice"
							placeholder="Price"
							className="border-primary"
						/>
						<Button
							type="submit"
							className="cursor-pointer bg-primary text-background"
						>
							Add
						</Button>
					</form>
				)}
				{groceries.length > 0 &&
					groceries.map((grocery, index) => (
						<div key={grocery} className="flex items-center justify-between">
							<Button
								onClick={() => selectGrocery(grocery, prices[index] ?? 0)}
								className={cn(
									"mb-2 flex w-[90%] cursor-pointer items-center justify-between rounded-lg border bg-primary/50 p-3 hover:bg-primary/90",
									selectedGroceries?.includes(grocery) &&
										"bg-primary hover:bg-primary/90",
								)}
							>
								<span>{grocery}</span>
								<span>${prices[index]?.toFixed(2) ?? "0"}</span>
							</Button>
							<Trash
								onClick={() => deleteGrocery(index)}
								className="cursor-pointer"
								size={32}
							/>
						</div>
					))}
			</div>
		</div>
	);
}
