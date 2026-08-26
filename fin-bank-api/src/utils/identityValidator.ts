export const isValidTurkishId = (tc: string): boolean => {
  if (!/^[1-9]\d{10}$/.test(tc)) {
    return false;
  }

  const digits = tc.split("").map(Number);

  // 1, 3, 5, 7, 9. hanelerin toplamı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  // 2, 4, 6, 8. hanelerin toplamı
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  // 10. hane kuralı
  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  if ((tenthDigit + 10) % 10 !== digits[9]) {
    return false;
  }

  // 11. hane kuralı: İlk 10 hanenin toplamının mod 10'u
  const firstTenSum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  if (firstTenSum % 10 !== digits[10]) {
    return false;
  }

  return true;
};
