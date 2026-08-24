import { Request, Response } from "express";
import adminService from "../services/adminService";

class AdminController {
  // Tüm kullanıcıları rolleriyle listele
  async getUsers(req: Request, res: Response) {
    try {
      const users = await adminService.listUsers();
      return res.status(200).json({ data: users });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Panel dropdown/seçim kutuları için roller ve izinler
  async getRolesAndPermissions(req: Request, res: Response) {
    try {
      const data = await adminService.listRolesAndPermissions();
      return res.status(200).json({ data });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Kullanıcıya rol atama
  async assignRole(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.body;
      const result = await adminService.assignRole(userId, roleId);
      return res.status(200).json({
        message: "Kullanıcıya rol başarıyla atandı.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // Kullanıcıya ekstra atomik izin atama
  async assignExtraPermissions(req: Request, res: Response) {
    try {
      const { userId, permissionIds } = req.body;
      const result = await adminService.assignExtraPermissions(
        userId,
        permissionIds,
      );
      return res.status(200).json({
        message: "Kullanıcının özel yetkileri güncellendi.",
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default new AdminController();
