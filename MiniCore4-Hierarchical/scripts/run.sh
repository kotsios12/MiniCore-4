#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
iverilog -g2012 -s minicore4_tb -o build/minicore4_sim rtl/minicore4.v tb/minicore4_tb.v
vvp build/minicore4_sim
printf '\nWaveform: build/minicore4.vcd\n'
