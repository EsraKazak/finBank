import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

//  Render'daki REDIS_URL varsa doğrudan URL ile bağlanır
//  Yoksa yereldeki REDIS_HOST / REDIS_PORT veya localhost'a döner
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

redis.on("connect", () => console.log("Redis veritabanı bağlantısı başarılı."));
redis.on("error", (err: Error) => console.error("Redis bağlantı hatası:", err));

export default redis;
