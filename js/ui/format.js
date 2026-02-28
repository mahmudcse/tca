export function maskForBits(bits) {
  return (1 << bits) - 1;
}

export function toSignedWord(value, bits) {
  const masked = value & maskForBits(bits);
  const signBit = 1 << (bits - 1);
  if ((masked & signBit) === 0) {
    return masked;
  }
  return masked - (1 << bits);
}

export function formatWord(value, bits, base, options = {}) {
  const signed = options.signed === true;
  const masked = value & maskForBits(bits);

  if (base === "bin") {
    return masked.toString(2).padStart(bits, "0");
  }

  if (base === "hex") {
    const width = Math.ceil(bits / 4);
    return `0x${masked.toString(16).toUpperCase().padStart(width, "0")}`;
  }

  if (base === "dec") {
    return String(signed ? toSignedWord(masked, bits) : masked);
  }

  return String(masked);
}
