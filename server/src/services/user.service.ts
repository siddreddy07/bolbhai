import { db } from "../prisma/db.js";
import type { UpdateUserInput, UserInput } from "../schemas/user.schema.js";

const users = db.orm.public.users;

export function createUser(data: UserInput) {
  return users.create(data);
}

export function updateUser(id: string, data: UpdateUserInput) {
  return users.where({ id }).update(data);
}

export function deleteUser(id: string) {
  return users.where({ id }).delete();
}

export function getUsers() {
  return users.all();
}

export function getUserById(id: string) {
  return users.first({ id });
}

export function getUserByEmail(email: string) {
  return users.first({ email });
}
