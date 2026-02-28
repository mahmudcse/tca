# TCA Architecture Design (Step 3)

Scope baseline: **Option B** (LC1-first implementation, then controlled RISC-V-like migration in 16-bit mode).

## 1) Module Architecture

```text
+---------------------------------------------------------------+
|                           UI LAYER                            |
|                                                               |
|  +-------------------+   +-------------------+                |
|  | CodeEditorView    |   | ControlPanelView  |                |
|  | - source input    |   | - run/step/reset  |                |
|  +---------+---------+   +---------+---------+                |
|            |                       |                          |
|            v                       v                          |
|  +-------------------+   +-------------------+                |
|  | AssemblerParser   |   | AnimationEngine   |                |
|  | - tokenize        |   | - diff snapshots  |                |
|  | - parse labels    |   | - animate signals |                |
|  +---------+---------+   +---------+---------+                |
|            |                       |                          |
|            +-----------+-----------+                          |
|                        v                                      |
|                  +------------+                               |
|                  | Renderer   |                               |
|                  | - registers|                               |
|                  | - memory   |                               |
|                  | - buses    |                               |
|                  +------+-----+                               |
+-------------------------|-------------------------------------+
                          |
                          v
+---------------------------------------------------------------+
|                        CORE SIMULATION                        |
|                                                               |
| +------------------+     +-------------------+                |
| | ClockStepper     |---->| ControlUnit       |                |
| | - tick/step      |     | - fetch/decode/...|                |
| +--------+---------+     +----+----------+---+                |
|          |                    |          |                    |
|          v                    v          v                    |
| +------------------+   +-------------------+                  |
| | InstructionDecoder|   | CPU               |                  |
| | - decode opcode   |   | - regs/flags/pc   |                  |
| +------------------+   +----------+--------+                  |
|                                  |                             |
|                                  v                             |
|                          +---------------+                     |
|                          | Signals/Bus   |                     |
|                          | - AB, DB, ctl |                     |
|                          +-------+-------+                     |
|                                  |                             |
|                                  v                             |
|                              +-------+                         |
|                              |Memory |                         |
|                              +-------+                         |
+---------------------------------------------------------------+
```

## 2) Responsibilities

### Core
- `CPU`
  - Owns architectural state: registers, flags, instruction register, program counter, stack pointer.
  - Applies ALU and register-write operations requested by `ControlUnit`.

- `Memory`
  - Owns word-addressable memory (`0..63` in LC1 mode initially).
  - Handles read/write by address with active `wordLength` masking.

- `SignalsBus`
  - Transient per-microstep values: address bus, data bus, control lines, source/destination tags.
  - Carries values used for visualization and animation.

- `InstructionDecoder`
  - Converts IR/raw word to normalized instruction object.
  - Supports LC1 decode table first; later pluggable decoder for RISC-V-like subset.

- `ControlUnit`
  - Deterministic micro-step state machine.
  - Drives phases: `FETCH -> DECODE -> EXECUTE -> WRITEBACK` (LC1 control simplifications allowed).
  - Emits `microStepInfo` including action semantics.

- `ClockStepper`
  - External control API: `step()`, `run(n)`, `reset()`.
  - Calls `ControlUnit` and publishes step events.

### UI
- `Renderer`
  - Stateless rendering from snapshots (register panel, memory table, bus overlays, ALU blocks).

- `AnimationEngine`
  - Consumes previous/current snapshots + `microStepInfo`.
  - Produces animations for value flow (bus highlight, changed register pulse, memory-cell flash).

- `CodeEditor + AssemblerParser`
  - Source editing, parsing labels, converting mnemonics to internal instruction memory representation.
  - Validation and diagnostics surface (line/column errors).

## 3) Data Contracts

### 3.1 `getState()` snapshot

