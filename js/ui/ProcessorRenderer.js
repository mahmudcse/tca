import { formatWord } from "./format.js";

export class ProcessorRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.pulseTimer = null;
  }

  renderSkeleton() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ubung-canvas lc1-canvas">
        <div class="bus bus-h wire-ab-top"></div>
        <div class="bus bus-h wire-db-bottom"></div>
        <div class="bus bus-v wire-pc-top" data-path="pc-ab"></div>
        <div class="bus bus-v wire-sp-top"></div>
        <div class="bus bus-v wire-br-bottom"></div>
        <div class="bus bus-v wire-center-bottom" data-path="alu-dr"></div>
        <div class="bus bus-v wire-dr-bottom"></div>
        <div class="bus bus-v wire-ar-top" data-path="ab-memory"></div>
        <div class="bus bus-v wire-ar-memory"></div>
        <div class="bus bus-h wire-ab-to-ia"></div>
        <div class="bus bus-h wire-memory-left" data-path="memory-ir"></div>
        <div class="bus bus-v wire-int-top"></div>
        <div class="bus bus-v wire-memory-dr"></div>
        <div class="bus bus-v wire-a-to-alu" data-path="a-alu"></div>
        <div class="bus bus-v wire-b-to-alu" data-path="b-alu"></div>
        <div class="bus bus-v wire-a-dr" data-path="a-dr"></div>
        <div class="bus bus-v wire-b-dr" data-path="b-dr"></div>
        <div class="bus bus-v wire-control-br" data-path="ir-control"></div>
        <div class="bus bus-h wire-control-join" data-path="control-dr"></div>
        <div class="bus bus-h wire-dr-join" data-path="dr-memory"></div>
        <div class="bus bus-h wire-dr-a" data-path="dr-a"></div>
        <div class="bus bus-h wire-dr-b" data-path="dr-b"></div>
        <span class="tap t-pc-top"></span>
        <span class="tap t-sp-top"></span>
        <span class="tap t-ar-top"></span>
        <span class="tap t-int-top"></span>
        <span class="tap t-ar-right-top"></span>
        <span class="tap t-br-bottom"></span>
        <span class="tap t-center-bottom"></span>
        <span class="tap t-dr-bottom"></span>
        <span class="tap t-a-down"></span>
        <span class="tap t-b-down"></span>
        <span class="tap t-of"></span>

        <div class="label-ab">AB</div>
        <div class="label-db">DB</div>

        <section class="lc1-block reg-box pc-box">
          <span class="reg-name">PC</span>
          <div class="bit-row" data-key="PCBITS"></div>
        </section>

        <section class="lc1-block reg-box sp-box">
          <span class="reg-name">SP</span>
          <div class="bit-row" data-key="SPBITS"></div>
        </section>

        <section class="lc1-block control-shape">CONTROL</section>

        <section class="lc1-block reg-box br-box">
          <span class="reg-name">BR</span>
          <div class="bit-row split" data-key="BRBITS"></div>
        </section>

        <section class="lc1-block ab-box">
          <div class="ab-rows">
            <span>A</span>
            <span>B</span>
          </div>
          <div class="ab-values">
            <div class="bit-row" data-key="ABITS"></div>
            <div class="bit-row" data-key="BBITS"></div>
          </div>
        </section>

        <div class="ia-label">IA</div>
        <section class="lc1-block int-box-split">
          <div class="dash-line"></div>
          <div class="int-text">INT</div>
        </section>

        <section class="lc1-block reg-box ar-box">
          <span class="reg-name">AR</span>
          <div class="bit-row" data-key="ARBITS"></div>
        </section>

        <section class="lc1-block memory-box-drawn">MEMORY</section>

        <section class="lc1-block reg-box dr-box">
          <span class="reg-name">DR</span>
          <div class="bit-row" data-key="DRBITS"></div>
        </section>

        <section class="lc1-block alu-shape">
          <span class="alu-text">ALU</span>
          <div class="of-wrap">
            <div class="bit-row single" data-key="OFBIT"></div>
            <span class="of-text">OF</span>
          </div>
        </section>

        <div class="diagram-meta">
          <span data-key="PHASE">idle</span>
          <span data-key="CONTROL">IDLE</span>
          <span data-key="MEMWIN">00:0 01:0 02:0 03:0</span>
        </div>
      </div>
    `;
  }

  update(state) {
    if (!this.container) return;

    const cpu = state.cpu;
    const regs = cpu.registers;
    const flags = cpu.flags;
    const buses = cpu.buses;
    const memory = state.memory;
    const base = state.config.displayBase;
    const bits = state.config.wordLength;

    this.setBits("ABITS", regs.A, bits, 10);
    this.setBits("BBITS", regs.B, bits, 10);
    this.setBits("DRBITS", regs.DR, bits, 10);
    this.setBits("BRBITS", regs.DR, bits, 10, true);
    this.setBits("PCBITS", regs.PC, bits, 6);
    this.setBits("SPBITS", regs.SP, bits, 6);
    this.setBits("ARBITS", regs.AR, bits, 6);
    this.setBits("OFBIT", flags.OF, 1, 1);

    this.setValue("CONTROL", buses.control);
    this.setValue("PHASE", state.meta.phase);
    this.setValue("MEMWIN", this.formatMemoryWindow(memory, bits, base));

    this.pulsePaths(buses.activePaths || []);
  }

  setValue(key, value) {
    const node = this.container.querySelector(`[data-key="${key}"]`);
    if (!node) return;
    node.textContent = String(value);
  }

  formatBusValue(value, bits, base, signed = false) {
    if (value === null || value === undefined) {
      return "-";
    }
    return formatWord(value, bits, base, { signed });
  }

  formatMemoryWindow(memory, bits, base) {
    const cells = [8, 9, 10, 11].map((address) => {
      return `${String(address).padStart(2, "0")}:${formatWord(memory[address], bits, base)}`;
    });
    return cells.join("  ");
  }

  setBits(key, value, sourceBits, shownBits, splitAfterFour = false) {
    const row = this.container.querySelector(`[data-key="${key}"]`);
    if (!row) return;

    const numeric = Number.isFinite(value) ? value : 0;
    const bitString = this.toBitString(numeric, sourceBits, shownBits);

    row.innerHTML = "";
    for (let i = 0; i < bitString.length; i += 1) {
      const bit = document.createElement("span");
      bit.className = `bit${bitString[i] === "1" ? " on" : ""}`;
      if (splitAfterFour && i === 4) {
        bit.classList.add("gap");
      }
      row.appendChild(bit);
    }
  }

  toBitString(value, sourceBits, shownBits) {
    const normalizedBits = Math.max(1, Number(sourceBits) || 1);
    const normalizedShown = Math.max(1, Number(shownBits) || 1);
    const mask = normalizedBits >= 32 ? 0xffffffff : (1 << normalizedBits) - 1;
    const unsigned = value & mask;
    const full = unsigned.toString(2).padStart(normalizedBits, "0");
    return full.slice(-normalizedShown).padStart(normalizedShown, "0");
  }

  pulsePaths(paths) {
    const buses = this.container.querySelectorAll(".bus");
    buses.forEach((line) => line.classList.remove("active"));

    for (const path of paths) {
      const line = this.container.querySelector(`[data-path="${path}"]`);
      if (line) {
        line.classList.add("active");
      }
    }

    if (this.pulseTimer) {
      clearTimeout(this.pulseTimer);
    }

    this.pulseTimer = setTimeout(() => {
      const active = this.container.querySelectorAll(".bus.active");
      active.forEach((line) => line.classList.remove("active"));
    }, 380);
  }
}
