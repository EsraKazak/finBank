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
    return user as unknown as IUser;
  }

  async createUser(user: IUser): Promise<void> {
    await redis.hset(`user:${user.username}`, {
      id: user.id,
      name: user.name,
      surname: user.surname,
      username: user.username,
      password: user.password || "",
    });
  }
}

export default new UserRepository();
