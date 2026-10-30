# MiniCore-4 · Interactive Processor Lab

A standalone React + TypeScript + Vite lab for the real MiniCore-4 Verilog processor. All execution is local to the browser; no backend, account, or network service is needed.

## Run locally

Requires Node.js 22.18+ (Node 24 recommended).

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. For a production build:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Tests require `iverilog` and `vvp` on PATH (macOS: `brew install icarus-verilog`). Serve `dist/` with any static host; deploy at the root path. No publication or Git commits are performed by this project.

## Implemented

- Instruction stepping, timed execution at 0.5/1/2/5/10 instructions per second, pause, halt and hardware reset; one bounded interval with cleanup.
- Two-pass assembler with labels, decimal/hex/binary operands, comments, line-specific errors and strict 16-word / 4-bit limits. Assemble previews bytes; Load Program assembles and loads atomically.
- PC, current ROM instruction, accumulator, B, output and flags; all values come from emulator state.
- All 16 ROM and RAM addresses with current-PC and changed-cell highlighting.
- Bounded 256-entry chronological execution history; expand an entry for recorded registers, flags and RAM.
- Six validated programs: addition, subtraction with borrow, bitwise logic, memory round-trip, countdown and carry branch.
- Actual copied architecture and RTL SVGs, selectable circuits, zoom, drag pan, reset, fit and fullscreen. Fit restores the contained image to the viewport; use fullscreen for dense netlists.
- Interactive six-operation ALU using exactly the same function as the CPU.
- Complete ISA reference, selected original source modules with keyword highlighting, clipboard copy and complete source download.
- Responsive layouts, keyboard focus indicators, labeled inputs and reduced-motion support.

## Source and layout

`../MiniCore4-Hierarchical/rtl/minicore4.v` is authoritative and was read before implementation. The hardware checkout is not changed.

- `src/simulator/core.ts`: typed CPU state, reset/step, ALU, decoder, ISA, assembler and examples.
- `src/App.tsx`: lab controls, editor, registers, memory, history, ALU, reference and engineering content.
- `src/CircuitViewer.tsx`: shared schematic controls and module descriptions.
- `src/SourceViewer.tsx`: read-only original Verilog module explorer.
- `src/index.css`, `src/App.css`: typography, engineering theme and responsive layouts.
- `public/source/minicore4.v`: byte-for-byte copy of original RTL.
- `public/schematics/`: nine existing SVGs copied from hardware `build/`.
- `scripts/test.mjs`: unit and direct RTL differential tests, using temporary files outside the hardware checkout.

Architecture, ALU and control **overviews** are manually specified module-level diagrams based on RTL interfaces. Only `*_rtl.svg` files are Yosys/Graphviz-generated RTL schematics. No absent register netlists or CPU schematics are fabricated.

## Exact hardware behavior and constraints

Instructions are `[opcode:4][operand:4]`. The 16 opcodes are NOP, LDI, LDB, ADD, SUB, AND, OR, XOR, NOT, STA, LDA, JMP, JZ, JC, OUT and HLT. No-operand instructions ignore their low nibble in hardware; the assembler canonicalizes it to zero.

- ROM is 16×8; RAM is 16×4, initialized to zero only at power-up.
- Reset clears PC, A, B, output, carry and halted, and sets zero. **RAM survives reset**. Loading a new ROM also retains RAM, while resetting CPU registers.
- One instruction executes per enabled rising clock edge; this is not a multicycle fetch/decode state machine.
- The `instruction` wire is combinational ROM[PC], so after a step it shows the **next** instruction. There is no separately latched IR. History records the executed instruction's original address.
- PC wraps modulo 16. HLT holds the PC on its own address and freezes all subsequent steps.
- ADD wraps modulo 16 and sets carry on overflow. SUB wraps modulo 16 and sets carry on **borrow**. JC tests that same flag.
- ALU instructions update Z and C; bitwise operations clear C. LDI and LDA update only Z. LDB, stores, branches and OUT retain flags.
- No signed overflow flag, stack, interrupts, indirect addressing, B-from-RAM instruction or external I/O input exists.
- RTL declares `update_zero` as a control output, but the CPU directly updates zero in its load/ALU branches. Emulator mirrors actual behavior.

## Verification

`npm test` runs 11 CPU/assembler/RTL test groups plus 5 boot-session tests, covering reset, all 256 instruction decodings, arithmetic and borrow, exhaustive bitwise cases, RAM, flag retention, branches, wrap, halt, assembler validity/errors and all bundled examples.

Differential simulation first checks that the published source copy is byte-for-byte identical to the authoritative hardware RTL, then compiles the copied RTL with Icarus Verilog and compares **3,457** results/state snapshots: all 1,536 ALU input/operation combinations, 48 deterministic random program traces, every opcode at every operand nibble, and reset with retained RAM. Full snapshots include PC, A, B, output, all flags, instruction wire and every RAM cell. The original unchanged addition testbench is also compiled and run in a temporary directory and confirms:

```
PASS: 5 + 3 = 8; OUT=8; HLT holds CPU
```

No emulator/RTL discrepancies were found. These finite simulation checks are not formal verification. TypeScript checks and production build pass. The startup sequence was checked in headless Chrome at desktop and mobile sizes, including first visit, refresh, fresh tab, skip/focus restoration, reduced motion, storage denial, overlay removal and simulator addition after reveal. Native fullscreen/clipboard support still needs a manual browser check. Fullscreen and clipboard depend on browser permissions and support; clipboard failures are shown in the source panel.

