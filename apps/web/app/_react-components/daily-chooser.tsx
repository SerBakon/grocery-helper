import { useEffect, useState } from "react";
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

	useEffect(() => {
		let isMounted = true;
		const loadData = async () => {
			const [items, weekly] = await Promise.all([
				listGroceries(),
				getWeeklyList(),
			]);
			if (!isMounted) return;
			setGroceries(items.map((item) => item.name));
			setWeeklyList(new Set(weekly.groceries));
		};
		loadData().catch((error) => {
			console.error("Failed to load daily chooser data", error);
		});
		return () => {
			isMounted = false;
		};
	}, []);

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
		await saveWeeklyList({ groceries: Array.from(weeklyList) });
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-purple-300 p-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-bold text-2xl">Weekly List</h2>
				<Button onClick={handleSave}>Save</Button>
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
