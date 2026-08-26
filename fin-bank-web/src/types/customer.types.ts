export interface Branch {
  id: number;
  code: string;
  name: string;
  city: string;
}

export interface Customer {
  id: number;
  customerNumber: number;
  identityNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  branchId: number;
  branch: Branch;
  createdAt: string;
}

export interface CreateCustomerDTO {
  identityNumber: string;
  firstName: string;
  lastName: string;
  branchId?: number | "";
}
