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
