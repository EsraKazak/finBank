import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

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

export const listPaginatedCustomers = async (params: {
  branchId?: number;
  search?: string;
  skip?: number;
  take?: number;
}) => {
  const { branchId, search, skip, take } = params;

  // Tip güvenli OR koşulları listesi
  const orConditions: Prisma.CustomerWhereInput[] = [];

  if (search && search.trim() !== "") {
    const term = search.trim();

    orConditions.push(
      { identityNumber: { contains: term, mode: "insensitive" as const } },
      { firstName: { contains: term, mode: "insensitive" as const } },
      { lastName: { contains: term, mode: "insensitive" as const } },
    );

    // Eğer aranan terim bir sayıysa müşteri numarasını da ara
    const numericSearch = Number(term);
    if (!isNaN(numericSearch)) {
      orConditions.push({ customerNumber: numericSearch });
    }
  }

  const whereClause: Prisma.CustomerWhereInput = {
    ...(branchId ? { branchId } : {}),
    ...(orConditions.length > 0 ? { OR: orConditions } : {}),
  };

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where: whereClause,
      include: {
        branch: true,
      },
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    }),
    prisma.customer.count({
      where: whereClause,
    }),
  ]);

  return { customers, totalCount };
};
