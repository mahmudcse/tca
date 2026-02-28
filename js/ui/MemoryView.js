import { formatWord } from "./format.js";

export class MemoryView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  renderSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `<pre class="plain-output" id="memory-state-output"></pre>`;
  }

  update(state) {
    if (!this.container) return;
    const out = this.container.querySelector("#memory-state-output");
    if (!out) return;

    const memoryState = state.memory;
    const program = state.program;
    const bits = state.config.wordLength;
    const base = state.config.displayBase;

    const header = `Address : Value (${base}, ${bits}-bit)`;
    const rows = memoryState.slice(0, 16).map((value, address) => {
      const formatted = formatWord(value, bits, base);
      return `${String(address).padStart(2, "0")}      : ${formatted}`;
    });

    const programRows = program.map((entry) => {
      return `${entry.address}: ${formatInstruction(entry.instruction)}`;
    });

    out.textContent = [header, ...rows, "", "Program Memory:", ...programRows].join("\n");
  }
}

function formatInstruction(instruction) {
  if (!instruction) return "(empty)";
  if (instruction.op === "LDI") return `LDI ${instruction.reg}, ${instruction.value}`;
  if (instruction.op === "ADD") return `ADD ${instruction.dest}, ${instruction.src}`;
  if (instruction.op === "LOAD") return `LOAD ${instruction.reg}, [${instruction.address}]`;
  if (instruction.op === "STORE") return `STORE ${instruction.reg}, [${instruction.address}]`;
  if (instruction.op === "JMP") return `JMP ${instruction.address}`;
  if (instruction.op === "JZ") return `JZ ${instruction.reg}, ${instruction.address}`;
  return instruction.op;
}
