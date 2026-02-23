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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Span } from "next/dist/trace";

export default function DailyChooser({
	refreshToken,
}: {
	refreshToken: number;
}) {
	const [groceries, setGroceries] = useState<
		{ name: string; price: number; numberOfPeople?: number }[]
	>([]);
	const [weeklyList, setWeeklyList] = useState<Record<string, number>>({});
	const [roommates, setRoommates] = useState<string[]>([]);
	const [roommateLists, setRoommateLists] = useState<
		Record<string, { name: string; price: number }[]>
	>({});
	const [saveStatus, setSaveStatus] = useState<
		"idle" | "saving" | "saved" | "error"
	>("idle");
	const savedWeeklyListRef = useRef<Record<string, number>>({});
	const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		let isMounted = true;
		setSaveStatus("idle");
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
			const normalizedWeeklyList = weekly.groceries.reduce<
				Record<string, number>
			>((acc, item) => {
				if (typeof item === "string") {
					acc[item] = (acc[item] ?? 0) + 1;
					return acc;
				}
				if (item?.name) {
					acc[item.name] = Math.max(1, item.count ?? 1);
				}
				return acc;
			}, {});
			savedWeeklyListRef.current = normalizedWeeklyList;
			setWeeklyList(normalizedWeeklyList);
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
	}, [refreshToken]);

	const areCountsEqual = (
		left: Record<string, number>,
		right: Record<string, number>,
	) => {
		const leftKeys = Object.keys(left);
		const rightKeys = Object.keys(right);
		if (leftKeys.length !== rightKeys.length) return false;
		for (const key of leftKeys) {
			if (left[key] !== right[key]) return false;
		}
		return true;
	};

	const isDirty = !areCountsEqual(weeklyList, savedWeeklyListRef.current);

	const updateWeeklyList = (grocery: string, delta: number) => {
		setWeeklyList((prev) => {
			const next = { ...prev };
			const current = next[grocery] ?? 0;
			const updated = Math.max(0, current + delta);
			if (updated === 0) {
				delete next[grocery];
				return next;
			}
			next[grocery] = updated;
			return next;
		});
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
				const count = weeklyList[item.name] ?? 0;
				if (count === 0) return sum;
				const groceryInfo = groceryByName[item.name];
				const price = groceryInfo?.price ?? item.price ?? 0;
				const peopleCount = Math.max(1, groceryInfo?.numberOfPeople ?? 0);
				return sum + (price * count) / peopleCount;
			}, 0);
			acc[name] = total;
			return acc;
		},
		{},
	);

	const grandTotal = Object.values(totalsByRoommate).reduce(
		(sum, total) => sum + total,
		0,
	);

	const handleSave = async () => {
		if (!isDirty || saveStatus === "saving") return;
		setSaveStatus("saving");
		try {
			await saveWeeklyList({
				groceries: Object.entries(weeklyList).map(([name, count]) => ({
					name,
					count,
				})),
			});
			savedWeeklyListRef.current = { ...weeklyList };
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
				<div className="flex flex-col">
					<h2 className="font-bold text-2xl">Weekly List</h2>
					<span className="text-sm text-gray-700">
						Shift+click to decrease count.
					</span>
				</div>

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
							weeklyList[grocery.name] ? "bg-primary text-background" : "",
						)}
						key={grocery.name}
						onClick={(event) => {
							const delta = event.shiftKey ? -1 : 1;
							updateWeeklyList(grocery.name, delta);
						}}
					>
						<span>{grocery.name}</span>
						{(weeklyList[grocery.name] ?? 0) > 0 ? (
							<span className="text-sm opacity-80">
								x{weeklyList[grocery.name]}
							</span>
						) : null}
					</Button>
				))}
			</div>
			<ScrollArea className="flex flex-col gap-1 border-t pt-2 text-lg max-h-[200px]">
				<h3 className="font-semibold">Total due by roommate</h3>
				{roommates.length === 0 ? (
					<span className="text-sm text-gray-700">No roommates yet.</span>
				) : (
					<>
						{roommates.map((name) => (
							<div key={name} className="flex w-full justify-between">
								<span>{name}</span>
								<span className="mr-5">
									${(totalsByRoommate[name] ?? 0).toFixed(2)}
								</span>
							</div>
						))}
						<div className="flex w-full justify-between border-t pt-2 font-semibold">
							<span>Total</span>
							<span className="mr-5">${grandTotal.toFixed(2)}</span>
						</div>
					</>
				)}
			</ScrollArea>
		</div>
	);
}
