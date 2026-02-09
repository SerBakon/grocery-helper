import Header from "./_react-components/header";
import RoommatePicker from "./_react-components/roommate-picker";

export default function Home() {
	return (
		<div>
			<Header />
			<main className="grid grid-cols-3 border-5 border-secondary rounded-lg p-10 m-10">
				<RoommatePicker />
			</main>
		</div>
	);
}
