export class ArchitectureConfig {
  constructor() {
    this.wordLength = 16;
    this.supportedWordLengths = [10, 16];
    this.displayBase = "bin";
    this.supportedDisplayBases = ["bin", "hex", "dec"];
    this.memorySize = 64;
  }

  setWordLength(bits) {
    if (!this.supportedWordLengths.includes(bits)) {
      throw new Error(`Unsupported word length: ${bits}`);
    }
    this.wordLength = bits;
  }

  setDisplayBase(base) {
    if (!this.supportedDisplayBases.includes(base)) {
      throw new Error(`Unsupported display base: ${base}`);
    }
    this.displayBase = base;
  }
}
