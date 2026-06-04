export function formatNumber(num: number | string, locale: string): string {
  if (num === null || num === undefined) return "";
  
  if (locale === 'ar') {
    if (typeof num === 'number') {
      return num.toLocaleString('ar-EG');
    }
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (w) => arabicNumbers[parseInt(w)]);
  }
  
  return String(num);
}
