export type AccountType = "DEMAND" | "TIME";

export type RenewalType = "PRINCIPAL_AND_INTEREST" | "PRINCIPAL_ONLY" | "CLOSE";

export type AccountStatus = "ACTIVE" | "BLOCKED" | "CLOSED";

export interface Product {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  minInterest?: number | null;
  maxInterest?: number | null;
  isActive: boolean;
}

export interface Account {
  id: number;
  accountNumber: number;
  iban: string;
  name: string;
  currency: string;
  balance: string | number;
  status: AccountStatus;
  customerId: number;
  branchId: number;
  productId: number;
  product: Product;
  interestRate?: number | null;
  renewalType?: RenewalType | null;
  maturityStart?: string | null;
  maturityEnd?: string | null;
  maturityDays?: number | null;
  createdAt: string;
}

export interface OpenAccountDTO {
  customerId: number;
  productId: number | "";
  name: string;
  interestRate?: number | "";
  renewalType?: RenewalType | "";
  maturityDays?: number | "";
}
