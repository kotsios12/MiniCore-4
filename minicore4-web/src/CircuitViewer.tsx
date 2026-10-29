import { useRef, useState } from "react";
import { Plus, Minus, Maximize, RotateCcw, Expand } from "lucide-react";
export const circuits = [
  {
    name: "CPU Architecture",
    file: "architecture_overview.svg",
    detail: "Module overview · based on RTL interfaces",
    purpose:
      "The single-cycle datapath connects a 16×8 ROM, instruction decoder, control unit, ALU and 16×4 RAM.",
    io: "Inputs: clk, reset, step · Outputs: PC, A, B, OUT, Z, C, halted, instruction, RAM data",
  },
  {
    name: "ALU Overview",
    file: "alu_overview.svg",
    detail: "Module overview · based on RTL interfaces",
    purpose:
      "A and B feed the shared ripple-carry arithmetic path and bitwise operations. The decoder selects one of six ALU operations.",
    io: "Inputs: A[3:0], B[3:0], op[2:0] · Outputs: result[3:0], carry, zero",
  },
  {
    name: "ALU RTL",
    file: "alu4_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "Selects ADD, SUB, AND, OR, XOR or NOT A. Arithmetic wraps to four bits. SUB reports borrow; logic clears carry.",
    io: "Inputs: a[3:0], b[3:0], op[2:0] · Outputs: result[3:0], carry, zero",
  },
  {
    name: "Ripple-Carry Adder",
    file: "ripple_adder4_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "Four full adders propagate carry from least to most significant bit. The ALU complements B and sets carry-in for subtraction.",
    io: "Inputs: a[3:0], b[3:0], cin · Outputs: sum[3:0], cout",
  },
  {
    name: "Full Adder",
    file: "full_adder_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "Two half adders and an OR combine three input bits into a sum and carry. Four instances form the arithmetic core.",
    io: "Inputs: a, b, cin · Outputs: sum, cout",
  },
  {
    name: "Half Adder",
    file: "half_adder_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "XOR produces the sum; AND produces carry. This is the smallest arithmetic building block in MiniCore-4.",
    io: "Inputs: a, b · Outputs: sum, carry",
  },
  {
    name: "Instruction Decoder",
    file: "instruction_decoder_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "Splits instruction[7:4] into opcode and instruction[3:0] into operand. Opcodes 3–8 select the six ALU operations.",
    io: "Input: instruction[7:0] · Outputs: opcode[3:0], operand[3:0], alu_op[2:0], is_alu",
  },
  {
    name: "Control Unit",
    file: "control_unit_rtl.svg",
    detail: "Yosys / Graphviz · synthesized RTL",
    purpose:
      "Combinational opcode decoding drives loads, stores, ALU execution, output and halt. Branches evaluate the stored zero and carry flags.",
    io: "Inputs: opcode[3:0], zero_flag, carry_flag · Outputs: load, store, execute, jump, output, halt controls",
  },
  {
    name: "Control Overview",
    file: "control_overview.svg",
    detail: "Module overview · based on RTL interfaces",
    purpose:
      "Control signals select register writes and the next PC. One instruction executes on each rising edge with step enabled.",
    io: "Inputs: opcode, zero, carry · Outputs: datapath control signals",
  },
];
export default function CircuitViewer({
  architecture = false,
}: {
  architecture?: boolean;
}) {
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(0),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const c = circuits[selected];
  const fit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  return (
    <div className="panel circuit" ref={ref}>
      <div className="panel-head">
        <span>
          {architecture ? "ARCHITECTURAL OVERVIEW" : "SCHEMATIC WORKBENCH"}
        </span>
        <div className="tools">
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((v) => Math.max(0.25, v - 0.25))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((v) => Math.min(5, v + 0.25))}
          >
            <Plus size={15} />
          </button>
          <button aria-label="Reset zoom" onClick={fit}>
            <RotateCcw size={15} />
          </button>
          <button aria-label="Fit to screen" onClick={fit}>
            <Expand size={15} />
          </button>
          <button
            aria-label="Fullscreen"
            onClick={() => {
              setError("");
              if (document.fullscreenElement)
                void document
                  .exitFullscreen()
                  .catch(() =>
                    setError(
                      "Unable to exit fullscreen. Use the browser Escape key.",
                    ),
                  );
              else if (ref.current?.requestFullscreen)
                void ref.current
                  .requestFullscreen()
                  .catch(() =>
                    setError(
                      "Fullscreen is unavailable in this browser context.",
                    ),
                  );
              else setError("Fullscreen is not supported by this browser.");
            }}
          >
            <Maximize size={15} />
          </button>
        </div>
      </div>
      {!architecture && (
        <div className="circuit-tabs">
          {circuits.map((v, i) => (
            <button
              key={v.file}
              className={i === selected ? "selected" : ""}
              onClick={() => {
                setSelected(i);
                fit();
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
      <div
        className="diagram"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setPan({
              x: e.clientX - drag.current.x,
              y: e.clientY - drag.current.y,
            });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <img
          draggable={false}
          src={`/schematics/${c.file}`}
          alt={c.name + " schematic"}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          }}
        />
      </div>
      <div className="circuit-note">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <strong>{c.name}</strong>
        <small>{c.detail} · Drag to pan</small>
        <p>{c.purpose}</p>
        <p className="mono">{c.io}</p>
      </div>
    </div>
  );
}
