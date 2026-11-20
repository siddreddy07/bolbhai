import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { PASSWORD_SALT_ROUNDS } from "../config/constant.js";
import type { UpdateUserInput, UserInput } from "../schemas/user.schema.js";

const users = db.orm.public.users;

// Never send the password hash back to anyone.
function withoutPassword<T extends { password: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}

export async function createUser(data: UserInput) {
  const password = await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS);
  return withoutPassword(await users.create({ ...data, password }));
}

export async function loginUser(email: string, password: string) {
  const user = await users.first({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) return null;
  return withoutPassword(user);
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const user = await users.where({ id }).update(data);
  return user ? withoutPassword(user) : null;
}

export function deleteUser(id: string) {
  return users.where({ id }).delete();
}

export function getUsers() {
  return users.select("id", "email", "name", "createdAt", "updatedAt").all();
}

export function getUserById(id: string) {
  return users.select("id", "email", "name", "createdAt", "updatedAt").first({ id });
}

export function getUserByEmail(email: string) {
  return users.first({ email });
}
