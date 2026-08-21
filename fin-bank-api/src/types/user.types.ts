export enum UserRole {
  YONETICI = "YONETICI",
  SUBE_MUDURU = "SUBE_MUDURU",
  MUSTERI_ILISKILERI_YONETICISI = "MUSTERI_ILISKILERI_YONETICISI",
  MUSTERI_ILISKILERI_ASISTANI = "MUSTERI_ILISKILERI_ASISTANI",
  GISE_YETKILISI = "GISE_YETKILISI",
}

// Atomik İzinler
export enum Permission {
  MUSTERI_GORUNTULE = "musteri:goruntule",
  MUSTERI_YONET = "musteri:yonet",
  HESAP_BAKIYE_GORUNTULE = "hesap:bakiye:goruntule",
  PARA_YATIRMA = "para:yatirma",
  PARA_CEKME = "para:cekme",
  LIMIT_USTU_ISLEM_ONAY = "islem:limit_ustu:onay",
  SUBE_GUN_SONU_KAPATMA = "sube:gun_sonu:kapatma",
  DENETIM_KAYITLARI_GORUNTULE = "denetim:kayit:goruntule",
  PERSONEL_YONETIMI = "personel:yonetimi",
}

// Rol - İzin Eşleştirmesi (Mapping)
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.GISE_YETKILISI]: [
    Permission.MUSTERI_GORUNTULE,
    Permission.HESAP_BAKIYE_GORUNTULE,
    Permission.PARA_YATIRMA,
    Permission.PARA_CEKME,
    Permission.SUBE_GUN_SONU_KAPATMA,
  ],
  [UserRole.MUSTERI_ILISKILERI_ASISTANI]: [
    Permission.MUSTERI_GORUNTULE,
    Permission.MUSTERI_YONET,
    Permission.HESAP_BAKIYE_GORUNTULE,
  ],
  [UserRole.MUSTERI_ILISKILERI_YONETICISI]: [
    Permission.MUSTERI_GORUNTULE,
    Permission.MUSTERI_YONET,
    Permission.HESAP_BAKIYE_GORUNTULE,
    Permission.PARA_YATIRMA,
    Permission.PARA_CEKME,
  ],
  [UserRole.SUBE_MUDURU]: [
    Permission.MUSTERI_GORUNTULE,
    Permission.MUSTERI_YONET,
    Permission.HESAP_BAKIYE_GORUNTULE,
    Permission.PARA_YATIRMA,
    Permission.PARA_CEKME,
    Permission.LIMIT_USTU_ISLEM_ONAY,
    Permission.SUBE_GUN_SONU_KAPATMA,
    Permission.DENETIM_KAYITLARI_GORUNTULE,
  ],
  [UserRole.YONETICI]: [
    Permission.MUSTERI_GORUNTULE,
    Permission.MUSTERI_YONET,
    Permission.HESAP_BAKIYE_GORUNTULE,
    Permission.PARA_YATIRMA,
    Permission.PARA_CEKME,
    Permission.LIMIT_USTU_ISLEM_ONAY,
    Permission.SUBE_GUN_SONU_KAPATMA,
    Permission.DENETIM_KAYITLARI_GORUNTULE,
    Permission.PERSONEL_YONETIMI,
  ],
};

//tip güvenliği için kullanıcı şifresi tipini IUser'den LoginResponse'dan çıkardık.
export interface IUser {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  password?: string;
  refreshToken?: string;
  role: UserRole;
  permissions?: Permission[];
  createdAt?: Date;
}

export interface ILoginRequest {
  username: string;
  password: string;
}

//burada omit kullanarak password alanını çıkardık çünkü kullanıcıya şifreyi geri göndermemeliyiz.
export interface IAuthResponse {
  accessToken: string;
  user: Omit<IUser, "password">;
  refreshToken?: string;
}
