// Words that suggest someone may be at risk of harming themselves.
// Used on both client and server so hotlines show before any AI reply.
const RISK_WORDS = [
  "ฆ่าตัวตาย", "อยากตาย", "ไม่อยากอยู่", "ไม่อยากมีชีวิต", "ทำร้ายตัวเอง",
  "กรีดข้อมือ", "จบชีวิต", "ตายไปซะ", "ตายๆไป", "หายไปจากโลก", "กินยาเกินขนาด",
  "suicide", "kill myself", "end my life", "self harm", "self-harm",
];

export function looksAtRisk(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, "");
  return RISK_WORDS.some((w) => t.includes(w.replace(/\s+/g, "")));
}
