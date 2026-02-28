import { ArchitectureConfig } from "./js/core/ArchitectureConfig.js";
import { SimulationCore } from "./js/core/SimulationCore.js";
import { DEMO_PROGRAMS, getDemoById } from "./js/core/DemoPrograms.js";
import { TestRunner } from "./js/core/TestRunner.js";
import { ProcessorRenderer } from "./js/ui/ProcessorRenderer.js";
import { MemoryView } from "./js/ui/MemoryView.js";
import { CodeEditor } from "./js/ui/CodeEditor.js";

function bootstrap() {
  const config = new ArchitectureConfig();
  const core = new SimulationCore(config);
  const testRunner = new TestRunner(core);

  const processorRenderer = new ProcessorRenderer("processor-diagram-placeholder");
  const memoryView = new MemoryView("memory-view-placeholder");
  const codeEditor = new CodeEditor("code-editor-placeholder");
  const status = document.getElementById("app-status");

  processorRenderer.renderSkeleton();
  memoryView.renderSkeleton();
  codeEditor.renderSkeleton();

  codeEditor.bindActions({
    onLoad: (source) => {
      try {
        const result = core.loadProgram(source);
        if (status) status.textContent = `Status: Program loaded (${result.count} instructions)`;
      } catch (error) {
        if (status) status.textContent = `Status: Load failed - ${error.message}`;
      }
    },
    onStep: () => {
      const result = core.step();
      if (status) {
        status.textContent = result.ok
          ? `Status: Step executed (${result.microStepInfo.action})`
          : `Status: ${result.reason}`;
      }
    },
    onReset: () => {
      core.reset();
      if (status) status.textContent = "Status: Reset complete";
    },
    onFormatChange: (base) => {
      try {
        core.setDisplayBase(base);
        if (status) status.textContent = `Status: Display format set to ${base}`;
      } catch (error) {
        if (status) status.textContent = `Status: Format change failed - ${error.message}`;
      }
    },
    onWordLengthChange: (bits) => {
      try {
        core.setWordLength(bits);
        if (status) status.textContent = `Status: Word length set to ${bits}-bit`;
      } catch (error) {
        if (status) status.textContent = `Status: Word switch failed - ${error.message}`;
      }
    },
    onLoadDemo: (demoId) => {
      const demo = getDemoById(demoId);
      if (!demo) {
        if (status) status.textContent = `Status: Unknown demo ${demoId}`;
        return;
      }
      codeEditor.setSource(demo.source);
      try {
        const result = core.loadProgram(demo.source);
        if (status) status.textContent = `Status: Loaded ${demo.name} (${result.count} instructions)`;
      } catch (error) {
        if (status) status.textContent = `Status: Demo load failed - ${error.message}`;
      }
    },
    onRunDemo: (demoId) => {
      const demo = getDemoById(demoId);
      if (!demo) {
        if (status) status.textContent = `Status: Unknown demo ${demoId}`;
        return;
      }
      codeEditor.setSource(demo.source);
      try {
        const finalState = testRunner.runDemoById(demoId);
        const single = testRunner.runAll([demo]);
        const deterministic = single.results[0]?.pass === true;
        codeEditor.setTestOutput(
          `Demo check: ${demo.name}\n${deterministic ? "PASS" : "FAIL"} ${single.results[0].details.join(" | ")}`,
        );
        if (status) {
          status.textContent = `Status: ${demo.name} finished (${deterministic ? "PASS" : "CHECK"}) | A=${finalState.cpu.registers.A} B=${finalState.cpu.registers.B} PC=${finalState.cpu.registers.PC}`;
        }
      } catch (error) {
        if (status) status.textContent = `Status: Demo run failed - ${error.message}`;
      }
    },
    onRunTests: () => {
      try {
        const report = testRunner.runAll(DEMO_PROGRAMS);
        const lines = [
          `Test Summary: ${report.passCount}/${report.total} passed`,
          ...report.results.map((item) => {
            const badge = item.pass ? "PASS" : "FAIL";
            return `${badge} ${item.id} - ${item.name} :: ${item.details.join(" | ")}`;
          }),
        ];
        codeEditor.setTestOutput(lines.join("\n"));
        if (status) status.textContent = `Status: Tests ${report.passCount}/${report.total} passed`;
      } catch (error) {
        if (status) status.textContent = `Status: Test run failed - ${error.message}`;
      }
    },
  });

  core.onStateChange((state) => {
    memoryView.update(state);
    processorRenderer.update(state);
  });

  core.onStep((state, microStepInfo) => {
    console.log("onStep", state.cpu.registers.PC, microStepInfo);
  });

  try {
    const result = core.loadProgram(DEMO_PROGRAMS[0].source);
    codeEditor.setSource(DEMO_PROGRAMS[0].source);
    if (status) status.textContent = `Status: ${DEMO_PROGRAMS[0].name} loaded (${result.count} instructions)`;
  } catch (error) {
    if (status) status.textContent = `Status: Initial load failed - ${error.message}`;
  }
}

bootstrap();
