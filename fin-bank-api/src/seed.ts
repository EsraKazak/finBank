// fin-bank-api/src/seed.ts
import redis from "./config/redis";
import bcrypt from "bcryptjs";

const users = [
  {
    id: "1",
    name: "Ahmet",
    surname: "Yılmaz",
    username: "ahmet",
    email: "ahmet@gmail.com",
    pass: "123456",
    role: "SUBE_MUDURU",
  },
  {
    id: "2",
    name: "Ayşe",
    surname: "Kaya",
    username: "ayse",
    email: "ayse@gmail.com",
    pass: "123456",
    role: "BANKO_ASISTANI",
  },
  {
    id: "3",
    name: "Mehmet",
    surname: "Demir",
    username: "mehmet",
    email: "mehmet@gmail.com",
    pass: "123456",
    role: "BANKO_ASISTANI",
  },
  {
    id: "4",
    name: "Zeynep",
    surname: "Aydın",
    username: "zeynep",
    email: "zeynep@gmail.com",
    pass: "123456",
    role: "MUSTERI_TEMSILCISI",
  },
  {
    id: "5",
    name: "Can",
    surname: "Öztürk",
    username: "can",
    email: "can@gmail.com",
    pass: "123456",
    role: "BANKO_ASISTANI",
  },
];

async function seed() {
  console.log("Yeni kullanıcılar Redis veritabanına ekleniyor...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.pass, 10);

    // 1. Ana kullanıcı verisi (Hash)
    await redis.hset(`user:${user.username}`, {
      id: user.id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    });

    // 2. E-posta ile arama yapabilmek için indeks kaydı
    await redis.set(`user:email:${user.email}`, user.username);
  }

  console.log(
    `✅ 5 kullanıcı '${users.map((u) => u.email).join(", ")}' e-postalarıyla başarıyla yüklendi!`,
  );
  process.exit(0);
}

seed();
