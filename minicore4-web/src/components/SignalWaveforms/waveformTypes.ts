export interface Transition { time: number; value: string }
export interface Signal { name: string; width: number; description: string; changes: Transition[] }
export interface Trace { signals: Signal[]; end: number; timescale: string; source: 'rtl' | 'live'; labels?: Record<number, string> }
export const descriptions: Record<string, string> = {
 clk: 'Simulation clock. Instructions execute on enabled rising edges.', reset: 'Asynchronous active-high register reset; RAM is retained.', step: 'Instruction enable sampled on the rising clock edge.', pc: '4-bit program counter; wraps at 16.', instruction: 'Combinational ROM[pc] output, not a latched instruction register.', opcode: 'Upper nibble of the current instruction.', acc: '4-bit accumulator.', reg_b: '4-bit B operand register.', alu_result: 'Combinational ALU output; defaults to ADD for non-ALU opcodes.', carry_flag: 'Stored carry on addition or borrow on subtraction.', zero_flag: 'Stored zero flag.', out_port: 'Output register, written by OUT.', halted: 'Halt latch; holds execution until reset.'
};
