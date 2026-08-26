import * as customerRepository from "../repositories/customerRepository";
import { isValidTurkishId } from "../utils/identityValidator";
import prisma from "../config/prisma";

export const registerCustomer = async (
  identityNumber: string,
  firstName: string,
  lastName: string,
  userId: string,
  branchId?: number, // Opsiyonel şube seçimi eklendi
) => {
  // 1. TC Algoritma Kontrolü
  if (!isValidTurkishId(identityNumber)) {
    throw new Error("Geçersiz T.C. Kimlik Numarası.");
  }

  // 2. Mükerrer Kayıt Kontrolü
  const existingCustomer =
    await customerRepository.findCustomerByIdentityNumber(identityNumber);
  if (existingCustomer) {
    throw new Error(
      "Bu T.C. Kimlik Numarası ile kayıtlı bir müşteri zaten mevcut.",
    );
  }

  // 3. Şube Belirleme (Kullanıcı seçtiyse o, seçmediyse personelin kendi şubesi)
  let targetBranchId = branchId;

  if (!targetBranchId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });

    if (!currentUser?.branchId) {
      throw new Error(
        "İşlem yapan personele atanmış bir şube bulunamadı ve şube seçimi yapılmadı.",
      );
    }
    targetBranchId = currentUser.branchId;
  }

  // 4. Otomatik Müşteri Numarası Üretme (10000001'den başlar)
  const lastNumber = await customerRepository.findLastCustomerNumber();
  const nextCustomerNumber = lastNumber ? lastNumber + 1 : 10000001;

  // 5. Kayıt
  return await customerRepository.createCustomer({
    customerNumber: nextCustomerNumber,
    identityNumber,
    firstName: firstName.trim().toUpperCase(),
    lastName: lastName.trim().toUpperCase(),
    branchId: targetBranchId,
    createdById: userId,
  });
};

export const getCustomers = async (branchId?: number) => {
  return await customerRepository.listCustomersByBranch(branchId);
};
