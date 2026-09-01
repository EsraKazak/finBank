import React, { createContext, useContext, useState } from "react";
import type { Customer } from "../types/customer.types";

interface CustomerContextType {
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined,
);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem("activeCustomer");
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetCustomer = (customer: Customer | null) => {
    setActiveCustomer(customer);
    if (customer) {
      localStorage.setItem("activeCustomer", JSON.stringify(customer));
    } else {
      localStorage.removeItem("activeCustomer");
    }
  };

  const clearCustomer = () => {
    handleSetCustomer(null);
  };

  return (
    <CustomerContext.Provider
      value={{
        activeCustomer,
        setActiveCustomer: handleSetCustomer,
        clearCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};