## Repository publication

This application and `../MiniCore4-Hierarchical/` belong to the single **MiniCore-4** repository. See the [root project README](../README.md) for the portfolio overview and combined setup. The license is pending the owner's decision. Current asset paths expect domain-root hosting; GitHub Pages project-subpath deployment is not configured.

## Cinematic startup

`src/components/BootSequence/BootSequence.tsx` wraps the existing app in `main.tsx` without changing simulator logic. The app mounts immediately under a fixed, almost-black overlay. SVG/CSS draws a metallic processor, routed electrical pulses, pins, internal traces, and staged illumination. The 3.9-second sequence advances through offline (0–0.6s), electrical activation (0.6–1.6s), initialization (1.6–2.7s), ready (2.7–3.3s), and a 0.6-second reveal. POWER/CLOCK/ALU/MEMORY indicators are explicitly decorative, not hardware diagnostics.

`bootSession.ts` uses `sessionStorage` key `minicore4_boot_seen`. The marker is written when the intro starts, so refresh during playback does not restart it. Standard tab session storage behavior applies: independent new tabs start fresh; browsers may copy session storage when duplicating a tab or opening one with an opener. Denied storage falls back to once per loaded page; persistence across refresh is unavailable in that case.

Skip cancels phase advancement and fades out in 180ms. Reduced motion bypasses the overlay immediately; changing that preference during playback also dismisses it. The underlying page is inert and hidden from assistive technology only while the intro is visible. The skip button stays keyboard accessible without a focus trap, with focus restored to the page if it was on the disappearing button. All phase/reveal timers and the media-query listener are cleaned up on completion, skip, or unmount. No frame loop, video, canvas, new dependencies, or hardware changes are introduced.

The five boot-session unit tests cover fresh/seen sessions, reduced motion, storage errors, and independent tabs. Run with the existing `npm test` command. To replay manually, clear only `minicore4_boot_seen` from the tab's Session Storage in browser developer tools and refresh.

## Signal waveforms

The **Signal Waveforms** navigation item opens a digital timing viewer. Digital
waveforms show signal values over time: one-bit signals have high/low levels,
and buses have labeled value segments. Gold marks the selected time; dashed RTL
markers identify rising clock edges (not necessarily executed instructions).

- **Live Emulator** uses the existing STEP/RUN execution path. Each snapshot is
  the settled state at an instruction boundary, with the executed mnemonic shown
  at the resulting step. Click an execution-history summary or a recorded-step
  button to select that boundary. Selecting old steps inspects history without
  rewinding the processor. The current `instruction` bus shows the *next* ROM[PC]
  instruction after a step; HLT keeps PC fixed. History retains 256 instructions
  plus their baseline. Reset/load replaces the trace; Clear Live Trace starts a
  new baseline at the current CPU state without changing execution history.
- **Verilog RTL Simulation** reads `public/waveforms/minicore4.vcd`, generated by
  the original Icarus testbench. It contains actual simulated timestamps at a
  1 ps timescale, asynchronous reset, clock edges, instruction enables, and
  settled changes within the same timestamp. It is the bundled addition test,
  independent of programs edited in the browser. Neither mode measures physical
  electrical signals, and the browser emulator does not execute Verilog.

Signals use RTL names and widths: `pc`, `acc`, `reg_b`, `out_port`, `opcode`, and
`alu_result` are 4 bits; `instruction` is 8 bits; `carry_flag`, `zero_flag`, and
`halted` are 1 bit. RTL additionally shows 1-bit `clk`, `reset`, and `step`.
There is no latched IR. Live `alu_result` is calculated from the shared emulator
ALU at each snapshot, including the decoder's default ADD operation for non-ALU
instructions. Live mode has no clock/reset pin trace and invents no sub-cycle
transitions. Unknown and high-impedance values retain X/Z, with amber bus segments
and no misleading decimal conversion.

Select a signal name (mouse or keyboard) to inspect its description, width,
binary, hex, decimal, and selected time. Drag within the plot or use the time
slider; hover to read values at other times. Previous/Next Transition navigates
the selected signal. Zoom In/Out changes the horizontal scale (1–32×); scroll
horizontally to explore. Fit to Screen restores the fitted scale while preserving
the cursor; Reset View also selects the baseline. Toggle Binary/Hexadecimal
changes bus labels. Download VCD is available in RTL mode and downloads the
original, complete simulation dump, including internal hierarchy.

Regenerate the bundled asset from these sibling checkouts with Icarus installed:

```sh
npm run waveforms:generate
```

This runs `../MiniCore4-Hierarchical/scripts/run.sh`, preserves all existing
assertions, writes hardware `build/minicore4.vcd`, then copies that VCD into
`public/waveforms/`. Vite copies it unchanged to `dist/waveforms/`. No simulator,
backend, or paid service is required in production. Ordinary production builds
use the bundled asset and do not require Icarus. Regeneration requires the sibling
hardware checkout and `iverilog`/`vvp` on PATH.

`npm test` includes VCD timestamp/width/X/Z/alias tests, known RTL register
transitions, live instruction sampling, reset/clear, and bounded-history checks.
The parser intentionally selects the original `minicore4_tb.dut` scope rather
than guessing signal identity from unrelated modules. It is a viewer for the
bundled digital VCD, not a general-purpose analog or arbitrary VCD importer.
Zero-time delta activity is represented by the final value at each VCD timestamp;
the VCD format does not encode delta-cycle ordering as distinct physical times.
