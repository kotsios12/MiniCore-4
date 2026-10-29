#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
# These three diagrams are readable architecture/interface views.
for name in architecture alu control; do
  dot -Tsvg "diagrams/$name.dot" -o "build/${name}_overview.svg"
done
# These are actual Yosys-derived module netlists; intentionally smaller than CPU-wide dump.
for module in half_adder full_adder ripple_adder4 alu4 instruction_decoder control_unit; do
  yosys -Q -T -q -p "read_verilog rtl/minicore4.v; hierarchy -top $module; proc; opt; show -format svg -prefix build/${module}_rtl $module"
done
printf 'Generated readable overview diagrams and per-module RTL schematics in build/\n'
