const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const FINAL_CONSONANT_COUNT = 28;

export function getHangulObjectParticle(text: string) {
  const lastChar = [...text.trim()].at(-1);
  if (!lastChar) {
    return "을";
  }

  const code = lastChar.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) {
    return "을";
  }

  return (code - HANGUL_BASE) % FINAL_CONSONANT_COUNT === 0 ? "를" : "을";
}
