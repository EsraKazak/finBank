import redis from "../config/redis";
import { IUser } from "../types/user.types";

//Kodun geri kalanını veritabanı sorgularından izole etmek için. Yarın Redis yerine PostgreSQL gelse sadece burası değişir.
class UserRepository {
  async findByUsername(username: string): Promise<IUser | null> {
    const user = await redis.hgetall(`user:${username}`);
    if (!user || !user.username) {
      return null;
    }
    //as unknown kullanmak typescripte bunu ısuer gibi kullan demektir
    return {
      ...(user as unknown as IUser),
      role: (user.role as IUser["role"]) || "BANKO_ASISTANI",
    };
  }

  // Şifremi unuttum akışında kullanmak için email ile arama
  async findByEmail(email: string): Promise<IUser | null> {
    const username = await redis.get(`email_to_user:${email}`);
    if (!username) return null;
    return this.findByUsername(username);
  }

  async createUser(user: IUser): Promise<void> {
    await redis.hset(`user:${user.username}`, {
      id: user.id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      email: user.email,
      password: user.password || "",
      role: user.role || "BANKO_ASISTANI",
    });
    await redis.set(`email_to_user:${user.email}`, user.username);
  }

  // şifre yenileme sıfırlam için
  async updatePassword(
    username: string,
    newHashedPassword: string,
  ): Promise<void> {
    await redis.hset(`user:${username}`, "password", newHashedPassword);
  }
}

export default new UserRepository();
