"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	addGrocery,
	deleteGrocery as deleteGroceryRPC,
	listGroceries,
} from "../_rpc-client/rpc-client";

export default function GroceryPicker({
	selectedGroceries,
	selectGrocery,
}: {
	selectedGroceries: string[] | null;
	selectGrocery: (grocery: string, price: number) => void;
}) {
	const [groceries, setGroceries] = useState<string[]>([]);
	const [prices, setPrices] = useState<number[]>([]);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const priceInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let isMounted = true;
		const loadGroceries = async () => {
			const items = await listGroceries();
			if (!isMounted) return;
			setGroceries(items.map((item) => item.name));
			setPrices(items.map((item) => item.price));
		};
		loadGroceries().catch((error) => {
			console.error("Failed to load groceries", error);
		});
		return () => {
			isMounted = false;
		};
	}, []);
	const addGroceryHandler = async (data: FormData) => {
		const grocery = data.get("groceryName") as string;
		const price = parseFloat(data.get("groceryPrice") as string);
		await addGrocery({
			name: grocery,
			price,
			numberOfPeople: 1,
		});
		setGroceries((prev) => [...prev, grocery]);
		setPrices((prev) => [...prev, price]);
		setTimeout(() => nameInputRef.current?.focus(), 0);
	};
	const deleteGrocery = async (index: number) => {
		const grocery = groceries[index];
		if (!grocery) return;
		await deleteGroceryRPC(grocery);
		setGroceries((prev) => prev.filter((_, i) => i !== index));
		setPrices((prev) => prev.filter((_, i) => i !== index));
	};
	return (
		<div className="flex flex-col gap-5 rounded-lg border bg-green-200 p-5">
			<div className="flex justify-between">
				<span className="font-bold text-2xl">Select Your Groceries</span>
			</div>
			<div className="w-full border border-accent" />
			<div className="h-150 overflow-auto">
				<form
					action={addGroceryHandler}
					className="mt-1 mb-5 ml-1 flex items-center justify-between gap-5"
				>
					<Input
						ref={nameInputRef}
						name="groceryName"
						placeholder="Grocery"
						className="border-primary"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								const nameValue = e.currentTarget.value.trim();
								if (nameValue) {
									priceInputRef.current?.focus();
								}
							}
						}}
					/>
					<Input
						ref={priceInputRef}
						name="groceryPrice"
						placeholder="Price"
						className="border-primary"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								const nameValue = nameInputRef.current?.value.trim();
								const priceValue = e.currentTarget.value.trim();
								if (!nameValue) {
									nameInputRef.current?.focus();
								} else if (nameValue && priceValue) {
									e.currentTarget.form?.requestSubmit();
								}
							}
						}}
					/>
					<Button
						type="submit"
						className="cursor-pointer bg-primary text-background"
					>
						Add
					</Button>
				</form>
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
