import { Elysia } from "elysia";

const app = new Elysia();

// Test Methods
app.get("/ping", () => "pong");
app.get("/", () => "Hello Elysia");
app.listen(process.env.ELYSIA_LISTEN || 3001, () => {
	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);
});
