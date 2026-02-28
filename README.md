# Teaching Computer Application (TCA)

Step 0 scaffold for the thesis project: web-based teaching computer simulator inspired by LC1, with planned RISC-V-oriented updates and selectable 10-bit / 16-bit word lengths.

## Project Rules

- Tech stack: HTML + CSS + JavaScript only (no frameworks).
- Output files: `index.html`, `styles.css`, `app.js`.
- JavaScript architecture: modular files/classes (no monolithic script).
- Clean interface boundary: simulation core is separate from UI rendering.

## File Structure

```text
tca/
├── index.html
├── styles.css
├── app.js
├── js/
│   ├── core/
│   │   ├── ArchitectureConfig.js
│   │   └── SimulationCore.js
│   └── ui/
│       ├── CodeEditor.js
│       ├── MemoryView.js
│       └── ProcessorRenderer.js
├── necessary documents/
│   └── ... (reference PDFs)
└── README.md
```

## How to Run

1. Open `index.html` directly in a browser, or
2. Start a local static server from project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## How to Test (Current Step)

Manual smoke test:

1. Load the page.
2. Confirm three visible panels: Code Editor, Processor View, Memory View.
3. Confirm no JavaScript errors in browser console.
4. Confirm module files load through `app.js`.

## Current Status

- Skeleton and placeholders are implemented.
- Next steps will replace placeholders with functional UI + simulation logic.
