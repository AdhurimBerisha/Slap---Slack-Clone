import express from "express";
import { ENV } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest } from "./config/inngest.js";
import { serve } from "inngest/express";

const app = express();

app.use(express.json());
app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req, res) => {
  res.send("Hello World");
});

const startServer = async () => {
  try {
    await connectDb();
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.PORT, () => {
        console.log(`Server started on port ${ENV.PORT}`);
        connectDb();
      });
    }
  } catch (error) {
    console.error("Error starting server", error);
    process.exit(1);
  }
};

startServer();
export default app;
