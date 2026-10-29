import { useEffect, useRef, useState } from "react";
import {
  Cpu,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowUpRight,
  Terminal,
  ChevronRight,
  Check,
  Activity,
  Code2,
  Layers,
  BookOpen,
  Microchip,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ISA,
  alu,
  assemble,
  bin,
  decode,
  hex,
  programs,
  reset,
  step,
} from "./simulator/core";
import type { CPU, Assembly } from "./simulator/core";
import CircuitViewer from "./CircuitViewer";
import SourceViewer from "./SourceViewer";
import "./App.css";
interface Entry {
  before: CPU;
  after: CPU;
}
function changes(e: Entry) {
  const a = e.before,
    b = e.after;
  const parts = [
    ...(["acc", "b", "out", "zero", "carry", "halted"] as const)
      .filter((k) => a[k] !== b[k])
      .map((k) => `${k.toUpperCase()} ${Number(a[k])} → ${Number(b[k])}`),
    ...b.ram.flatMap((v, i) =>
      v !== a.ram[i] ? [`RAM[${hex(i)}] ${a.ram[i]} → ${v}`] : [],
    ),
  ];
  return parts.join(" · ") || `PC ${hex(a.pc)} → ${hex(b.pc)}`;
}
function App() {
  const [cpu, setCpu] = useState(() => reset(assemble(programs[0].code).words)),
    [running, setRunning] = useState(false),
    [paused, setPaused] = useState(false),
    [speed, setSpeed] = useState(2),
    [source, setSource] = useState(programs[0].code),
    [assembly, setAssembly] = useState<Assembly>(() =>
      assemble(programs[0].code),
    ),
    [history, setHistory] = useState<Entry[]>([]),
    [example, setExample] = useState(0),
    [notice, setNotice] = useState(
      "Addition program loaded. Ready to execute.",
    ),
    [memoryTab, setMemoryTab] = useState("ROM"),
    [active, setActive] = useState("Simulator"),
    [a, setA] = useState(5),
    [b, setB] = useState(3),
    [op, setOp] = useState(0);
  const cpuRef = useRef(cpu);
  const execute = () => {
    const before = cpuRef.current;
    if (before.halted) return;
    const after = step(before);
    cpuRef.current = after;
    setCpu(after);
    setHistory((h) => [...h.slice(-255), { before, after }]);
    if (after.halted) {
      setRunning(false);
      setNotice("CPU halted. Reset to execute again.");
    }
  };
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(execute, 1000 / speed);
    return () => window.clearInterval(id);
  }, [running, speed]);
  const replace = (next: CPU) => {
    setRunning(false);
    setPaused(false);
    cpuRef.current = next;
    setCpu(next);
    setHistory([]);
  };
  const doReset = () => {
    replace(reset(cpuRef.current.rom, cpuRef.current.ram));
    setNotice("CPU reset. RAM retained, as defined by RTL.");
  };
  const load = () => {
    const result = assemble(source);
    setAssembly(result);
    if (result.errors.length) {
      setNotice("Assembly failed. Correct the errors below.");
      return;
    }
    replace(reset(result.words, cpuRef.current.ram));
    setNotice(`${result.words.length} instructions loaded into ROM.`);
  };
  const status = assembly.errors.length
      ? "ERROR"
      : cpu.halted
        ? "HALTED"
        : running
          ? "RUNNING"
          : paused
            ? "PAUSED"
            : "READY",
    ir = decode(cpu.rom[cpu.pc]),
    result = alu(a, b, op),
    last = history.at(-1);
  return (
    <>
      <header>
        <a className="brand" href="#">
          <span className="brand-icon">
            <Cpu size={23} />
          </span>
          MINICORE<span className="brand-four">4</span>
          <span className="brand-divider" />
          <small>PROCESSOR LAB</small>
        </a>
        <nav>
          {[
            "Simulator",
            "Architecture",
            "Circuit Explorer",
            "Instruction Set",
            "About",
          ].map((x) => (
            <a
              className={active === x ? "active" : ""}
              onClick={() => setActive(x)}
              key={x}
              href={"#" + x.toLowerCase().replaceAll(" ", "-")}
            >
              {x}
            </a>
          ))}
        </nav>
        <span className={"status " + status.toLowerCase()}>
          <i />
          {status}
        </span>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span /> HARDWARE, MADE UNDERSTANDABLE
            <span className="version">VERILOG → INTERACTIVE</span>
          </div>
          <div className="hero-main">
            <div>
              <h1>
                MINICORE<span>-4</span>
                <span className="title-square" />
              </h1>
              <h2>A Custom 4-Bit CPU. Built From Logic.</h2>
              <p>
                Explore a custom processor designed in Verilog HDL. Write
                programs,
                <br className="desktop" /> execute instructions, and discover
                the circuits behind every bit.
              </p>
              <div className="badges">
                {[
                  "4-BIT ARCHITECTURE",
                  "16 INSTRUCTIONS",
                  "VERILOG HDL",
                  "RTL SYNTHESIS",
                ].map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
            <div className="hero-side">
              <div className="chip-art">
                <div className="chip-inner">
                  <Cpu size={42} strokeWidth={1} />
                  <span>MC–04</span>
                  <small>4-BIT PROCESSOR</small>
                </div>
              </div>
              <a className="primary launch" href="#simulator">
                LAUNCH SIMULATOR <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="hero-footer">
            <span>
              <i className="green-dot" /> REAL HARDWARE. REAL INSTRUCTIONS.
            </span>
            <span>
              16 × 8 ROM <b>/</b> 16 × 4 RAM <b>/</b> SINGLE-CYCLE EXECUTION
            </span>
          </div>
        </section>
        <section id="simulator">
          <div className="section-heading">
            <div>
              <span className="section-number">INTERACTIVE LAB</span>
              <h2>
                Inside the processor<span>.</span>
              </h2>
              <p>Write. Execute. Observe. One instruction at a time.</p>
            </div>
            <div className="live-label">
              <Activity size={14} /> LIVE CPU STATE
            </div>
          </div>
          <div className="workbench">
            <div className="editor-column">
              <div className="panel editor">
                <div className="panel-head">
                  <span>
                    <Code2 size={16} /> ASSEMBLY EDITOR
                  </span>
                  <span className="file-label">program.asm</span>
                </div>
                <div className="editor-toolbar">
                  <select
                    aria-label="Example program"
                    value={example}
                    onChange={(e) => {
                      const i = Number(e.target.value);
                      setExample(i);
                      setSource(programs[i].code);
                      setAssembly({ words: [], errors: [] });
                      setNotice(
                        "Example selected. Assemble and load to execute.",
                      );
                    }}
                  >
                    {programs.map((p, i) => (
                      <option value={i} key={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setSource("");
                      setAssembly({ words: [], errors: [] });
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="code-editor">
                  <div aria-hidden="true" className="gutter">
                    {source.split("\n").map((_, i) => (
                      <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                    ))}
                  </div>
                  <textarea
                    aria-label="Assembly source"
                    spellCheck={false}
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      setAssembly({ words: [], errors: [] });
                    }}
                  />
                </div>
                <div className="editor-actions">
                  <button
                    onClick={() => {
                      const r = assemble(source);
                      setAssembly(r);
                      setNotice(
                        r.errors.length
                          ? "Assembly failed."
                          : `Assembled ${r.words.length} instructions. Load to execute.`,
                      );
                    }}
                  >
                    <Check size={14} /> Assemble
                  </button>
                  <button className="primary" disabled={running} onClick={load}>
                    Load Program <ChevronRight size={14} />
                  </button>
                </div>
                <div className="machine-code">
                  <span>MACHINE CODE</span>
                  <code>
                    {assembly.words.length
                      ? assembly.words.map((w) => hex(w, 2)).join(" ")
                      : "Assemble source to inspect bytes"}
                  </code>
                </div>
                {assembly.errors.map((e) => (
                  <div key={e} className="error" role="alert">
                    {e}
                  </div>
                ))}
              </div>
              <div className="note">
                <Terminal size={16} />
                <div>
                  <strong>Small architecture. Real possibilities.</strong>
                  <p>
                    Values wrap at 4 bits (0–15). Use semicolons for comments
                    and labels for branch targets.
                  </p>
                </div>
              </div>
            </div>
            <div className="processor-column">
              <div className="panel processor">
                <div className="panel-head">
                  <span>
                    <Microchip size={16} /> PROCESSOR STATE
                  </span>
                  <span className="cycle">
                    CYCLE <b>{String(cpu.steps).padStart(4, "0")}</b>
                  </span>
                </div>
                <div className="registers">
                  {(
                    [
                      {
                        label: "PROGRAM COUNTER",
                        key: "pc",
                        v: cpu.pc,
                        width: 4,
                      },
                      {
                        label: "INSTRUCTION",
                        key: "ir",
                        v: cpu.rom[cpu.pc],
                        width: 8,
                      },
                      {
                        label: "ACCUMULATOR",
                        key: "acc",
                        v: cpu.acc,
                        width: 4,
                      },
                      { label: "REGISTER B", key: "b", v: cpu.b, width: 4 },
                      {
                        label: "OUTPUT REGISTER",
                        key: "out",
                        v: cpu.out,
                        width: 4,
                      },
                    ] as const
                  ).map((r) => (
                    <motion.div
                      key={r.key}
                      className={"register " + r.key}
                      animate={{
                        backgroundColor:
                          last &&
                          r.key !== "ir" &&
                          last.before[r.key as "pc" | "acc" | "b" | "out"] !==
                            r.v
                            ? "#103032"
                            : "#101b28",
                      }}
                    >
                      <label>
                        {r.label}
                        <small>
                          {r.key === "ir"
                            ? "IR"
                            : r.key === "acc"
                              ? "A"
                              : r.key.toUpperCase()}
                        </small>
                      </label>
                      <div className="register-value">
                        {r.key === "ir"
                          ? hex(r.v, 2)
                          : String(r.v).padStart(2, "0")}
                        <span>0x{hex(r.v, r.width === 8 ? 2 : 1)}</span>
                      </div>
                      <div className="bits">
                        {bin(r.v, r.width)
                          .split("")
                          .map((x, i) => (
                            <span className={x === "1" ? "on" : ""} key={i}>
                              {x}
                            </span>
                          ))}
                      </div>
                      {r.key === "ir" && (
                        <small className="decoded">{ir.text}</small>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="flags">
                  <span>STATUS FLAGS</span>
                  {[
                    ["ZERO", cpu.zero],
                    ["CARRY", cpu.carry],
                    ["HALTED", cpu.halted],
                  ].map(([k, v]) => (
                    <div className={v ? "flag on" : "flag"} key={String(k)}>
                      <i />
                      {k}
                      <b>{Number(v)}</b>
                    </div>
                  ))}
                </div>
                <div className="datapath">
                  <span>FETCH</span>
                  <ChevronRight size={13} />
                  <span>DECODE</span>
                  <ChevronRight size={13} />
                  <span>EXECUTE</span>
                  <ChevronRight size={13} />
                  <span>WRITE BACK</span>
                  <small>1 clock / instruction</small>
                </div>
              </div>
              <div className="panel controls">
                <div className="control-buttons">
                  <button
                    className="primary"
                    disabled={running || cpu.halted}
                    onClick={() => {
                      setPaused(true);
                      execute();
                    }}
                  >
                    <SkipForward size={16} /> Step
                  </button>
                  <button
                    disabled={running || cpu.halted}
                    onClick={() => {
                      setPaused(false);
                      setRunning(true);
                    }}
                  >
                    <Play size={15} /> Run
                  </button>
                  <button
                    disabled={!running}
                    onClick={() => {
                      setRunning(false);
                      setPaused(true);
                    }}
                  >
                    <Pause size={15} /> Pause
                  </button>
                  <button onClick={doReset}>
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>
                <div className="speed">
                  <label htmlFor="speed">CLOCK SPEED</label>
                  <select
                    id="speed"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    {[0.5, 1, 2, 5, 10].map((x) => (
                      <option key={x} value={x}>
                        {x} instr / sec
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="console-message" role="status">
                <span className="green-dot" />
                {notice}
              </div>
            </div>
          </div>
          <div className="memory-history">
            <div className="panel memory">
              <div className="panel-head">
                <div className="tab-buttons">
                  {["ROM", "RAM"].map((x) => (
                    <button
                      className={memoryTab === x ? "selected" : ""}
                      key={x}
                      onClick={() => setMemoryTab(x)}
                    >
                      {x === "ROM" ? "Program Memory" : "Data Memory"}{" "}
                      <small>{x === "ROM" ? "16 × 8" : "16 × 4"}</small>
                    </button>
                  ))}
                </div>
                <span className="file-label">
                  {memoryTab === "ROM" ? "READ ONLY" : "READ / WRITE"}
                </span>
              </div>
              <div className="memory-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ADDR</th>
                      <th>HEX</th>
                      <th>BINARY</th>
                      <th>{memoryTab === "ROM" ? "INSTRUCTION" : "DECIMAL"}</th>
                      <th>{memoryTab === "ROM" ? "OPERAND" : ""}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(memoryTab === "ROM" ? cpu.rom : cpu.ram).map((v, i) => (
                      <tr
                        key={i}
                        className={
                          (memoryTab === "ROM" && i === cpu.pc
                            ? "current "
                            : "") +
                          (memoryTab === "RAM" &&
                          last &&
                          last.before.ram[i] !== v
                            ? "changed"
                            : "")
                        }
                      >
                        <td>
                          <span className="address-arrow">
                            {memoryTab === "ROM" && i === cpu.pc ? "▸" : " "}
                          </span>
                          0x{hex(i)}
                        </td>
                        <td>{hex(v, memoryTab === "ROM" ? 2 : 1)}</td>
                        <td className="binary">
                          {bin(v, memoryTab === "ROM" ? 8 : 4)}
                        </td>
                        <td className="mnemonic">
                          {memoryTab === "ROM" ? decode(v).mnemonic : v}
                        </td>
                        <td>
                          {memoryTab === "ROM" && ISA[v >> 4][1] !== "—"
                            ? `0x${hex(v & 15)}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel-footer">
                <i className="green-dot" />
                {memoryTab === "ROM"
                  ? "Highlighted row is the instruction at the current PC."
                  : "RAM persists through CPU reset."}
              </div>
            </div>
            <div className="panel history">
              <div className="panel-head">
                <span>
                  <Activity size={15} /> EXECUTION HISTORY
                </span>
                <button onClick={() => setHistory([])}>Clear</button>
              </div>
              <div className="history-list">
                {!history.length ? (
                  <div className="empty-history">
                    <div>
                      <Activity size={28} />
                    </div>
                    <strong>Every instruction tells a story.</strong>
                    <p>
                      Step or run your program to trace register,
                      <br /> memory, and flag changes here.
                    </p>
                    <span>WAITING FOR EXECUTION</span>
                  </div>
                ) : (
                  history.map((e) => (
                    <details key={e.after.steps}>
                      <summary>
                        <span className="history-step">
                          {String(e.after.steps).padStart(3, "0")}
                        </span>
                        <span className="history-op">
                          {decode(e.before.rom[e.before.pc]).text}
                          <small>0x{hex(e.before.pc)}</small>
                        </span>
                        <span>{changes(e)}</span>
                      </summary>
                      <pre>{`After step ${e.after.steps}: PC=${hex(e.after.pc)} A=${hex(e.after.acc)} B=${hex(e.after.b)} OUT=${hex(e.after.out)}\nZ=${+e.after.zero} C=${+e.after.carry} HLT=${+e.after.halted}\nRAM: ${e.after.ram.map((v) => hex(v)).join(" ")}`}</pre>
                    </details>
                  ))
                )}
              </div>
              <div className="panel-footer">
                {history.length} RECORDED STEPS{" "}
                <span>Latest 256 retained · expand to inspect</span>
              </div>
            </div>
          </div>
        </section>
        <section id="architecture">
          <Section
            tag="THE BIG PICTURE"
            title="From instruction to execution."
            text="Explore the actual module boundaries of the Verilog processor."
          />
          <CircuitViewer architecture />
        </section>
        <section id="circuit-explorer">
          <Section
            tag="UNDER THE HOOD"
            title="Logic you can look inside."
            text="Explore the real diagrams, then try the arithmetic yourself."
          />
          <CircuitViewer />
          <div className="alu-source">
            <div className="panel alu">
              <div className="panel-head">
                <span>
                  <Layers size={16} /> INTERACTIVE ALU
                </span>
                <span className="file-label">SHARED EMULATOR LOGIC</span>
              </div>
              <div className="alu-inputs">
                {[
                  { label: "OPERAND A", value: a, set: setA },
                  { label: "OPERAND B", value: b, set: setB },
                ].map((x) => (
                  <label key={x.label}>
                    {x.label}
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={x.value}
                      onChange={(e) =>
                        x.set(
                          Math.max(
                            0,
                            Math.min(15, Math.trunc(Number(e.target.value))),
                          ),
                        )
                      }
                    />
                    <code>
                      {bin(x.value)} · 0x{hex(x.value)} · {x.value} dec
                    </code>
                  </label>
                ))}
              </div>
              <label className="alu-operation">
                OPERATION
                <select
                  value={op}
                  onChange={(e) => setOp(Number(e.target.value))}
                >
                  {["ADD", "SUB", "AND", "OR", "XOR", "NOT A"].map((x, i) => (
                    <option value={i} key={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>
              <div className="alu-result">
                <span>
                  RESULT
                  <strong>
                    {result.result}
                    <small>
                      0x{hex(result.result)} / {bin(result.result)}
                    </small>
                  </strong>
                </span>
                <div>
                  Z <b>{+result.zero}</b>
                  <br />C <b>{+result.carry}</b>
                </div>
              </div>
              <p>
                Four bits hold 0–15. Arithmetic wraps modulo 16. ADD sets C on
                overflow; SUB sets C on borrow. Logic operations clear C.
              </p>
            </div>
            <SourceViewer />
          </div>
        </section>
        <section id="instruction-set">
          <Section
            tag="THE LANGUAGE OF THE MACHINE"
            title="16 instructions. Full control."
            text="Every opcode, directly from the instruction decoder and control unit."
          />
          <div className="encoding">
            <BookOpen size={25} />
            <div>
              <strong>One byte. Two halves.</strong>
              <p>
                8-bit instruction ={" "}
                <span>[ 4-bit opcode ][ 4-bit operand ]</span>. No-operand
                instructions ignore the low nibble in RTL; the assembler emits
                zero.
              </p>
            </div>
            <code>
              <span>0001</span> <b>0101</b>
              <small>LDI 5 → 0x15</small>
            </code>
          </div>
          <div className="panel isa-table">
            <table>
              <thead>
                <tr>
                  <th>OPCODE</th>
                  <th>ENCODING</th>
                  <th>MNEMONIC</th>
                  <th>OPERAND</th>
                  <th>OPERATION</th>
                  <th>AFFECTS</th>
                  <th>FLAGS</th>
                </tr>
              </thead>
              <tbody>
                {ISA.map((x, i) => (
                  <tr key={i}>
                    <td>0x{hex(i)}</td>
                    <td className="binary">{bin(i)} nnnn</td>
                    <td className="mnemonic">{x[0]}</td>
                    <td>{x[1]}</td>
                    <td>{x[2]}</td>
                    <td>{x[3]}</td>
                    <td>{x[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section id="about">
          <Section
            tag="BUILT FROM FIRST PRINCIPLES"
            title="A small CPU. A complete journey."
            text="From individual logic gates to a running assembly program."
          />
          <div className="about-grid">
            <div>
              <Cpu size={27} />
              <h3>Hardware with intention.</h3>
              <p>
                MiniCore-4 is an educational processor built to make the path
                from Boolean logic to software execution visible. Its Verilog
                design connects a program counter, accumulator, B register,
                output register, instruction decoder, control unit and memory.
              </p>
              <p>
                Each enabled rising clock edge executes one instruction.
                Register-based arithmetic uses a hierarchy of half adders, full
                adders and a four-bit ripple-carry adder. Conditional branches
                use stored zero and carry flags to select the next address.
              </p>
            </div>
            <div>
              <Activity size={27} />
              <h3>Traceable to the RTL.</h3>
              <p>
                The CPU is tested with Icarus Verilog. RTL schematics are
                generated with Yosys and Graphviz; module overviews are manually
                specified from the real interfaces. This simulator follows the
                source rather than inferred mnemonic behavior.
              </p>
              <div className="test-pass">
                <Check size={15} />
                <code>PASS: 5 + 3 = 8; OUT=8; HLT holds CPU</code>
              </div>
              <p>
                Hardware constraints: 16 ROM addresses, 16 RAM cells, no stack
                or interrupts, and a wrapping 4-bit PC. RAM has no reset input.
                The instruction wire always shows ROM[PC]; there is no latched
                instruction register. Automated differential simulation is
                documented in the project README; it is not formal verification.
              </p>
            </div>
          </div>
        </section>
        <footer>
          <a className="brand" href="#">
            <Cpu size={20} /> MINICORE-4
          </a>
          <span>DESIGNED IN VERILOG. EXPLORED IN YOUR BROWSER.</span>
          <a href="#simulator">Back to the lab ↑</a>
        </footer>
      </main>
    </>
  );
}
function Section({
  tag,
  title,
  text,
}: {
  tag: string;
  title: string;
  text: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-number">
          {tag}
        </span>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}
export default App;
