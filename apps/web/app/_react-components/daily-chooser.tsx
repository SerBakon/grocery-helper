import { useEffect, useRef, useState } from "react";
import {
	getWeeklyList,
	listGroceries,
	listRoommates,
	saveWeeklyList,
	getRoommateGroceries,
} from "../_rpc-client/rpc-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DailyChooser() {
	const [groceries, setGroceries] = useState<
		{ name: string; price: number; numberOfPeople?: number }[]
	>([]);
	const [weeklyList, setWeeklyList] = useState<Set<string>>(new Set());
	const [roommates, setRoommates] = useState<string[]>([]);
	const [roommateLists, setRoommateLists] = useState<
		Record<string, { name: string; price: number }[]>
	>({});
	const [saveStatus, setSaveStatus] = useState<
		"idle" | "saving" | "saved" | "error"
	>("idle");
	const savedWeeklyListRef = useRef<Set<string>>(new Set());
	const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			const [items, weekly] = await Promise.all([
				listGroceries(),
				getWeeklyList(),
			]);
			if (!isMounted) return;
			setGroceries(items);
			const roommateItems = await listRoommates();
			if (!isMounted) return;
			const roommateNames = roommateItems.map((item) => item.name);
			setRoommates(roommateNames);
			const roommateListsResult = await Promise.all(
				roommateNames.map(async (name) => {
					const list = await getRoommateGroceries(name);
					return [name, list] as const;
				}),
			);
			if (!isMounted) return;
			setRoommateLists(
				roommateListsResult.reduce(
					(acc, [name, list]) => {
						acc[name] = list;
						return acc;
					},
					{} as Record<string, { name: string; price: number }[]>,
				),
			);
			const nextList = new Set(weekly.groceries);
			savedWeeklyListRef.current = nextList;
			setWeeklyList(nextList);
		};
		loadData().catch((error) => {
			console.error("Failed to load daily chooser data", error);
		});
		return () => {
			if (statusTimeoutRef.current) {
				clearTimeout(statusTimeoutRef.current);
			}
			isMounted = false;
		};
	}, []);

	const areSetsEqual = (left: Set<string>, right: Set<string>) => {
		if (left.size !== right.size) return false;
		for (const value of left) {
			if (!right.has(value)) return false;
		}
		return true;
	};

	const isDirty = !areSetsEqual(weeklyList, savedWeeklyListRef.current);

	const updateWeeklyList = (grocery: string) => {
		if (weeklyList.has(grocery)) {
			setWeeklyList((prev) => {
				const next = new Set(prev);
				next.delete(grocery);
				return next;
			});
		} else {
			setWeeklyList((prev) => {
				const next = new Set(prev);
				next.add(grocery);
				return next;
			});
		}
	};

	const groceryByName = groceries.reduce<
		Record<string, { price: number; numberOfPeople?: number }>
	>((acc, item) => {
		acc[item.name] = {
			price: item.price,
			numberOfPeople: item.numberOfPeople,
		};
		return acc;
	}, {});

	const totalsByRoommate = roommates.reduce<Record<string, number>>(
		(acc, name) => {
			const list = roommateLists[name] ?? [];
			const total = list.reduce((sum, item) => {
				if (!weeklyList.has(item.name)) return sum;
				const groceryInfo = groceryByName[item.name];
				const price = groceryInfo?.price ?? item.price ?? 0;
				const peopleCount = Math.max(1, groceryInfo?.numberOfPeople ?? 0);
				return sum + price / peopleCount;
			}, 0);
			acc[name] = total;
			return acc;
		},
		{},
	);

	const handleSave = async () => {
		if (!isDirty || saveStatus === "saving") return;
		setSaveStatus("saving");
		try {
			await saveWeeklyList({ groceries: Array.from(weeklyList) });
			savedWeeklyListRef.current = new Set(weeklyList);
			setSaveStatus("saved");
			if (statusTimeoutRef.current) {
				clearTimeout(statusTimeoutRef.current);
			}
			statusTimeoutRef.current = setTimeout(() => {
				setSaveStatus("idle");
			}, 2000);
		} catch (error) {
			console.error("Failed to save weekly list", error);
			setSaveStatus("error");
		}
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-purple-300 p-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-bold text-2xl">Weekly List</h2>
				<div className="flex items-center gap-3">
					{saveStatus === "saved" ? (
						<span className="text-sm text-green-700">Saved</span>
					) : null}
					{saveStatus === "error" ? (
						<span className="text-sm text-red-700">Save failed</span>
					) : null}
					<Button
						disabled={!isDirty || saveStatus === "saving"}
						className="cursor-pointer"
						onClick={handleSave}
					>
						{saveStatus === "saving" ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
			<div className="w-full border" />
			<div className="grid max-h-[400px] grid-cols-2 gap-4 overflow-y-auto">
				{groceries.map((grocery) => (
					<Button
						className={cn(
							"mb-2 flex cursor-pointer items-center justify-between rounded-lg border bg-primary/50 p-3 hover:bg-primary/90",
							weeklyList.has(grocery.name) ? "bg-primary text-background" : "",
						)}
						key={grocery.name}
						onClick={() => updateWeeklyList(grocery.name)}
					>
						{grocery.name}
					</Button>
				))}
			</div>
			<div className="flex flex-col gap-1 border-t pt-2 text-lg max-h-[200px] overflow-auto">
				<h3 className="font-semibold">Total due by roommate</h3>
				{roommates.length === 0 ? (
					<span className="text-sm text-gray-700">No roommates yet.</span>
				) : (
					roommates.map((name) => (
						<div key={name} className="flex w-full justify-between">
							<span>{name}</span>
							<span>${(totalsByRoommate[name] ?? 0).toFixed(2)}</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
