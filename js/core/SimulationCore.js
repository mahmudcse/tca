import { CPU } from "./CPU.js";
import { Memory } from "./Memory.js";
import { InstructionDecoder } from "./InstructionDecoder.js";
import { AssemblerParser } from "./AssemblerParser.js";

export class SimulationCore {
  constructor(config) {
    this.config = config;
    this.listeners = [];
    this.stepListeners = [];

    this.cpu = new CPU(this.config.wordLength);
    this.memory = new Memory(this.config.memorySize, this.config.wordLength);
    this.decoder = new InstructionDecoder();
    this.parser = new AssemblerParser();

    this.program = [];
    this.lastAction = "Not started";
    this.currentPhase = "idle";
  }

  onStateChange(listener) {
    this.listeners.push(listener);
  }

  onStep(listener) {
    this.stepListeners.push(listener);
  }

  notifyStateChange() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  notifyStep(microStepInfo) {
    const state = this.getState();
    for (const listener of this.stepListeners) {
      listener(state, microStepInfo);
    }
  }

  setDisplayBase(base) {
    this.config.setDisplayBase(base);
    this.notifyStateChange();
  }

  setWordLength(bits) {
    this.validateProgramConstraints(this.program, bits);

    this.config.setWordLength(bits);
    this.cpu.setWordLength(bits);
    this.memory.setWordLength(bits);
    this.rewriteProgramImage();
    this.lastAction = `Word length switched to ${bits}-bit`;
    this.notifyStateChange();
  }

  loadTinyProgram() {
    const source = [
      "LDI A, 2",
      "LDI B, 3",
      "ADD A, B",
      "STORE A, 10",
      "HLT",
    ].join("\n");
    return this.loadProgram(source);
  }

  loadProgram(sourceCode) {
    const parsed = this.parser.parse(sourceCode);
    if (parsed.length > this.config.memorySize) {
      throw new Error(`Program too large: ${parsed.length} instructions (max ${this.config.memorySize})`);
    }

    this.validateProgramConstraints(parsed, this.config.wordLength);

    this.reset();
    this.program = parsed;
    this.rewriteProgramImage();

    this.lastAction = `Program loaded (${parsed.length} instructions)`;
    this.currentPhase = "ready";
    this.notifyStateChange();
    return { ok: true, count: parsed.length };
  }

  runUntilHalt(maxSteps = 256) {
    for (let i = 0; i < maxSteps; i += 1) {
      if (this.cpu.halted) {
        return this.getState();
      }

      const result = this.step();
      if (!result.ok && result.reason !== "halted") {
        throw new Error(`Execution failed: ${result.reason}`);
      }

      if (result.state.cpu.halted) {
        return result.state;
      }
    }

    throw new Error(`Execution did not halt within ${maxSteps} steps`);
  }

  validateProgramConstraints(program, bits) {
    const minSigned = -(1 << (bits - 1));
    const maxSigned = (1 << (bits - 1)) - 1;

    for (let i = 0; i < program.length; i += 1) {
      const instruction = program[i];

      if (instruction.op === "LDI") {
        if (instruction.value < minSigned || instruction.value > maxSigned) {
          throw new Error(
            `Instruction ${i}: immediate ${instruction.value} does not fit signed ${bits}-bit range (${minSigned}..${maxSigned})`,
          );
        }
      }

      if (["STORE", "LOAD", "JMP", "JZ"].includes(instruction.op)) {
        const address = instruction.address;
        if (address < 0 || address >= this.config.memorySize) {
          throw new Error(
            `Instruction ${i}: address ${address} out of range (0..${this.config.memorySize - 1})`,
          );
        }
      }
    }
  }

  rewriteProgramImage() {
    for (let i = 0; i < this.program.length; i += 1) {
      this.memory.write(i, this.encodeInstruction(this.program[i]));
    }
  }

  encodeInstruction(instruction) {
    const payloadBits = this.config.wordLength - 4;
    const payloadMask = (1 << payloadBits) - 1;
    const opcodeShift = payloadBits;
    let opcode = 0;
    let operandCode = 0;

    switch (instruction.op) {
      case "LDI": {
        const regBit = instruction.reg === "B" ? 1 : 0;
        const immBits = payloadBits - 1;
        const immMask = (1 << immBits) - 1;
        opcode = 1;
        operandCode = (regBit << immBits) | (this.cpu.maskValue(instruction.value) & immMask);
        break;
      }
      case "ADD": {
        const destBit = instruction.dest === "B" ? 1 : 0;
        const srcBit = instruction.src === "B" ? 1 : 0;
        opcode = 2;
        operandCode = (destBit << 1) | srcBit;
        break;
      }
      case "STORE": {
        const regBit = instruction.reg === "B" ? 1 : 0;
        opcode = 3;
        operandCode = (regBit << 6) | (instruction.address & 0x3f);
        break;
      }
      case "LOAD": {
        const regBit = instruction.reg === "B" ? 1 : 0;
        opcode = 4;
        operandCode = (regBit << 6) | (instruction.address & 0x3f);
        break;
      }
      case "JMP":
        opcode = 5;
        operandCode = instruction.address & 0x3f;
        break;
      case "JZ": {
        const regBit = instruction.reg === "B" ? 1 : 0;
        opcode = 6;
        operandCode = (regBit << 6) | (instruction.address & 0x3f);
        break;
      }
      case "HLT":
        opcode = 15;
        operandCode = 0;
        break;
      default:
        opcode = 0;
        operandCode = 0;
    }

    const encoded = (opcode << opcodeShift) | (operandCode & payloadMask);
    return this.cpu.maskValue(encoded);
  }

