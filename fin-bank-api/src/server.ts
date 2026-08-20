import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(cookieParser()); // cookşe okuması için koyduk
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL'iniz
    credentials: true, // Cookie transferine izin verir
  }),
);

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend API sunucusu http://localhost:${PORT} üzerinde çalışıyor.`,
  );
});
