import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

// bağlantı kurulduğunda ve hata oluştuğunda loglama yapmak için event listener ekliyoruz
redis.on("connect", () => console.log("Redis veritabanı bağlantısı başarılı."));
redis.on("error", (err: Error) => console.error("Redis bağlantı hatası:", err));

export default redis;
