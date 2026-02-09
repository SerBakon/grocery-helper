"use client";

import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useState } from "react";

export default function RoommatePicker() {
	const [roommates, setRoommates] = useState<string[]>([
		"Alex",
		"Nick",
		"Sebas",
		"Bryan",
		"Leo",
		"Manny",
	]);
	const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);

	const selectRoommate = (roommate: string) => {
		setSelectedRoommate(roommate);
	};
	const addRoommate = (name: string) => {
		setRoommates((prev) => [...prev, name]);
	};

	const removeRoommate = (name: string) => {
		setRoommates((prev) => prev.filter((roommate) => roommate !== name));
	};

	return (
		<div className="flex flex-col items-center justify-center gap-5 rounded-lg border bg-blue-300 p-5">
			<div className="flex items-center justify-center">
				<h2 className="font-bold text-2xl">Select Your Roommate</h2>
				<Button className="ml-5 cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-background">
					Add Roommate
				</Button>
			</div>
			<div className="w-full border border-accent" />
			{roommates.map((roommate) => (
				<div
					key={roommate}
					className="flex w-full items-center justify-between"
				>
					<Button
						key={roommate}
						className="flex w-[90%] cursor-pointer items-center justify-center rounded-lg border p-3"
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
