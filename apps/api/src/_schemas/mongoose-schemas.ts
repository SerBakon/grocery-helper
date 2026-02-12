import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

// now imports that use process.env...

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing");

mongoose
	.connect(uri, {
		dbName: "SkibidiRoomers",
	})
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

const groceryListSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		groceries: [
			{
				name: { type: String, required: true },
				price: { type: Number, required: true },
			},
		],
	},
	{ collection: "grocerylists" },
);

export const GroceryList = mongoose.model("GroceryList", groceryListSchema);

const groceryItemSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		price: { type: Number, required: true },
		numberOfItems: { type: Number, default: 1 },
		numberOfPeople: { type: Number, required: true },
	},
	{ collection: "groceries" },
);

export const GroceryItem = mongoose.model("GroceryItem", groceryItemSchema);

const roommateSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
	},
	{ collection: "roommates" },
);

export const Roommate = mongoose.model("Roommate", roommateSchema);
