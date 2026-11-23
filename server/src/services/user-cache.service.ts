import { redis } from "../config/redis.js";
import { db } from "../prisma/db.js";

// The logged-in user and the ids of their shops, kept in Redis for one day (key user:{id}).
// Every request needs them (who is this, and is this shop theirs?), so they are not read from the database each time.
// When a shop is added or deleted its id is added or removed here, and when the user changes the copy is thrown away.

export type CachedUser = { id: string; email: string; name: string | null; shopIds: string[] };

const KEEP_SECONDS = 24 * 60 * 60;
const key = (id: string) => `user:${id}`;

/** The user with their shop ids: from Redis, or (once a day, or when Redis is down) from the database. */
export async function loadUser(id: string): Promise<CachedUser | null> {
  try {
    const saved = await redis?.get<CachedUser>(key(id));
    if (saved) return saved;
  } catch (error) {
    console.error("User cache read failed:", error);
  }

  const [user, shops] = await Promise.all([
    db.orm.public.users.select("id", "name", "email").first({ id }),
    db.orm.public.shops.select("id").where({ ownerId: id }).all(),
  ]);
  if (!user) return null;
  const fresh = { id: user.id, email: user.email, name: user.name, shopIds: shops.map((s) => s.id) };
  try {
    await redis?.set(key(id), fresh, { ex: KEEP_SECONDS });
  } catch (error) {
    console.error("User cache write failed:", error);
  }
  return fresh;
}

/** A shop was added: its id goes on the user's list. */
export async function addShopId(userId: string, shopId: string) {
  const user = await redis?.get<CachedUser>(key(userId));
  if (user && !user.shopIds.includes(shopId)) await redis!.set(key(userId), { ...user, shopIds: [...user.shopIds, shopId] }, { ex: KEEP_SECONDS });
}

/** A shop was deleted: its id comes off the user's list. */
export async function removeShopId(userId: string, shopId: string) {
  const user = await redis?.get<CachedUser>(key(userId));
  if (user) await redis!.set(key(userId), { ...user, shopIds: user.shopIds.filter((s) => s !== shopId) }, { ex: KEEP_SECONDS });
}

/** The user changed or was deleted: forget the copy, it is read again next time. */
export async function forgetUser(userId: string) {
  await redis?.del(key(userId));
}