```ts
type NumberBase = "bin" | "hex" | "dec";
type ArchitectureMode = "lc1" | "riscv16";
type Phase = "fetch" | "decode" | "execute" | "writeback" | "halt";

type RegisterFile = {
  A: number;
  B: number;
  DR: number;
  AR: number;
  IR: number;
  PC: number;
  SP: number;
};

type Flags = {
  SF: 0 | 1;
  OF: 0 | 1;
  ZF?: 0 | 1; // optional in RISC-V-like mode
};

type BusState = {
  AB: number | null;              // address bus
  DB: number | null;              // data bus
  controlLines: string[];         // e.g. ["MEM_READ", "IR_LOAD"]
  source?: string;                // e.g. "PC", "MEMORY[12]"
  destination?: string;           // e.g. "AR", "IR"
};

type DecodedInstruction = {
  raw: number;
  mnemonic: string;
  opcode: number;
  operand?: number;
  rs1?: number;
  rs2?: number;
  rd?: number;
  immediate?: number;
};

type MemoryCell = {
  address: number;
  value: number;
};

type CpuSnapshot = {
  cycle: number;
  microStep: number;
  phase: Phase;
  halted: boolean;
  wordLength: 10 | 16;
  architectureMode: ArchitectureMode;
  displayBase: NumberBase;
  registers: RegisterFile;
  flags: Flags;
  buses: BusState;
  decoded?: DecodedInstruction;
  memoryWindow: MemoryCell[];     // default: addresses 0..63 in LC1 mode
};
```

### 3.2 `step()` behavior

```ts
type StepOptions = {
  micro?: boolean; // true => one micro-step, false/default => one full instruction
};

type StepResult = {
  ok: boolean;
  reason?: "halted" | "decode_error" | "memory_fault" | "invalid_instruction";
  state: CpuSnapshot;
  microStepInfo: MicroStepInfo;
};
```

Behavior contract:
- If CPU is halted, `step()` returns `ok: false`, `reason: "halted"`, state unchanged.
- `step({micro:true})` executes exactly one micro-transition in `ControlUnit`.
- `step()` (default) advances until the end of current instruction (`writeback` complete or halt).
- Every successful step updates cycle/microStep counters and emits `onStep` event.
- All arithmetic and writes must be masked to active `wordLength` (10 or 16).

### 3.3 Event contracts

```ts
type MicroStepInfo = {
  phase: Phase;
  action: string;             // e.g. "PC -> AB", "MEM[AB] -> IR", "ALU ADD", "A <- ALU3"
  touched: string[];          // ids for animation, e.g. ["PC", "AB", "MEMORY", "IR"]
  changedRegisters: string[]; // e.g. ["IR", "PC"]
  changedMemory: number[];    // list of changed addresses
  alu?: {
    op: string;
    in1?: number;
    in2?: number;
    out?: number;
  };
};

type OnStepHandler = (state: CpuSnapshot, microStepInfo: MicroStepInfo) => void;
type OnHaltHandler = (state: CpuSnapshot) => void;
type OnErrorHandler = (error: { code: string; message: string; line?: number }) => void;
```

Core event API:
- `onStep(handler: OnStepHandler): unsubscribeFn`
- `onHalt(handler: OnHaltHandler): unsubscribeFn`
- `onError(handler: OnErrorHandler): unsubscribeFn`

## 4) Execution Flow

1. User edits assembly in `CodeEditorView`.
2. `AssemblerParser` compiles source into memory image + symbol map.
3. Core resets CPU/memory and loads program.
4. User triggers `step()` or `run(n)`.
5. `ClockStepper` calls `ControlUnit` transitions.
6. Core emits `onStep(state, microStepInfo)` after each micro-step or instruction-step (depending mode).
7. `Renderer` updates static values; `AnimationEngine` animates diffs.

## 5) Extension Points

- `InstructionDecoder` strategy pattern:
  - `LC1Decoder` (phase 1 default)
  - `RiscV16Decoder` (phase 2)
- `ControlUnit` profiles:
  - `LC1ControlProfile`
  - `RiscVControlProfile`
- `Formatter` adapters for binary/hex/decimal and 10/16-bit width.

## 6) Explicit Out-of-Scope (for this architecture stage)

- Pipeline hazard simulation and forwarding.
- Caches/MMU/virtual memory.
- Full RISC-V privileged architecture.
- Multi-core or OS runtime behavior.
