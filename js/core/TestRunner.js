import { getDemoById } from "./DemoPrograms.js";

export class TestRunner {
  constructor(core) {
    this.core = core;
  }

  runDemoById(id) {
    const demo = getDemoById(id);
    if (!demo) {
      throw new Error(`Unknown demo: ${id}`);
    }

    this.core.loadProgram(demo.source);
    return this.core.runUntilHalt();
  }

  runAll(demos) {
    const results = [];

    for (const demo of demos) {
      try {
        const finalState = this.runDemoById(demo.id);
        const assertions = assertExpected(finalState, demo.expected, this.core.config.wordLength);
        results.push({ id: demo.id, name: demo.name, pass: assertions.pass, details: assertions.details });
      } catch (error) {
        results.push({ id: demo.id, name: demo.name, pass: false, details: [error.message] });
      }
    }

    return {
      passCount: results.filter((item) => item.pass).length,
      total: results.length,
      results,
    };
  }
}

function assertExpected(state, expected, bits) {
  const details = [];
  const failures = [];
  const mask = (1 << bits) - 1;

  if (typeof expected.halted === "boolean") {
    if (state.cpu.halted !== expected.halted) {
      failures.push(`halted expected ${expected.halted}, got ${state.cpu.halted}`);
    } else {
      details.push(`halted=${state.cpu.halted}`);
    }
  }

  if (expected.registers) {
    for (const [register, expectedValue] of Object.entries(expected.registers)) {
      const actual = state.cpu.registers[register];
      const normalizedExpected = expectedValue < 0 ? (expectedValue & mask) : expectedValue;
      if (actual !== normalizedExpected) {
        failures.push(`register ${register} expected ${normalizedExpected}, got ${actual}`);
      } else {
        details.push(`${register}=${actual}`);
      }
    }
  }

  if (expected.memory) {
    for (const [addrText, expectedValue] of Object.entries(expected.memory)) {
      const address = Number.parseInt(addrText, 10);
      const actual = state.memory[address];
      const normalizedExpected = expectedValue < 0 ? (expectedValue & mask) : expectedValue;
      if (actual !== normalizedExpected) {
        failures.push(`memory[${address}] expected ${normalizedExpected}, got ${actual}`);
      } else {
        details.push(`M[${address}]=${actual}`);
      }
    }
  }

  return {
    pass: failures.length === 0,
    details: failures.length === 0 ? details : failures,
  };
}
