import crypto from "crypto";

export const generateReceiptNumber = (branchCode: string): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FIS-${dateStr}-${branchCode}-${randomSuffix}`;
};
