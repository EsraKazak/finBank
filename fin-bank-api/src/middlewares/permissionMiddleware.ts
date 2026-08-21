import { Request, Response, NextFunction } from "express";
import { Permission } from "../types/user.types";

export const requirePermission = (requiredPermission: Permission) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.permissions) {
      return res
        .status(403)
        .json({ message: "Erişim reddedildi: Yetkisiz kullanıcı." });
    }

    const hasPermission = user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({
        message:
          "Bu işlemi gerçekleştirmek için gerekli bankacılık yetkiniz bulunmamaktadır.",
      });
    }

    next();
  };
};
