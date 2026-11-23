import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { TOKEN_EXPIRED_STATUS } from "../config/constant.js";
import { verifyAccessToken } from "../helper/jwt.helper.js";
import { loadUser, type CachedUser } from "../services/user-cache.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: CachedUser;
    }
  }
}

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Not logged in" });

    const { id } = verifyAccessToken(token);
    const user = await loadUser(id); // from Redis: no database call
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return res.status(TOKEN_EXPIRED_STATUS).json({ message: "Access token expired" });
    res.status(401).json({ message: "Invalid token" });
  }
}

/** Is this shop one of the logged-in user's? (answered from their cached shop ids, no database call) */
export const ownsShop = (req: Request, shopId: string) => !!req.user?.shopIds.includes(shopId);
