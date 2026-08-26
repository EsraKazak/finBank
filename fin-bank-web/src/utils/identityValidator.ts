export const isValidTurkishId = (tc: string): boolean => {
  if (!/^[1-9]\d{10}$/.test(tc)) {
    return false;
  }

  const digits = tc.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  if ((tenthDigit + 10) % 10 !== digits[9]) {
    return false;
  }

  const firstTenSum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  if (firstTenSum % 10 !== digits[10]) {
    return false;
  }

  return true;
};