  reset() {
    this.cpu.reset();
    this.memory.reset();
    if (this.program.length > 0) {
      this.rewriteProgramImage();
    }
    this.lastAction = "Reset";
    this.currentPhase = "idle";
    this.notifyStateChange();
  }

  getState() {
    return {
      cpu: {
        registers: { ...this.cpu.registers },
        flags: { ...this.cpu.flags },
        buses: { ...this.cpu.buses },
        halted: this.cpu.halted,
        cycle: this.cpu.cycle,
      },
      program: this.program.map((instruction, index) => ({
        address: index,
        instruction,
      })),
      memory: this.memory.snapshot(),
      config: {
        wordLength: this.config.wordLength,
        displayBase: this.config.displayBase,
        memorySize: this.config.memorySize,
      },
      meta: {
        lastAction: this.lastAction,
        phase: this.currentPhase,
      },
    };
  }

  step() {
    if (this.cpu.halted) {
      this.lastAction = "CPU is halted";
      this.currentPhase = "halt";
      this.notifyStateChange();
      return { ok: false, reason: "halted", state: this.getState() };
    }

    const pc = this.cpu.registers.PC;
    const instruction = this.program[pc];
    if (!instruction) {
      this.cpu.halted = true;
      this.currentPhase = "halt";
      this.lastAction = `No instruction at PC=${pc}; halting`;
      this.notifyStateChange();
      return { ok: false, reason: "no_instruction", state: this.getState() };
    }

    const decoded = this.decoder.decode(instruction);

    this.currentPhase = "fetch";
    this.cpu.registers.AR = pc;
    this.cpu.registers.DR = this.memory.read(pc);
    this.cpu.registers.IR = decoded.op;
    this.cpu.setBusState({
      AB: pc,
      DB: this.cpu.registers.DR,
      control: "FETCH",
      activePaths: ["pc-ab", "ab-memory", "memory-ir"],
    });

    let microStepInfo = {
      phase: "execute",
      action: "",
      touched: ["PC", "AR", "IR", "DR"],
      activePaths: ["pc-ab", "ab-memory", "memory-ir"],
    };

    this.currentPhase = "execute";

    switch (decoded.op) {
      case "LDI": {
        const immediate = decoded.value;
        this.writeRegister(decoded.reg, immediate);
        this.cpu.registers.DR = this.cpu.maskValue(immediate);
        this.cpu.setBusState({
          AB: pc,
          DB: this.cpu.registers.DR,
          control: "EXEC_LDI",
          activePaths: ["ir-control", "control-dr", `dr-${decoded.reg.toLowerCase()}`],
        });
        microStepInfo = {
          phase: "execute",
          action: `${decoded.reg} <- ${decoded.value}`,
          touched: ["IR", "DR", decoded.reg],
          activePaths: ["ir-control", "control-dr", `dr-${decoded.reg.toLowerCase()}`],
        };
        this.cpu.registers.PC += 1;
        break;
      }
      case "ADD": {
        const lhs = this.readRegister(decoded.dest);
        const rhs = this.readRegister(decoded.src);
        const full = lhs + rhs;
        const masked = this.cpu.maskValue(full);
        this.writeRegister(decoded.dest, masked);
        this.cpu.registers.DR = masked;
        this.cpu.updateFlagsFromValue(masked, full !== masked);
        this.cpu.setBusState({
          AB: pc,
          DB: masked,
          control: "EXEC_ADD",
          activePaths: [
            `${decoded.dest.toLowerCase()}-alu`,
            `${decoded.src.toLowerCase()}-alu`,
            "alu-dr",
            `dr-${decoded.dest.toLowerCase()}`,
          ],
        });
        microStepInfo = {
          phase: "execute",
          action: `${decoded.dest} <- ${decoded.dest} + ${decoded.src}`,
          touched: ["IR", decoded.dest, decoded.src, "DR", "ALU"],
          activePaths: [
            `${decoded.dest.toLowerCase()}-alu`,
            `${decoded.src.toLowerCase()}-alu`,
            "alu-dr",
            `dr-${decoded.dest.toLowerCase()}`,
          ],
          alu: { op: "ADD", in1: lhs, in2: rhs, out: masked },
        };
        this.cpu.registers.PC += 1;
        break;
      }
      case "STORE": {
        const value = this.readRegister(decoded.reg);
        this.cpu.registers.AR = decoded.address;
        this.cpu.registers.DR = value;
        this.memory.write(decoded.address, value);
        this.currentPhase = "writeback";
        this.cpu.setBusState({
          AB: decoded.address,
          DB: value,
          control: "MEM_WRITE",
          activePaths: [`${decoded.reg.toLowerCase()}-dr`, "dr-memory"],
        });
        microStepInfo = {
          phase: "writeback",
          action: `MEM[${decoded.address}] <- ${decoded.reg}`,
          touched: ["IR", "AR", "DR", decoded.reg, `MEM[${decoded.address}]`],
          activePaths: [`${decoded.reg.toLowerCase()}-dr`, "dr-memory"],
        };
        this.cpu.registers.PC += 1;
        break;
      }
      case "LOAD": {
        this.cpu.registers.AR = decoded.address;
        const value = this.memory.read(decoded.address);
        this.cpu.registers.DR = value;
        this.writeRegister(decoded.reg, value);
        this.cpu.setBusState({
          AB: decoded.address,
          DB: value,
          control: "MEM_READ",
          activePaths: ["ab-memory", "memory-ir", "control-dr", `dr-${decoded.reg.toLowerCase()}`],
        });
        microStepInfo = {
          phase: "execute",
          action: `${decoded.reg} <- MEM[${decoded.address}]`,
          touched: ["IR", "AR", "DR", decoded.reg, `MEM[${decoded.address}]`],
          activePaths: ["ab-memory", "memory-ir", "control-dr", `dr-${decoded.reg.toLowerCase()}`],
        };
        this.cpu.registers.PC += 1;
        break;
      }
      case "JMP": {
        this.cpu.registers.PC = decoded.address;
        this.cpu.setBusState({
          AB: decoded.address,
          DB: decoded.address,
          control: "JMP",
          activePaths: ["ir-control", "pc-ab"],
        });
        microStepInfo = {
          phase: "execute",
          action: `PC <- ${decoded.address}`,
          touched: ["IR", "PC"],
          activePaths: ["ir-control", "pc-ab"],
        };
        break;
      }
      case "JZ": {
        const regValue = this.readRegister(decoded.reg);
        const taken = regValue === 0;
        this.cpu.registers.PC = taken ? decoded.address : this.cpu.registers.PC + 1;
        this.cpu.setBusState({
          AB: this.cpu.registers.PC,
          DB: regValue,
          control: taken ? "BRANCH_TAKEN" : "BRANCH_NOT_TAKEN",
          activePaths: ["ir-control", `${decoded.reg.toLowerCase()}-alu`, "pc-ab"],
        });
        microStepInfo = {
          phase: "execute",
          action: taken ? `JZ ${decoded.reg} taken -> ${decoded.address}` : `JZ ${decoded.reg} not taken`,
          touched: ["IR", decoded.reg, "PC"],
          activePaths: ["ir-control", `${decoded.reg.toLowerCase()}-alu`, "pc-ab"],
        };
        break;
      }
      case "HLT": {
        this.cpu.halted = true;
        this.currentPhase = "halt";
        this.cpu.setBusState({
          AB: null,
          DB: null,
          control: "HALT",
          activePaths: ["ir-control"],
        });
        microStepInfo = {
          phase: "halt",
          action: "HALT",
          touched: ["IR", "CONTROL"],
          activePaths: ["ir-control"],
        };
        break;
      }
      default:
        throw new Error(`Unsupported instruction: ${decoded.op}`);
    }

    this.cpu.registers.PC = this.cpu.maskValue(this.cpu.registers.PC);
    this.cpu.registers.AR = this.cpu.maskValue(this.cpu.registers.AR);
    this.cpu.registers.DR = this.cpu.maskValue(this.cpu.registers.DR);
    this.cpu.registers.SP = this.cpu.maskValue(this.cpu.registers.SP);

    this.cpu.cycle += 1;
    this.lastAction = microStepInfo.action;

    const snapshot = this.getState();
    console.log("[STEP]", {
      cycle: snapshot.cpu.cycle,
      pc: snapshot.cpu.registers.PC,
      ir: snapshot.cpu.registers.IR,
      A: snapshot.cpu.registers.A,
      B: snapshot.cpu.registers.B,
      mem10: snapshot.memory[10],
      bus: snapshot.cpu.buses,
      action: snapshot.meta.lastAction,
      bits: snapshot.config.wordLength,
    });

    this.notifyStateChange();
    this.notifyStep(microStepInfo);

    return { ok: true, state: snapshot, microStepInfo };
  }

  writeRegister(name, value) {
    if (!(name in this.cpu.registers)) {
      throw new Error(`Unknown register: ${name}`);
    }
    this.cpu.registers[name] = this.cpu.maskValue(value);
  }

  readRegister(name) {
    if (!(name in this.cpu.registers)) {
      throw new Error(`Unknown register: ${name}`);
    }
    return this.cpu.registers[name];
  }
}
