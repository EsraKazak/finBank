import React, { useState } from "react";
import { Container, Stack, Typography, Box } from "@mui/material";
import { CButton } from "./components/CButton";
import { UserCard } from "./components/UserCard";
import { TransferForm } from "./components/TransferForm";
import { TransferType } from "./types/transfer";
import "./App.css";

function App() {
  const [isActive, setIsActive] = useState(true);
  const [iban, setIban] = useState("");
  const [balance, setBalance] = useState(0);
  const [description, setDescription] = useState("");
  const [transferType, setTransferType] = useState<TransferType>(
    TransferType.Havale,
  );

  const handleTransfer = () => {
    // 26 hane + 6 boşluk = 32 karakter
    if (iban === "" || iban.length !== 32 || description === "") {
      alert("Lütfen geçerli bir IBAN ve açıklama giriniz.");
    } else {
      alert(
        `Transfer işlemi başlatıldı!\nTür: ${transferType}\nIBAN: ${iban}\nMiktar: ${balance}\nAçıklama: ${description}`,
      );
    }
  };

  const handleShowDetails = () => {
    alert(
      `Kullanıcı Detayları:\nIBAN: TR${iban}\nBakiye: ${balance} TL\nDurum: ${isActive ? "Aktif" : "Pasif"}`,
    );
  };

  const handleCloseAccount = () => {
    setIsActive(false);
    alert("Hesap kapatıldı.");
  };

  const handleOpenAccount = () => {
    setIsActive(true);
    alert("Hesap açıldı.");
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={4} sx={{ mt: 5 }}>
        <Typography variant="h4" component="h1" align="center">
          Kullanıcı Bilgileri
        </Typography>

        <UserCard
          name="Esra KAZAK"
          email="esrakazak321@gmail.com"
          iban="TR123456789012345678901234"
          Balance={1000}
          status={isActive}
        />

        <Stack spacing={3} direction="row" sx={{ justifyContent: "center" }}>
          <Box sx={{ display: "grid", gap: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 4,
              }}
            >
              <CButton
                label="Transfer"
                color="primary"
                disabled={!isActive}
                onClick={handleTransfer}
              />
              <CButton
                label="Detaylar"
                color="secondary"
                onClick={handleShowDetails}
              />
              <CButton
                label="Hesabı Kapat"
                color="error"
                variant="outlined"
                disabled={!isActive}
                onClick={handleCloseAccount}
              />
              <CButton
                label="Hesabı Aç"
                color="primary"
                disabled={isActive}
                onClick={handleOpenAccount}
              />
            </Box>

            <TransferForm
              iban={iban}
              onIbanChange={setIban}
              balance={balance}
              onBalanceChange={setBalance}
              description={description}
              onDescriptionChange={setDescription}
              transferType={transferType}
              setTransferType={setTransferType}
            />
          </Box>
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
