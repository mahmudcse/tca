# Requirements + Glossary

## 1) Feature Prioritization

### MVP
- Web app in plain HTML/CSS/JS with modular codebase (`simulation core` separated from `UI`).
- LC1-style visual processor surface matching the Übung layout style (registers, buses, ALU, memory, prompt area).
- Assembly editor/prompt for entering code and running step-by-step execution.
- Memory visualization for addresses `0..63` with binary values.
- CPU state live update while executing instructions.
- Animation of value flow (register/bus/ALU/memory changes).
- Word-length mode switch: `10-bit` and `16-bit` with functional impact on data width and operations.
- Numeric display toggle: binary mandatory, hexadecimal/decimal optional views.
- Fetch/Execute cycle visualization.

### Nice-to-have
- Breakpoint support (`Bpt`) and pause/resume controls.
- Execution speed slider and single-cycle micro-step mode.
- Highlight changed bits/cells each cycle.
- Instruction decode panel (opcode, operand, mnemonic).
- Import/export assembly examples.
- Prebuilt demo programs for first-semester exercises.

### Later
- Full RISC-V teaching mode (beyond LC1 compatibility subset).
- Multi-architecture lesson packs (LC1 legacy mode + RISC-V mode).
- Assessment mode (auto-check expected register/memory states).
- Timeline/replay of execution history.
- Internationalization (German/English UI switch).

---

## 2) UI Elements from Übung Interface (Names + What They Show)

- `Processor architecture diagram`: visual blocks for CPU, ALU, memory, registers, control, and buses.
- `AB/DB bridge area`: connection between `Address Bus (AB)` and `Data Bus (DB)` (used by specific instructions such as call/return behavior in LC1 docs).
- `Register panel`: values of core registers in current word length.
- `A register`: accumulator value.
- `B register`: secondary operand register.
- `DR register`: data register.
- `AR register`: address register.
- `IR register`: instruction register.
- `PC register`: program counter.
- `SP register`: stack pointer.
- `Flags area`: at least `SF` and `OF`.
- `CONTROL panel`: current control signals/state.
- `ALU panel`: ALU inputs/outputs and operation selection.
- `INT field`: interrupt-related status/value (as shown in legacy UI labels).
- `MEMORY panel`: current memory content.
- `Memory table`: columns `adr`, `opc`, `dec`, `bin`.
- `Mnemonic/instruction list`: supported instruction names.
- `Prompt/editor (">_")`: assembly input and run trigger.
- `Execution status`: running/paused/halted and current phase/cycle.

---

## 3) CPU State Variables Required for Visualization

### Core architectural state
- `PC`, `IR`, `AR`, `DR`, `A`, `B`, `SP`.
- `MEM[0..63]` (at least in LC1-compatible mode).
- `Current instruction` (mnemonic + opcode + operand).

### ALU and flags
- `ALU1`, `ALU2`, `ALU3` (or equivalent input/output signals).
- `OF` (overflow flag).
- `SF` (sign/status flag used in LC1 behavior).
- `Active ALU operation`.

### Control and bus state
- `Control unit phase` (`Fetch` / `Execute`).
- `Micro-step index` (if step-by-step internal sequencing is shown).
- `AB` (address bus value).
- `DB` (data bus value).
- `Bus transfer direction` (read/write, source -> destination).
- `Halt/Run state`.
- `Breakpoint/Interrupt indicators` (if enabled).

### Mode/config state
- `Word length mode` (`10-bit` or `16-bit`).
- `Display mode` (`bin`, `hex`, `dec`).
- `Architecture mode` (`LC1-compatible` vs `RISC-V direction`).

---

## 4) Instruction-Set Requirements (LC1 Baseline vs RISC-V Direction)

### LC1 baseline requirements (must support first)
- Keep legacy-teaching compatibility with the LC1 core behavior.
- Include documented LC1-style instructions (from Übung docs), including:
  - `LDA adr`, `LDB adr`, `MOV adr`, `MAB`
  - `ADD`, `SUB`, `AND`, `NOT`
  - `JMP`, `JPS`, `JPO`
  - `CAL`, `RET`
  - `RRA n`, `RLA n`
  - `HLT`
- Keep visible semantics for flag effects (`SF`, `OF`) per instruction.
- Preserve LC1-style memory-addressed workflow for beginner teaching.

### RISC-V direction requirements (next layer)
- Introduce a RISC-V-inspired instruction model in `16-bit` mode while preserving educational clarity.
- Keep cycle visualization explicit (fetch/decode/execute/memory/writeback).
- Support register-based operations and branch/jump semantics in a simplified teaching subset.
- Define and document exact subset before implementation freeze (e.g., arithmetic, logical, load/store, branch, jump).
- Ensure mode switch does not break LC1 mode behavior.

### Compatibility policy
- `10-bit mode`: LC1-compatible behavior is the reference.
- `16-bit mode`: RISC-V-direction behavior is allowed, but must remain transparent and teachable with visible internal state transitions.

---

## Glossary

- `LC1`: legacy teaching processor used in the original Chemnitz simulator context.
- `RISC-V direction`: migration path toward a modern, reduced-instruction teaching architecture model.
- `Word length`: number of bits per data word/instruction field (`10` or `16`).
- `Register`: small fast storage in CPU (`A`, `B`, `PC`, etc.).
- `PC (Program Counter)`: address of next instruction.
- `IR (Instruction Register)`: currently decoded/executing instruction.
- `AR (Address Register)`: active memory address register.
- `DR (Data Register)`: memory transfer data register.
- `SP (Stack Pointer)`: stack top pointer.
- `ALU`: arithmetic logic unit executing arithmetic/logic ops.
- `ALU1/ALU2/ALU3`: ALU input/output signal values shown in teaching view.
- `SF`: sign/status flag (LC1-specific teaching flag behavior).
- `OF`: overflow flag.
- `AB (Address Bus)`: carries memory addresses.
- `DB (Data Bus)`: carries data values.
- `Fetch phase`: instruction read from memory.
- `Execute phase`: instruction operation performed.
- `Opcode`: instruction operation code field.
- `Mnemonic`: readable instruction name (e.g., `ADD`).
- `Breakpoint (Bpt)`: execution stop marker for debugging/teaching.
- `Prompt/editor`: input area where students write assembly code.
