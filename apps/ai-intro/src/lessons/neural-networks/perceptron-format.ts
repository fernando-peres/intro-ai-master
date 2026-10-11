/** Fixed-precision number with a true minus sign, e.g. −0.30. */
export const signed = (v: number, digits = 2) => {
  const text = Math.abs(v).toFixed(digits)
  return v < 0 && Number(text) !== 0 ? `−${text}` : text
}

/** `+ 0.10` / `− 0.10`, for the next term of a sum. */
export const term = (v: number, digits = 2) =>
  `${v < 0 && Number(Math.abs(v).toFixed(digits)) !== 0 ? "−" : "+"} ${Math.abs(v).toFixed(digits)}`
