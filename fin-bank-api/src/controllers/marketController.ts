import { Request, Response } from "express";
import axios from "axios";
import moment from "moment";
import redisClient from "../config/redis";

const CACHE_KEY = "cbrt_rates_v3";

export const getCbrtRatesHandler = async (_req: Request, res: Response) => {
  try {
    // 1. Redis Cache Kontrolü
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return res.status(200).json({
          success: true,
          data: JSON.parse(cached),
        });
      }
    } catch (cacheErr) {
      console.warn("Redis okuma hatası:", cacheErr);
    }

    const rawApiKey = process.env.TCMB_EVDS_API_KEY;

    if (!rawApiKey) {
      return res.status(200).json({
        success: true,
        message: "Şu anda verilere ulaşılamıyor.",
        data: null,
      });
    }

    const apiKey = rawApiKey.trim();
    const endDate = moment().format("DD-MM-YYYY");
    const startDate = moment().subtract(1, "months").format("DD-MM-YYYY");

    // Faiz + USD Alış/Satış + EUR Alış/Satış serileri
    const seriesCode =
      "TP.APIFON4-TP.DK.USD.A.YTL-TP.DK.USD.S.YTL-TP.DK.EUR.A.YTL-TP.DK.EUR.S.YTL";

    const evdsUrl = `https://evds3.tcmb.gov.tr/igmevdsms-dis/series=${seriesCode}&startDate=${startDate}&endDate=${endDate}&type=json`;

    const apiResponse = await axios.get(evdsUrl, {
      headers: {
        key: apiKey,
        Accept: "application/json",
      },
      timeout: 10000,
    });

    let data = apiResponse.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        throw new Error("EVDS yanıtı JSON formatına dönüştürülemedi.");
      }
    }

    const items = data?.items;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(
        `EVDS yanıtında items dizisi boş döndü (totalCount: ${data?.totalCount}).`,
      );
    }

    // Dolu faiz kayıtlarını filtrele
    const validItems = items.filter((item: any) => {
      const val = item.TP_APIFON4 ?? item["TP.APIFON4"] ?? item["TP_APIFON4"];
      return val !== null && val !== undefined && String(val).trim() !== "";
    });

    if (validItems.length === 0) {
      throw new Error("Tarih aralığında dolu faiz kaydı bulunamadı.");
    }

    // Güncel politika faizi
    const latestItem = validItems[validItems.length - 1];
    const rawVal = latestItem.TP_APIFON4 ?? latestItem["TP.APIFON4"];
    const currentRate = parseFloat(String(rawVal).replace(",", "."));

    // Geriye doğru tara: 37'den farklı olan son oranı bul (40.00)
    let previousRate = currentRate;
    for (let i = validItems.length - 2; i >= 0; i--) {
      const pastRawVal =
        validItems[i].TP_APIFON4 ?? validItems[i]["TP.APIFON4"];
      const pastRate = parseFloat(String(pastRawVal).replace(",", "."));

      if (pastRate !== currentRate) {
        previousRate = pastRate;
        break;
      }
    }

    let trend: "UP" | "DOWN" | "STABLE" = "STABLE";
    if (currentRate > previousRate) trend = "UP";
    else if (currentRate < previousRate) trend = "DOWN";

    // Döviz kurlarını oku (EVDS'nin tüm isimlendirme varyasyonlarını tarar)
    const extractCurrency = (prefixes: string[]): number => {
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        for (const key of Object.keys(item)) {
          // Örn: TP_DK_USD_A veya TP.DK.USD.A ile başlayan dolu alanı bul
          const isMatch = prefixes.some((p) =>
            key.replace(/\./g, "_").startsWith(p.replace(/\./g, "_")),
          );
          if (isMatch) {
            const val = item[key];
            if (
              val !== null &&
              val !== undefined &&
              String(val).trim() !== ""
            ) {
              const parsed = parseFloat(String(val).replace(",", "."));
              if (!isNaN(parsed) && parsed > 0) {
                return parsed;
              }
            }
          }
        }
      }
      return 0;
    };

    const usdBid = extractCurrency(["TP_DK_USD_A", "TP.DK.USD.A"]);
    const usdAsk = extractCurrency(["TP_DK_USD_S", "TP.DK.USD.S"]);
    const eurBid = extractCurrency(["TP_DK_EUR_A", "TP.DK.EUR.A"]);
    const eurAsk = extractCurrency(["TP_DK_EUR_S", "TP.DK.EUR.S"]);

    const cbrtData = {
      policyRate: currentRate,
      overnightBorrowingRate: Number((currentRate - 3.0).toFixed(2)),
      overnightLendingRate: Number((currentRate + 3.0).toFixed(2)),
      lastDecisionDate: latestItem.Tarih
        ? moment(latestItem.Tarih, "DD-MM-YYYY").format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD"),
      trend,
      currencies: [
        { code: "USD", name: "Dolar", buying: usdBid, selling: usdAsk },
        { code: "EUR", name: "Euro", buying: eurBid, selling: eurAsk },
      ],
      source: "TCMB EVDS (Canlı)",
      updatedAt: new Date().toISOString(),
    };

    // Redis Cache'e kaydet (1 saat)
    try {
      await redisClient.setex(CACHE_KEY, 3600, JSON.stringify(cbrtData));
    } catch (redisErr) {
      console.warn("Redis yazma hatası:", redisErr);
    }

    return res.status(200).json({
      success: true,
      data: cbrtData,
    });
  } catch (error: any) {
    console.error("TCMB EVDS Entegrasyon Hatası:", error.message);

    return res.status(200).json({
      success: true,
      message: "Şu anda verilere ulaşılamıyor.",
      data: null,
    });
  }
};
