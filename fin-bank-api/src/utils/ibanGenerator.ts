export const generateTurkishIban = (
  branchCode: string,
  customerNumber: number,
  accountNumber: number,
): string => {
  const bankCode = "00099"; // FinBank Banka Kodu (5 hane)
  const reserve = "0"; // Rezerv alanı (1 hane)
  const formattedBranchCode = branchCode.padStart(4, "0").slice(-4); // 4 hane

  // Müşteri No (8 hane) + Hesap No (6 hane) = 14 hane hesap alanı
  const formattedCustomer = customerNumber.toString().padStart(8, "0");
  const formattedAccount = accountNumber.toString().padStart(6, "0");
  const bban = `${bankCode}${reserve}${formattedBranchCode}${formattedCustomer}${formattedAccount}`;

  // MOD 97 Kontrol Haneleri Hesabı (TR = 292700)
  const numericString = `${bban}292700`;

  // Büyük sayı modu (BigInt)
  const remainder = Number(BigInt(numericString) % 97n);
  const checkDigits = (98 - remainder).toString().padStart(2, "0");

  return `TR${checkDigits}${bban}`;
};
