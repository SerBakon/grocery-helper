"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";
import { useState } from "react";

export default function RoommatePicker({
	selectedRoommate,
	selectRoommate,
}: {
	selectedRoommate: string | null;
	selectRoommate: (roommate: string) => void;
}) {
	const [roommates, setRoommates] = useState<string[]>([
		"Alex",
		"Nick",
		"Sebas",
	]);
	const [addingRoommate, setAddingRoommate] = useState(false);

	const addingRoommateHandler = () => {
		setAddingRoommate(true);
	};
	const addRoommate = (data: FormData) => {
		const name = data.get("roommateName") as string;
		setAddingRoommate(false);
		if (!roommates.includes(name)) {
			setRoommates((prev) => [...prev, name]);
		}
	};

	const removeRoommate = (name: string) => {
		setRoommates((prev) => prev.filter((roommate) => roommate !== name));
	};

	return (
		<div className="flex flex-col items-center gap-5 rounded-lg border bg-blue-300 p-5">
			<div className="flex items-center justify-center">
				<h2 className="font-bold text-2xl">Select Your Roommate</h2>
				<Button
					onClick={addingRoommateHandler}
					className="ml-5 cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-background"
				>
					Add Roommate
				</Button>
			</div>
			<div className="w-full border border-accent" />
			{addingRoommate && (
				<form
					action={addRoommate}
					className="flex w-full items-center justify-between"
				>
					<input
						type="text"
						placeholder="Enter roommate name"
						name="roommateName"
						className="flex w-[90%] rounded-lg border p-3"
					/>
					<Button
						type="submit"
						className="ml-5 cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-background"
					>
						Add
					</Button>
				</form>
			)}
			{roommates.map((roommate) => (
				<div
					key={roommate}
					className="flex w-full items-center justify-between"
				>
					<Button
						key={roommate}
						className={cn(
							"flex w-[90%] cursor-pointer items-center justify-center rounded-lg border p-3 hover:bg-primary/50",
							selectedRoommate === roommate &&
								"border-primary bg-foreground text-background hover:bg-foreground",
						)}
						onClick={() => selectRoommate(roommate)}
					>
						{roommate}
					</Button>
					<Trash
						className="cursor-pointer"
						onClick={() => removeRoommate(roommate)}
						size={32}
					/>
				</div>
			))}
		</div>
	);
}
