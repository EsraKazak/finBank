export type AccountStatus = "ACTIVE" | "BLOCKED" | "CLOSED";
export type AccountType = "DEMAND" | "TIME";
export type RenewalType = "PRINCIPAL_AND_INTEREST" | "PRINCIPAL_ONLY" | "CLOSE";

export interface Currency {
  id: number;
  code: string;
  name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  type: AccountType;
}

export interface ProductCurrency {
  id: number;
  productId: number;
  currencyId: number;
  minInterest?: string | number | null;
  maxInterest?: string | number | null;
  currency: Currency;
  product: Product;
}

export interface Account {
  id: number;
  accountNumber: number;
  iban: string;
  name: string;
  balance: string | number;
  status: AccountStatus;
  productId: number;
  currencyId: number;
  interestRate?: number | string | null;
  renewalType?: RenewalType | null;
  maturityDays?: number | null;
  maturityStart?: string | null;
  maturityEnd?: string | null;
  product?: Product;
  currency?: Currency;
  targetAccountId?: number | null;
}

export interface CreateTimeAccountDTO {
  customerId: number;
  productId: number;
  currencyId: number;
  name: string;
  interestRate: number;
  renewalType: RenewalType;
  maturityDays: number;
}
