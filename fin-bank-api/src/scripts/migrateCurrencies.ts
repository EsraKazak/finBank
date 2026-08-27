import prisma from "../config/prisma";

async function main() {
  console.log("Dövizler ve parametrik ürünler tanımlanıyor...");

  // 1. Temel Dövizleri (Currencies) Tanımla
  const tryCurr = await prisma.currency.upsert({
    where: { code: "TRY" },
    update: {},
    create: { code: "TRY", name: "Türk Lirası" },
  });

  const usdCurr = await prisma.currency.upsert({
    where: { code: "USD" },
    update: {},
    create: { code: "USD", name: "Amerikan Doları" },
  });

  const eurCurr = await prisma.currency.upsert({
    where: { code: "EUR" },
    update: {},
    create: { code: "EUR", name: "Euro" },
  });

  const gbpCurr = await prisma.currency.upsert({
    where: { code: "GBP" },
    update: {},
    create: { code: "GBP", name: "İngiliz Sterlini" },
  });

  // 2. Parametrik Ürünleri (Products) Tanımla
  const demandProduct = await prisma.product.upsert({
    where: { code: "DEMAND_DEPOSIT" },
    update: { name: "Vadesiz Mevduat Hesabı", type: "DEMAND" },
    create: {
      code: "DEMAND_DEPOSIT",
      name: "Vadesiz Mevduat Hesabı",
      type: "DEMAND",
    },
  });

  const timeProduct = await prisma.product.upsert({
    where: { code: "TIME_DEPOSIT" },
    update: { name: "Vadeli Mevduat Hesabı", type: "TIME" },
    create: {
      code: "TIME_DEPOSIT",
      name: "Vadeli Mevduat Hesabı",
      type: "TIME",
    },
  });

  // 3. Ürün - Döviz İlişki & İzinlerini Tanımla (ProductCurrency)
  const productCurrencies = [
    // Vadesiz için döviz izinleri
    { productId: demandProduct.id, currencyId: tryCurr.id },
    { productId: demandProduct.id, currencyId: usdCurr.id },
    { productId: demandProduct.id, currencyId: eurCurr.id },
    { productId: demandProduct.id, currencyId: gbpCurr.id },

    // Vadeli için döviz ve faiz sınırları
    {
      productId: timeProduct.id,
      currencyId: tryCurr.id,
      minInterest: 30.0,
      maxInterest: 50.0,
    },
    {
      productId: timeProduct.id,
      currencyId: usdCurr.id,
      minInterest: 1.5,
      maxInterest: 4.5,
    },
    {
      productId: timeProduct.id,
      currencyId: eurCurr.id,
      minInterest: 1.0,
      maxInterest: 3.5,
    },
  ];

  for (const item of productCurrencies) {
    await prisma.productCurrency.upsert({
      where: {
        productId_currencyId: {
          productId: item.productId,
          currencyId: item.currencyId,
        },
      },
      update: {
        minInterest: item.minInterest,
        maxInterest: item.maxInterest,
        isActive: true,
      },
      create: item,
    });
  }

  // 4. Varsa Önceden Açılmış Hesapları Varsayılan TRY ve Vadesiz Ürün ile Eşleştir
  const updatedAccounts = await prisma.account.updateMany({
    where: {
      currencyId: null,
    },
    data: {
      currencyId: tryCurr.id,
      productId: demandProduct.id,
    },
  });

  console.log(
    `İşlem tamamlandı! ${updatedAccounts.count} adet hesap TRY ve Vadesiz ürünle güvenle eşleştirildi.`,
  );
}

main()
  .catch((e) => {
    console.error("Hata:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
