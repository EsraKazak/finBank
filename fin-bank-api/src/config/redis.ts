import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

let redis: Redis;

if (redisUrl) {
  // Render / Canlı Ortam Yapılandırması
  redis = new Redis(redisUrl, {
    tls: redisUrl.startsWith("rediss://")
      ? { rejectUnauthorized: false }
      : undefined,
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
  });
} else {
  // Local Geliştirme Ortamı
  redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 3,
  });
}

redis.on("connect", () => console.log("Redis bağlantısı başarılı."));
redis.on("ready", () => console.log("Redis komut almaya hazır."));
redis.on("error", (err: Error) =>
  console.error("Redis bağlantı hatası:", err.message),
);

export default redis;
