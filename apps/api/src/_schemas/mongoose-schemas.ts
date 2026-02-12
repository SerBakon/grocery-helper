import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

// now imports that use process.env...

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing");
dotenv.config({ path: "../../../../.env" });

mongoose
	.connect(uri, {
		dbName: "SkibidiRoomers",
	})
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

const groceryItemSchema = new mongoose.Schema({
	name: { type: String, required: true },
	groceries: [
		{
			name: { type: String, required: true },
			price: { type: Number, required: true },
		},
	],
});

export const GroceryList = mongoose.model("GroceryList", groceryItemSchema);
