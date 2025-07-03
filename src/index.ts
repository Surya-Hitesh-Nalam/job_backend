import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import roundRoutes from "./routes/roundRoutes";
import jobRoutes from "./routes/jobRoutes";

import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const app = express();

app.use(express.json());
app.use("/api/rounds", roundRoutes);

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);


app.get("/", (_req, res) => {
  res.send("✅ API is running...");
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
