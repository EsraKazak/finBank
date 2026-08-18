import redis from "./config/redis";
import bcrypt from "bcryptjs";

const users = [
  {
    id: "1",
    name: "Ahmet",
    surname: "Yılmaz",
    username: "ahmet",
    pass: "123456",
  },
  { id: "2", name: "Ayşe", surname: "Kaya", username: "ayse", pass: "123456" },
  {
    id: "3",
    name: "Mehmet",
    surname: "Demir",
    username: "mehmet",
    pass: "123456",
  },
  {
    id: "4",
    name: "Fatma",
    surname: "Çelik",
    username: "fatma",
    pass: "123456",
  },
  { id: "5", name: "Can", surname: "Öztürk", username: "can", pass: "123456" },
  {
    id: "6",
    name: "Zeynep",
    surname: "Aydın",
    username: "zeynep",
    pass: "123456",
  },
  { id: "7", name: "Burak", surname: "Koç", username: "burak", pass: "123456" },
  { id: "8", name: "Elif", surname: "Şahin", username: "elif", pass: "123456" },
  {
    id: "9",
    name: "Emre",
    surname: "Arslan",
    username: "emre",
    pass: "123456",
  },
  {
    id: "10",
    name: "Selin",
    surname: "Yıldız",
    username: "selin",
    pass: "123456",
  },
];

async function seed() {
  console.log("Kullanıcılar Redis veritabanına ekleniyor...");

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.pass, 10);
    await redis.hset(`user:${user.username}`, {
      id: user.id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      password: hashedPassword,
    });
  }

  console.log("10 kullanıcı şifrelenmiş olarak başarıyla eklendi!");
  process.exit(0);
}

seed();
