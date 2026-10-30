# MiniCore-4 — Hierarchical Portfolio Edition

This edition preserves the working single-cycle 4-bit CPU behavior, but refactors the Verilog into named hardware modules: `program_rom`, `instruction_decoder`, `control_unit`, `alu4`, `data_ram`, plus the `minicore4` register/PC datapath. It retains the half-adder → full-adder → ripple-carry-adder hierarchy.

## Run on macOS

```bash
./scripts/run.sh
./scripts/schematic.sh
open build/architecture_overview.svg
open build/alu4_rtl.svg
```

**Important:** `architecture_overview.svg`, `alu_overview.svg`, and `control_overview.svg` are clean, **manually specified module-level diagrams based on the RTL interfaces**; they are not auto-extracted gate-level netlists. The `*_rtl.svg` files are actual Yosys-generated schematics from the Verilog modules. The complete CPU netlist is intentionally not rendered as one massive unreadable image.

The existing testbench verifies the 5+3 example. On 2026-10-29, `./scripts/run.sh` passed with `PASS: 5 + 3 = 8; OUT=8; HLT holds CPU`. The browser project's 11 automated test groups also passed, including 3,457 direct Icarus RTL comparisons. These are finite simulation checks, not formal verification. The short addition ROM image produces a harmless `$readmemh` warning about fewer than 16 words; the RTL preinitializes remaining entries to HLT. The CPU executes one instruction per rising clock edge with STEP high, not a multicycle FSM. RAM persists through reset. ROM is 16x8 and RAM 16x4.

## Example program

`15 23 30 E0 F0` means LDI 5, LDB 3, ADD, OUT, HLT.

## Files

- `rtl/minicore4.v`: modular CPU source
- `tb/minicore4_tb.v`: simulation testbench
- `programs/`: sample instruction ROM images
- `scripts/run.sh`: compile and simulate
- `scripts/schematic.sh`: readable block diagrams + module RTL schematics
- `diagrams/`: Graphviz DOT sources and SVGs

## Complete project

See the [root README](../README.md) for the instruction set, architecture, setup, verification scope, hardware limitations, and companion [browser simulator](../minicore4-web/). License selection is pending the project owner's decision.

## Website waveform viewer

`bash scripts/run.sh` runs the original addition assertions and generates
`build/minicore4.vcd` through `$dumpvars(0,minicore4_tb)`. The dump includes the
actual CPU hierarchy, a 10 ns clock, asynchronous reset, and the `step` enable;
only enabled rising edges execute instructions. It preserves the 1 ns / 1 ps
simulation timescale (VCD timestamps are expressed in 1 ps units).

From the sibling `minicore4-web` directory, `npm run waveforms:generate` runs this
same test and copies its dump to `public/waveforms/minicore4.vcd` for static
hosting. No RTL behavior or instruction encoding is changed. The testbench's
short ROM-file warning is expected: the ROM initializes all remaining words to
HLT before loading the addition program.

The website displays `clk`, `reset`, `step`, `pc[3:0]`, `instruction[7:0]`,
`opcode[3:0]`, `acc[3:0]`, `reg_b[3:0]`, `alu_result[3:0]`, `carry_flag`,
`zero_flag`, `out_port[3:0]`, and `halted`. `instruction` is combinational
ROM[PC], not a latched IR. These waveforms describe simulated digital values over
time, not physical measurements. Browser Live Emulator mode separately records
instruction-level snapshots of the user's program; the bundled RTL trace always
represents this testbench. See the website README for viewer controls and limits.
