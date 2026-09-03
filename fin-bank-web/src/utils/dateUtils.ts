import moment from "moment";
import Holidays from "date-holidays";

// Türkiye resmi ve dini tatil takvimini başlatır
const hd = new Holidays("TR");

/**
 * Verilen tarihin hafta sonu (Cumartesi-Pazar) veya resmi/dini tatil olup olmadığını kontrol eder.
 */
export const isNonWorkingDay = (mDate: moment.MomentInput): boolean => {
  const m = moment(mDate);
  // 1. Hafta sonu kontrolü (Cumartesi: 6, Pazar: 7)
  if (m.isoWeekday() >= 6) return true;

  // 2. Resmi veya dini tatil kontrolü (date-holidays)
  const holiday = hd.isHoliday(m.toDate());
  return Boolean(holiday);
};

/**
 * Verilen tarihi bir sonraki açık iş gününe öteler (Hafta sonu veya resmi tatilse döngüyle sonraki güne geçer).
 * Geriye hem formatlı tarihi hem de kaydırma yapılıp yapılmadığı bilgisini döner.
 */
export const getNextBusinessDay = (date: moment.MomentInput = moment()) => {
  const m = moment(date).clone();
  let wasShifted = false;

  while (isNonWorkingDay(m)) {
    m.add(1, "day");
    wasShifted = true;
  }

  return {
    date: m.format("YYYY-MM-DD"),
    momentDate: m,
    wasShifted,
    wasWeekend: wasShifted, // Eski kodlarla geriye dönük uyumluluk için
  };
};

/**
 * Başlangıç tarihi ve gün sayısına göre vade bitiş tarihini hesaplar.
 * Eğer bitiş günü tatile veya hafta sonuna denk gelirse bir sonraki açık iş gününü bulur.
 */
export const calculateMaturityEndDate = (
  startDateStr: string,
  days: number,
) => {
  const targetDate = moment(startDateStr).add(days, "days");
  return getNextBusinessDay(targetDate);
};

/**
 * Vadeli hesap açılışı için T+0 (ilk açık iş günü) ve T+1 (sonraki açık iş günü) valör tarihlerini üretir.
 */
export const getAvailableValors = () => {
  const t0 = getNextBusinessDay(moment());
  const t1 = getNextBusinessDay(t0.momentDate.clone().add(1, "day"));

  return {
    t0Date: t0.date,
    t1Date: t1.date,
  };
};
