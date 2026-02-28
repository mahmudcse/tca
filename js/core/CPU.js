export class CPU {
  constructor(wordLength) {
    this.wordLength = wordLength;
    this.reset();
  }

  reset() {
    this.registers = {
      A: 0,
      B: 0,
      DR: 0,
      AR: 0,
      IR: "NOP",
      PC: 0,
      SP: 63,
    };
    this.flags = {
      SF: 0,
      OF: 0,
    };
    this.halted = false;
    this.cycle = 0;
    this.buses = {
      AB: null,
      DB: null,
      control: "IDLE",
      activePaths: [],
    };
  }

  setWordLength(bits) {
    this.wordLength = bits;
    this.maskRegisters();
  }

  mask() {
    return (1 << this.wordLength) - 1;
  }

  maskValue(value) {
    return value & this.mask();
  }

  maskRegisters() {
    const names = ["A", "B", "DR", "AR", "PC", "SP"];
    for (const name of names) {
      this.registers[name] = this.maskValue(this.registers[name]);
    }
  }

  setBusState({ AB = null, DB = null, control = "IDLE", activePaths = [] } = {}) {
    this.buses = { AB, DB, control, activePaths };
  }

  updateFlagsFromValue(value, overflow) {
    const masked = this.maskValue(value);
    const signBit = 1 << (this.wordLength - 1);
    this.flags.SF = (masked & signBit) !== 0 ? 1 : 0;
    this.flags.OF = overflow ? 1 : 0;
  }
}
