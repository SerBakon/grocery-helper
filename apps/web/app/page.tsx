import Header from "./_react-components/header";
import RoommatePicker from "./_react-components/roommate-picker";

export default function Home() {
	return (
		<div>
			<Header />
			<main className="m-10 grid grid-cols-3 rounded-lg border-5 border-secondary p-10">
				<RoommatePicker />
			</main>
		</div>
	);
}
