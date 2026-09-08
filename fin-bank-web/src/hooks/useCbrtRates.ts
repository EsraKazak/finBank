import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export interface CbrtRates {
  policyRate: number;
  overnightBorrowingRate: number;
  overnightLendingRate: number;
  lastDecisionDate: string;
  trend: "UP" | "DOWN" | "STABLE";
  source: string;
  updatedAt: string;
}

export const useCbrtRates = () => {
  return useQuery<CbrtRates>({
    queryKey: ["cbrtRates"],
    queryFn: async () => {
      const response = await api.get("/market/cbrt-rates");
      return response.data.data;
    },
  });
};
