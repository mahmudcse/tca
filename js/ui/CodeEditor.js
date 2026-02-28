import { DEMO_PROGRAMS } from "../core/DemoPrograms.js";

const DEFAULT_PROGRAM = DEMO_PROGRAMS[0].source;

export class CodeEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onLoad = null;
    this.onStep = null;
    this.onReset = null;
    this.onFormatChange = null;
    this.onWordLengthChange = null;
    this.onLoadDemo = null;
    this.onRunDemo = null;
    this.onRunTests = null;
  }

  renderSkeleton() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="controls">
        <button id="btn-load" type="button">Load Program</button>
        <button id="btn-step" type="button">Step</button>
        <button id="btn-reset" type="button">Reset</button>
      </div>
      <div class="toggles-row">
        <label class="toggle-label" for="display-base">Format</label>
        <select id="display-base" class="toggle-select">
          <option value="bin">Binary</option>
          <option value="hex">Hex</option>
          <option value="dec">Decimal</option>
        </select>

        <label class="toggle-label" for="word-length">Word</label>
        <select id="word-length" class="toggle-select">
          <option value="10">10-bit</option>
          <option value="16" selected>16-bit</option>
        </select>
      </div>
      <div class="demo-row">
        <label class="toggle-label" for="demo-select">Demo</label>
        <select id="demo-select" class="toggle-select"></select>
        <button id="btn-load-demo" type="button">Load Demo</button>
        <button id="btn-run-demo" type="button">Run Demo</button>
        <button id="btn-run-tests" type="button">Run Tests</button>
      </div>
      <label class="editor-label" for="program-input">Assembly Source</label>
      <textarea id="program-input" class="code-input" spellcheck="false"></textarea>
      <pre class="plain-output" id="test-output">Test output will appear here.</pre>
    `;

    const loadBtn = this.container.querySelector("#btn-load");
    const stepBtn = this.container.querySelector("#btn-step");
    const resetBtn = this.container.querySelector("#btn-reset");
    const input = this.container.querySelector("#program-input");
    const displayBase = this.container.querySelector("#display-base");
    const wordLength = this.container.querySelector("#word-length");

    const demoSelect = this.container.querySelector("#demo-select");
    const loadDemoBtn = this.container.querySelector("#btn-load-demo");
    const runDemoBtn = this.container.querySelector("#btn-run-demo");
    const runTestsBtn = this.container.querySelector("#btn-run-tests");

    if (input) {
      input.value = DEFAULT_PROGRAM;
    }

    if (demoSelect) {
      DEMO_PROGRAMS.forEach((demo) => {
        const option = document.createElement("option");
        option.value = demo.id;
        option.textContent = demo.name;
        demoSelect.appendChild(option);
      });
    }

    loadBtn?.addEventListener("click", () => {
      if (this.onLoad) this.onLoad(this.getSource());
    });

    stepBtn?.addEventListener("click", () => {
      if (this.onStep) this.onStep();
    });

    resetBtn?.addEventListener("click", () => {
      if (this.onReset) this.onReset();
    });

    displayBase?.addEventListener("change", (event) => {
      if (!this.onFormatChange) return;
      this.onFormatChange(event.target.value);
    });

    wordLength?.addEventListener("change", (event) => {
      if (!this.onWordLengthChange) return;
      this.onWordLengthChange(Number.parseInt(event.target.value, 10));
    });

    loadDemoBtn?.addEventListener("click", () => {
      if (!this.onLoadDemo || !demoSelect) return;
      this.onLoadDemo(demoSelect.value);
    });

    runDemoBtn?.addEventListener("click", () => {
      if (!this.onRunDemo || !demoSelect) return;
      this.onRunDemo(demoSelect.value);
    });

    runTestsBtn?.addEventListener("click", () => {
      if (this.onRunTests) this.onRunTests();
    });
  }

  bindActions({
    onLoad,
    onStep,
    onReset,
    onFormatChange,
    onWordLengthChange,
    onLoadDemo,
    onRunDemo,
    onRunTests,
  }) {
    this.onLoad = onLoad;
    this.onStep = onStep;
    this.onReset = onReset;
    this.onFormatChange = onFormatChange;
    this.onWordLengthChange = onWordLengthChange;
    this.onLoadDemo = onLoadDemo;
    this.onRunDemo = onRunDemo;
    this.onRunTests = onRunTests;
  }

  getSource() {
    const input = this.container?.querySelector("#program-input");
    return input ? input.value : "";
  }

  setSource(source) {
    const input = this.container?.querySelector("#program-input");
    if (input) input.value = source;
  }

  setTestOutput(text) {
    const output = this.container?.querySelector("#test-output");
    if (output) output.textContent = text;
  }
}
