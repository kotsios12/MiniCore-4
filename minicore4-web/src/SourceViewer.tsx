import { useEffect, useState } from "react";
const modules = [
  "minicore4",
  "alu4",
  "ripple_adder4",
  "full_adder",
  "half_adder",
  "instruction_decoder",
  "control_unit",
  "program_rom",
  "data_ram",
];
export default function SourceViewer() {
  const [source, setSource] = useState(""),
    [name, setName] = useState("minicore4"),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/source/minicore4.v")
      .then((r) => {
        if (!r.ok) throw Error("Unable to load source");
        return r.text();
      })
      .then(setSource)
      .catch((e) => setError(String(e)));
  }, []);
  const code =
    source.match(
      new RegExp("module " + name + "\\b[\\s\\S]*?endmodule"),
    )?.[0] ?? "";
  return (
    <div className="panel">
      <div className="panel-head">
        <span>
          VERILOG SOURCE <small>minicore4.v</small>
        </span>
        <select
          aria-label="Verilog module"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setCopied(false);
          }}
        >
          {modules.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button
          disabled={!code}
          onClick={() => {
            navigator.clipboard
              .writeText(code)
              .then(() => setCopied(true))
              .catch(() =>
                setError(
                  "Clipboard unavailable. Select and copy the source manually.",
                ),
              );
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <p className="source-caption">
        Original RTL ·{" "}
        {name === "minicore4"
          ? "State registers and single-cycle execution."
          : name === "data_ram"
            ? "16×4 memory; initialized once and retained through reset."
            : name === "program_rom"
              ? "16×8 asynchronous instruction ROM."
              : "Combinational logic in the processor hierarchy."}
      </p>
      {error && <p role="alert">{error}</p>}
      <pre className="source-code">
        {code.split("\n").map((line, i) => (
          <div key={i}>
            <span className="line-no">{i + 1}</span>
            {line
              .split(
                /(\/\/.*|\b(?:module|endmodule|input|output|wire|reg|assign|always|begin|end|if|else|case|endcase|parameter|initial|for|generate|endgenerate)\b)/g,
              )
              .map((part, j) => (
                <span
                  key={j}
                  className={
                    part.startsWith("//")
                      ? "comment"
                      : /^(module|endmodule|input|output|wire|reg|assign|always|begin|end|if|else|case|endcase|parameter|initial|for|generate|endgenerate)$/.test(
                            part,
                          )
                        ? "keyword"
                        : ""
                  }
                >
                  {part}
                </span>
              ))}
          </div>
        ))}
      </pre>
      <a className="source-link" href="/source/minicore4.v" download>
        Download complete, unmodified source ↗
      </a>
    </div>
  );
}
