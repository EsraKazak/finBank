import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/adminRoutes";
import prisma from "./config/prisma";
import customerRoutes from "./routes/customerRoutes";
import accountRoutes from "./routes/accountRoutes";

dotenv.config();

const app = express();

// İzin verilen adreslerin listesi (Hem localhost hem de Render CLIENT_URL)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Sunucular arası isteklerde veya listedeki origin'lerde izin ver
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy error: Origin not allowed."));
      }
    },
    credentials: true, // Cookie transferine izin verir
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use("/api/accounts", accountRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("Veritabanı bağlantısı başarıyla hazırlandı.");
  } catch (err) {
    console.error("Veritabanı ilk bağlantı hatası:", err);
  }
  console.log(
    `Backend API sunucusu http://localhost:${PORT} üzerinde çalışıyor.`,
  );
});
