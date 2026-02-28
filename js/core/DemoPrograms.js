export const DEMO_PROGRAMS = [
  {
    id: "demo1",
    name: "Demo 1 - Basic Add",
    source: `LDI A, 2\nLDI B, 3\nADD A, B\nSTORE A, 10\nHLT`,
    expected: {
      registers: { A: 5, B: 3 },
      memory: { 10: 5 },
      halted: true,
    },
  },
  {
    id: "demo2",
    name: "Demo 2 - Load/Store",
    source: `LDI A, 12\nSTORE A, 20\nLDI A, 0\nLOAD B, 20\nHLT`,
    expected: {
      registers: { A: 0, B: 12 },
      memory: { 20: 12 },
      halted: true,
    },
  },
  {
    id: "demo3",
    name: "Demo 3 - Branch Taken",
    source: `LDI A, 0\nJZ A, 4\nLDI B, 9\nJMP 5\nLDI B, 7\nHLT`,
    expected: {
      registers: { B: 7 },
      halted: true,
    },
  },
  {
    id: "demo4",
    name: "Demo 4 - Branch Not Taken",
    source: `LDI A, 1\nJZ A, 4\nLDI B, 9\nJMP 5\nLDI B, 7\nHLT`,
    expected: {
      registers: { B: 9 },
      halted: true,
    },
  },
  {
    id: "demo5",
    name: "Demo 5 - Negative Immediate",
    source: `LDI A, -1\nSTORE A, 30\nHLT`,
    expected: {
      registers: { A: -1 },
      memory: { 30: -1 },
      halted: true,
    },
  },
  {
    id: "demo6",
    name: "Demo 6 - Overwrite Memory",
    source: `LDI A, 3\nSTORE A, 5\nLDI A, 8\nSTORE A, 5\nLOAD B, 5\nHLT`,
    expected: {
      registers: { B: 8 },
      memory: { 5: 8 },
      halted: true,
    },
  },
  {
    id: "demo7",
    name: "Demo 7 - Jump Skip",
    source: `LDI A, 2\nJMP 3\nLDI A, 9\nLDI B, 4\nADD A, B\nHLT`,
    expected: {
      registers: { A: 6, B: 4 },
      halted: true,
    },
  },
];

export function getDemoById(id) {
  return DEMO_PROGRAMS.find((demo) => demo.id === id) || null;
}
