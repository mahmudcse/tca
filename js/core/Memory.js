export class Memory {
  constructor(size, wordLength) {
    this.size = size;
    this.wordLength = wordLength;
    this.cells = new Array(size).fill(0);
  }

  setWordLength(bits) {
    this.wordLength = bits;
    this.cells = this.cells.map((value) => this.maskValue(value));
  }

  maskValue(value) {
    return value & ((1 << this.wordLength) - 1);
  }

  reset() {
    this.cells.fill(0);
  }

  read(address) {
    this.assertAddress(address);
    return this.cells[address];
  }

  write(address, value) {
    this.assertAddress(address);
    this.cells[address] = this.maskValue(value);
  }

  snapshot() {
    return this.cells.slice();
  }

  assertAddress(address) {
    if (!Number.isInteger(address) || address < 0 || address >= this.size) {
      throw new Error(`Invalid memory address: ${address}`);
    }
  }
}
