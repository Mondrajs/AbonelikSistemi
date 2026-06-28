import { useUserStore } from '@/store/useUserStore';

export const convertToTry = (price: number, currency: string = 'TRY'): number => {
  const fromCur = (currency || 'TRY').toUpperCase();
  const baseCurrency = useUserStore.getState().notifications.baseCurrency ?? 'TRY';
  const toCur = baseCurrency.toUpperCase();
  
  if (fromCur === toCur) return price;
  
  const usdRate = useUserStore.getState().notifications.usdRate ?? 33;
  const eurRate = useUserStore.getState().notifications.eurRate ?? 35;
  
  // 1. First convert from input currency to TRY
  let priceInTry = price;
  if (fromCur === 'USD') {
    priceInTry = price * usdRate;
  } else if (fromCur === 'EUR') {
    priceInTry = price * eurRate;
  }
  
  // 2. Then convert from TRY to target baseCurrency
  if (toCur === 'TRY') {
    return priceInTry;
  } else if (toCur === 'USD') {
    return priceInTry / usdRate;
  } else if (toCur === 'EUR') {
    return priceInTry / eurRate;
  }
  
  return priceInTry;
};

export const getCurrencySymbol = (currency: string = 'TRY'): string => {
  const cur = (currency || 'TRY').toUpperCase();
  if (cur === 'USD') return '$';
  if (cur === 'EUR') return '€';
  return '₺';
};
