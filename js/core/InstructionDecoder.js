export class InstructionDecoder {
  decode(instruction) {
    if (!instruction || typeof instruction.op !== "string") {
      throw new Error("Invalid instruction format");
    }
    return instruction;
  }
}
