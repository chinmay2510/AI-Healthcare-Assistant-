import { Request, Response, NextFunction } from "express";

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const LIMIT = 30; // 30 requests
const WINDOW_MS = 60 * 1000; // per 1 minute
const ipLimits: Record<string, RateLimitInfo> = {};

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers["x-forwarded-for"] as string || "anonymous";
  const now = Date.now();

  if (!ipLimits[ip]) {
    ipLimits[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    return next();
  }

  const limitInfo = ipLimits[ip];

  if (now > limitInfo.resetTime) {
    limitInfo.count = 1;
    limitInfo.resetTime = now + WINDOW_MS;
    return next();
  }

  if (limitInfo.count >= LIMIT) {
    res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please wait a minute before making another request."
    });
    return;
  }

  limitInfo.count++;
  next();
}
