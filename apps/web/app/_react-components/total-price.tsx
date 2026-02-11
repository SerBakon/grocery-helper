export default function TotalPrice({ roommate }: { roommate: string }) {
	return (
		<div className="flex gap-2 rounded-lg border bg-red-300 p-5">
			<h2 className="font-bold text-2xl">Total Price for {roommate}: </h2>
		</div>
	);
}
