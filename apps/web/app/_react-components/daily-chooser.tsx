import { useEffect, useState } from "react";
import { listGroceries } from "../_rpc-client/rpc-client";
import { Button } from "@/components/ui/button";

export default function DailyChooser() {
	const [groceries, setGroceries] = useState<string[]>([]);

	useEffect(() => {
		let isMounted = true;
		const loadGroceries = async () => {
			const items = await listGroceries();
			if (!isMounted) return;
			setGroceries(items.map((item) => item.name));
		};
		loadGroceries().catch((error) => {
			console.error("Failed to load groceries", error);
		});
		return () => {
			isMounted = false;
		};
	}, []);
	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-purple-300 p-5">
			<h2 className="font-bold text-2xl">Weekly List</h2>
			<div className="w-full border" />
			<div className="grid h-[80%] grid-cols-2 gap-4 overflow-y-auto">
				{groceries.map((grocery) => (
					<Button
						className="mb-2 flex cursor-pointer items-center justify-between rounded-lg border bg-primary/50 p-3 hover:bg-primary/90"
						key={grocery}
					>
						{grocery}
					</Button>
				))}
			</div>
		</div>
	);
}
