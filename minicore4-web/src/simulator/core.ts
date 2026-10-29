export const ISA = [
  ["NOP", "—", "No operation; advance PC.", "PC", "—"],
  ["LDI", "imm", "Load immediate into accumulator.", "A, PC", "Z"],
  ["LDB", "imm", "Load immediate into B.", "B, PC", "—"],
  ["ADD", "—", "A ← A + B, truncated to 4 bits.", "A, PC", "Z, C"],
  ["SUB", "—", "A ← A − B; C indicates borrow.", "A, PC", "Z, C"],
  ["AND", "—", "A ← A AND B.", "A, PC", "Z; C=0"],
  ["OR", "—", "A ← A OR B.", "A, PC", "Z; C=0"],
  ["XOR", "—", "A ← A XOR B.", "A, PC", "Z; C=0"],
  ["NOT", "—", "Invert all four accumulator bits.", "A, PC", "Z; C=0"],
  ["STA", "addr", "RAM[operand] ← A.", "RAM, PC", "—"],
  ["LDA", "addr", "A ← RAM[operand].", "A, PC", "Z"],
  ["JMP", "addr", "Jump to operand address.", "PC", "—"],
  ["JZ", "addr", "Jump when zero flag is set.", "PC", "—"],
  ["JC", "addr", "Jump when carry / borrow flag is set.", "PC", "—"],
  ["OUT", "—", "Copy A into output register.", "OUT, PC", "—"],
  ["HLT", "—", "Halt execution and hold PC.", "Halted", "—"],
] as const;
export const hex = (n: number, width = 1) =>
  n.toString(16).toUpperCase().padStart(width, "0");
export const bin = (n: number, width = 4) => n.toString(2).padStart(width, "0");
export function decode(word: number) {
  const opcode = word >> 4,
    operand = word & 15;
  return {
    opcode,
    operand,
    mnemonic: ISA[opcode][0],
    text: ISA[opcode][0] + (ISA[opcode][1] === "—" ? "" : ` ${operand}`),
  };
}
export function alu(a: number, b: number, op: number) {
  const raw =
    op === 0
      ? a + b
      : op === 1
        ? a - b
        : op === 2
          ? a & b
          : op === 3
            ? a | b
            : op === 4
              ? a ^ b
              : op === 5
                ? ~a
                : 0;
  const result = raw & 15;
  return {
    result,
    carry: op === 0 ? raw > 15 : op === 1 ? raw < 0 : false,
    zero: result === 0,
  };
}
export interface CPU {
  pc: number;
  acc: number;
  b: number;
  out: number;
  zero: boolean;
  carry: boolean;
  halted: boolean;
  ram: number[];
  rom: number[];
  steps: number;
}
export function reset(
  rom: number[] = [],
  ram: number[] = Array(16).fill(0),
): CPU {
  return {
    pc: 0,
    acc: 0,
    b: 0,
    out: 0,
    zero: true,
    carry: false,
    halted: false,
    ram: [...ram],
    rom: Array.from({ length: 16 }, (_, i) => rom[i] ?? 240),
    steps: 0,
  };
}
export function step(s: CPU): CPU {
  if (s.halted) return s;
  const n = { ...s, ram: [...s.ram], pc: (s.pc + 1) & 15, steps: s.steps + 1 },
    { opcode: o, operand: v } = decode(s.rom[s.pc]);
  if (o === 1) {
    n.acc = v;
    n.zero = v === 0;
  }
  if (o === 2) n.b = v;
  if (o >= 3 && o <= 8) {
    const r = alu(s.acc, s.b, o - 3);
    n.acc = r.result;
    n.zero = r.zero;
    n.carry = r.carry;
  }
  if (o === 9) n.ram[v] = s.acc;
  if (o === 10) {
    n.acc = s.ram[v];
    n.zero = n.acc === 0;
  }
  if (o === 11 || (o === 12 && s.zero) || (o === 13 && s.carry)) n.pc = v;
  if (o === 14) n.out = s.acc;
  if (o === 15) {
    n.halted = true;
    n.pc = s.pc;
  }
  return n;
}
export interface Assembly {
  words: number[];
  errors: string[];
}
export function assemble(source: string): Assembly {
  const labels = new Map<string, number>(),
    lines: { text: string; line: number }[] = [],
    errors: string[] = [];
  source.split("\n").forEach((raw, i) => {
    let t = raw.split(/[;#]/)[0].trim().toUpperCase();
    const m = t.match(/^([A-Z_]\w*):/);
    if (m) {
      if (labels.has(m[1]))
        errors.push(`Line ${i + 1}: duplicate label ${m[1]}`);
      labels.set(m[1], lines.length);
      t = t.slice(m[0].length).trim();
    }
    if (t) lines.push({ text: t, line: i + 1 });
  });
  const words = lines.map(({ text, line }) => {
    const parts = text.split(/[\s,]+/),
      op = ISA.findIndex((x) => x[0] === parts[0]);
    if (op < 0) {
      errors.push(`Line ${line}: unknown instruction ${parts[0]}`);
      return 0;
    }
    const needs = ISA[op][1] !== "—";
    if (parts.length !== (needs ? 2 : 1)) {
      errors.push(
        `Line ${line}: ${parts[0]} expects ${needs ? "one operand" : "no operands"}`,
      );
      return 0;
    }
    let v = 0;
    if (needs) {
      v = labels.get(parts[1]) ?? Number(parts[1]);
      if (!Number.isInteger(v) || v < 0 || v > 15) {
        errors.push(`Line ${line}: operand must be 0–15 or a valid label`);
        v = 0;
      }
    }
    return op * 16 + v;
  });
  if (words.length > 16) errors.push("Program exceeds 16 ROM addresses");
  if (!words.length) errors.push("Program is empty");
  return { words: errors.length ? [] : words, errors };
}
export const programs = [
  {
    name: "Addition",
    code: "; Add two 4-bit numbers\n; Expected output: 8\n\nLDI 5\nLDB 3\nADD\nOUT\nHLT",
    expected: 8,
  },
  { name: "Subtraction", code: "LDI 3\nLDB 5\nSUB\nOUT\nHLT", expected: 14 },
  {
    name: "Bitwise logic",
    code: "LDI 10\nLDB 6\nXOR\nNOT\nOUT\nHLT",
    expected: 3,
  },
  {
    name: "Memory round-trip",
    code: "LDI 9\nSTA 15\nLDI 0\nLDA 15\nOUT\nHLT",
    expected: 9,
  },
  {
    name: "Countdown",
    code: "LDI 5\nLDB 1\nloop: OUT\nSUB\nJZ done\nJMP loop\ndone: OUT\nHLT",
    expected: 0,
  },
  {
    name: "Carry branch",
    code: "LDI 15\nLDB 1\nADD\nJC carry\nHLT\ncarry: LDI 1\nOUT\nHLT",
    expected: 1,
  },
];
