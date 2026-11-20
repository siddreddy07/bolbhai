import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } from "../config/constant.js";

export function signAccessToken(id: string) {
  return jwt.sign({ id }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

export function signRefreshToken(id: string) {
  return jwt.sign({ id }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

function verify(token: string, secret: string) {
  return jwt.verify(token, secret) as { id: string };
}

export function verifyAccessToken(token: string) {
  return verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return verify(token, env.JWT_REFRESH_SECRET);
}
