import React from "react";
import { Container, Stack, Typography } from "@mui/material";
import { CButton } from "./components/CButton";
import { UserCard } from "./components/UserCard";
import "./App.css";
import { useState } from "react";
import { TransferForm } from "./components/TransferForm";

function App() {
  const [isActive, setIsActive] = useState(true);
  const [iban, setIban] = React.useState("");
  const [balance, setBalance] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [transferType, setTransferType] = React.useState("havale");

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
        <Stack spacing={2} direction="row" sx={{ justifyContent: "center" }}>
          <TransferForm
            iban={iban}
            setIban={setIban}
            balance={balance}
            setBalance={setBalance}
            description={description}
            setDescription={setDescription}
          />
          <CButton
            label="Transfer"
            color="primary"
            disabled={!isActive}
            onClick={() => {
              if (iban == "" || iban.length !== 32 || description == "") {
                alert("Lütfen geçerli bir IBAN ve açıklama giriniz.");
              } else {
                alert(
                  "Transfer işlemi başlatıldı! IBAN: " +
                    iban +
                    ", Miktar: " +
                    balance +
                    ", Açıklama: " +
                    description,
                );
              }
            }}
          />
          <CButton
            label="Detaylar"
            color="secondary"
            onClick={() => alert("Detaylar gösteriliyor!")}
          />
          <CButton
            label="Hesabı Kapat"
            color="error"
            variant="outlined"
            disabled={!isActive}
            onClick={() => setIsActive(false)}
          />
          <CButton
            label="Hesabı Aç"
            color="primary"
            disabled={isActive}
            onClick={() => setIsActive(true)}
          />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
