export class AssemblerParser {
  parse(source) {
    const lines = source.split(/\r?\n/);
    const program = [];

    for (let index = 0; index < lines.length; index += 1) {
      const lineNo = index + 1;
      const cleaned = this.stripComments(lines[index]).trim();
      if (!cleaned) {
        continue;
      }

      const instruction = this.parseLine(cleaned, lineNo);
      program.push(instruction);
    }

    if (program.length === 0) {
      throw new Error("No instructions found in source");
    }

    return program;
  }

  stripComments(line) {
    return line.replace(/(;|#|\/\/).*$/, "");
  }

  parseLine(line, lineNo) {
    const [opRaw, ...rest] = line.split(/\s+/);
    const op = opRaw.toUpperCase();
    const argText = rest.join(" ").trim();

    if (op === "LDI") {
      const match = argText.match(/^([AB])\s*,\s*(-?\d+)$/i);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'LDI <A|B>, <number>'`);
      }
      return { op: "LDI", reg: match[1].toUpperCase(), value: Number.parseInt(match[2], 10) };
    }

    if (op === "ADD") {
      const match = argText.match(/^([AB])\s*,\s*([AB])$/i);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'ADD <A|B>, <A|B>'`);
      }
      return {
        op: "ADD",
        dest: match[1].toUpperCase(),
        src: match[2].toUpperCase(),
      };
    }

    if (op === "LOAD") {
      const match = argText.match(/^([AB])\s*,\s*(?:\[(\d+)\]|(\d+))$/i);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'LOAD <A|B>, <address>' or 'LOAD <A|B>, [address]'`);
      }
      const address = Number.parseInt(match[2] ?? match[3], 10);
      return { op: "LOAD", reg: match[1].toUpperCase(), address };
    }

    if (op === "STORE") {
      const match = argText.match(/^([AB])\s*,\s*(?:\[(\d+)\]|(\d+))$/i);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'STORE <A|B>, <address>' or 'STORE <A|B>, [address]'`);
      }
      const address = Number.parseInt(match[2] ?? match[3], 10);
      return { op: "STORE", reg: match[1].toUpperCase(), address };
    }

    if (op === "JMP") {
      const match = argText.match(/^(\d+)$/);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'JMP <address>'`);
      }
      return { op: "JMP", address: Number.parseInt(match[1], 10) };
    }

    if (op === "JZ") {
      const match = argText.match(/^([AB])\s*,\s*(\d+)$/i);
      if (!match) {
        throw new Error(`Line ${lineNo}: expected 'JZ <A|B>, <address>'`);
      }
      return {
        op: "JZ",
        reg: match[1].toUpperCase(),
        address: Number.parseInt(match[2], 10),
      };
    }

    if (op === "HLT") {
      if (argText.length > 0) {
        throw new Error(`Line ${lineNo}: HLT takes no operands`);
      }
      return { op: "HLT" };
    }

    throw new Error(`Line ${lineNo}: unsupported opcode '${op}'`);
  }
}
