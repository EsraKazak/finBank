import prisma from "../config/prisma";

export const findCustomerByIdentityNumber = async (identityNumber: string) => {
  return prisma.customer.findUnique({
    where: { identityNumber },
  });
};

export const findLastCustomerNumber = async (): Promise<number | null> => {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { customerNumber: "desc" },
    select: { customerNumber: true },
  });
  return lastCustomer?.customerNumber ?? null;
};

export const createCustomer = async (data: {
  customerNumber: number;
  identityNumber: string;
  firstName: string;
  lastName: string;
  branchId: number;
  createdById: string;
}) => {
  return prisma.customer.create({
    data,
    include: {
      branch: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });
};

export const listCustomersByBranch = async (branchId?: number) => {
  return prisma.customer.findMany({
    where: branchId ? { branchId } : {},
    include: {
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
