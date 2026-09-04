import { useState } from "react";

export const useReceiptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [printReceipt, setPrintReceipt] = useState(true);

  const triggerReceipt = (receiptPayload: any) => {
    if (printReceipt) {
      setData(receiptPayload);
      setIsOpen(true);
    }
  };

  const closeReceipt = () => {
    setIsOpen(false);
    setData(null);
  };

  return {
    isOpen,
    data,
    printReceipt,
    setPrintReceipt,
    triggerReceipt,
    closeReceipt,
  };
};
