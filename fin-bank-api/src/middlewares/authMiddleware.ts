import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "access_secret_key";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name?: string;
    surname?: string;
    email?: string;
    role?: string;
    permissions?: string[];
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res
      .status(401)
      .json({ message: "Erişim reddedildi. Token bulunamadı." });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Token geçersiz veya süresi dolmuş." });
    }
    req.user = user as AuthRequest["user"];
    next();
  });
};
// Atomik yetki denetimi (Yönetici her şeye erişebilir)
export const requirePermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Yetkilendirme başarısız." });
    }

    const hasAccess =
      req.user.role === "YONETICI" ||
      req.user.permissions?.includes(requiredPermission);

    if (!hasAccess) {
      return res.status(403).json({
        message: `Bu işlem için yetkiniz bulunmamaktadır. Gereken yetki: ${requiredPermission}`,
      });
    }

    next();
  };
};
