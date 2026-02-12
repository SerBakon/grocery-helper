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
	resetGroceries,
} from "../_rpc-client/rpc-client";

export default function GroceryPicker({
	selectedGroceries,
	committedGroceries,
	selectGrocery,
	refreshToken,
	onReset,
	onGroceryAdded,
}: {
	selectedGroceries: string[] | null;
	committedGroceries: string[];
	selectGrocery: (grocery: string, price: number) => void;
	refreshToken: number;
	onReset: () => void;
	onGroceryAdded: () => void;
}) {
	const [items, setItems] = useState<
		{ name: string; price: number; numberOfPeople?: number }[]
	>([]);
	const selectedSet = new Set(selectedGroceries ?? []);
	const committedSet = new Set(committedGroceries);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const priceInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let isMounted = true;
		const loadGroceries = async () => {
			const items = await listGroceries();
			if (!isMounted) return;
			setItems(items);
		};
		loadGroceries().catch((error) => {
			console.error("Failed to load groceries", error);
		});
		return () => {
			isMounted = false;
		};
	}, [refreshToken]);
	const addGroceryHandler = async (data: FormData) => {
		const grocery = data.get("groceryName") as string;
		const price = parseFloat(data.get("groceryPrice") as string);
		await addGrocery({
			name: grocery,
			price,
		});
		setItems((prev) => [...prev, { name: grocery, price, numberOfPeople: 0 }]);
		onGroceryAdded();
		setTimeout(() => nameInputRef.current?.focus(), 0);
	};
	const deleteGrocery = async (index: number) => {
		const grocery = items[index];
		if (!grocery) return;
		await deleteGroceryRPC(grocery.name);
		setItems((prev) => prev.filter((_, i) => i !== index));
	};
	const resetGroceriesHandler = async () => {
		await resetGroceries();
		const refreshedItems = await listGroceries();
		setItems(refreshedItems);
		onReset();
	};
	return (
		<div className="flex flex-col gap-5 rounded-lg border bg-green-200 p-5">
			<div className="flex justify-between">
				<span className="font-bold text-2xl">Select Your Groceries</span>
				<Button
					onClick={resetGroceriesHandler}
					className="cursor-pointer bg-red-500 text-background hover:bg-red-600"
				>
					Reset Everyone
				</Button>
			</div>
			<div className="w-full border border-accent" />
			<div className="h-150 overflow-auto">
				<form
					action={addGroceryHandler}
					onSubmit={(event) => {
						const nameValue = nameInputRef.current?.value.trim() ?? "";
						const priceValue = priceInputRef.current?.value.trim() ?? "";
						if (!nameValue) {
							event.preventDefault();
							nameInputRef.current?.focus();
							return;
						}
						if (!priceValue) {
							event.preventDefault();
							priceInputRef.current?.focus();
						}
					}}
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
				{items.length > 0 &&
					items.map((item, index) => (
						<div key={item.name} className="flex items-center justify-between">
							<Button
								onClick={() => selectGrocery(item.name, item.price ?? 0)}
								className={cn(
									"mb-2 flex w-[90%] cursor-pointer items-center justify-between rounded-lg border bg-primary/50 p-3 hover:bg-primary/90",
									selectedGroceries?.includes(item.name) &&
										"bg-primary hover:bg-primary/90",
								)}
							>
								<span>
									{item.name} /{" "}
									{Math.max(
										0,
										(item.numberOfPeople ?? 0) +
											(selectedSet.has(item.name) ? 1 : 0) -
											(committedSet.has(item.name) ? 1 : 0),
									)}
								</span>
								<span>${item.price?.toFixed(2) ?? "0"}</span>
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
