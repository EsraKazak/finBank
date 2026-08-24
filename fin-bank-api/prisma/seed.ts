/// <reference types="node" />
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS: string[] = [
  "musteri:goruntule",
  "musteri:yonet",
  "hesap:bakiye:goruntule",
  "para:yatirma",
  "para:cekme",
  "islem:limit_ustu:onay",
  "sube:gun_sonu:kapatma",
  "denetim:kayit:goruntule",
  "personel:yonetimi",
];

const ROLES: string[] = [
  "YONETICI",
  "SUBE_MUDURU",
  "MUSTERI_ILISKILERI_YONETICISI",
  "MUSTERI_ILISKILERI_ASISTANI",
  "GISE_YETKILISI",
];

const ROLE_PERMISSIONS_MAPPING: Record<string, string[]> = {
  GISE_YETKILISI: [
    "musteri:goruntule",
    "hesap:bakiye:goruntule",
    "para:yatirma",
    "para:cekme",
    "sube:gun_sonu:kapatma",
  ],
  MUSTERI_ILISKILERI_ASISTANI: [
    "musteri:goruntule",
    "musteri:yonet",
    "hesap:bakiye:goruntule",
  ],
  MUSTERI_ILISKILERI_YONETICISI: [
    "musteri:goruntule",
    "musteri:yonet",
    "hesap:bakiye:goruntule",
    "para:yatirma",
    "para:cekme",
  ],
  SUBE_MUDURU: [
    "musteri:goruntule",
    "musteri:yonet",
    "hesap:bakiye:goruntule",
    "para:yatirma",
    "para:cekme",
    "islem:limit_ustu:onay",
    "sube:gun_sonu:kapatma",
    "denetim:kayit:goruntule",
  ],
  YONETICI: PERMISSIONS,
};

async function main(): Promise<void> {
  // 1. İzinleri ekle
  for (const code of PERMISSIONS) {
    await (prisma as any).permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  // 2. Rolleri ekle
  for (const name of ROLES) {
    await (prisma as any).role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const allPermissions = await (prisma as any).permission.findMany();
  const allRoles = await (prisma as any).role.findMany();

  const permMap = new Map<string, string>(
    allPermissions.map((p: { code: string; id: string }) => [p.code, p.id]),
  );
  const roleMap = new Map<string, string>(
    allRoles.map((r: { name: string; id: string }) => [r.name, r.id]),
  );

  // 3. Rol - Yetki Eşleştirmeleri
  for (const [roleName, permCodes] of Object.entries(
    ROLE_PERMISSIONS_MAPPING,
  )) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const code of permCodes) {
      const permissionId = permMap.get(code);
      if (permissionId) {
        await (prisma as any).rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }
  }

  // 4. Varsayılan Süper Admin Kullanıcısını Oluştur
  const adminPasswordHash = await bcrypt.hash("admin123*", 10);
  const adminUser = await (prisma as any).user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Sistem",
      surname: "Yöneticisi",
      username: "admin",
      email: "admin@finbank.com",
      password: adminPasswordHash,
    },
  });

  // 5. Admin Kullanıcısına YONETICI Rolünü Bağla
  const yoneticiRoleId = roleMap.get("YONETICI");
  if (yoneticiRoleId) {
    await (prisma as any).userRole.upsert({
      where: { userId: adminUser.id },
      update: { roleId: yoneticiRoleId },
      create: { userId: adminUser.id, roleId: yoneticiRoleId },
    });
  }

  console.log(
    "Seed başarıyla tamamlandı. Admin hesabı oluşturuldu (admin / admin123*).",
  );
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
