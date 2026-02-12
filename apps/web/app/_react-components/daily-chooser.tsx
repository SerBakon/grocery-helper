import { useEffect, useRef, useState } from "react";
import {
	getWeeklyList,
	listGroceries,
	saveWeeklyList,
} from "../_rpc-client/rpc-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DailyChooser() {
	const [groceries, setGroceries] = useState<string[]>([]);
	const [weeklyList, setWeeklyList] = useState<Set<string>>(new Set());
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
			setGroceries(items.map((item) => item.name));
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
			<div className="grid h-[80%] grid-cols-2 gap-4 overflow-y-auto">
				{groceries.map((grocery) => (
					<Button
						className={cn(
							"mb-2 flex cursor-pointer items-center justify-between rounded-lg border bg-primary/50 p-3 hover:bg-primary/90",
							weeklyList.has(grocery) ? "bg-primary text-background" : "",
						)}
						key={grocery}
						onClick={() => updateWeeklyList(grocery)}
					>
						{grocery}
					</Button>
				))}
			</div>
			<p>Selected groceries: {Array.from(weeklyList).join(", ")}</p>
		</div>
	);
}
