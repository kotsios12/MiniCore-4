`timescale 1ns/1ps

module half_adder(input a,b, output sum,carry);
  assign sum=a^b;
  assign carry=a&b;
endmodule

module full_adder(input a,b,cin, output sum,cout);
  wire s1,c1,c2;
  half_adder h0(a,b,s1,c1);
  half_adder h1(s1,cin,sum,c2);
  assign cout=c1|c2;
endmodule

module ripple_adder4(input [3:0] a,b, input cin,
                     output [3:0] sum, output cout);
  wire [4:0] c;
  assign c[0]=cin;
  genvar i;
  generate for(i=0;i<4;i=i+1) begin: bits
    full_adder fa(a[i],b[i],c[i],sum[i],c[i+1]);
  end endgenerate
  assign cout=c[4];
endmodule

// op: 0 ADD, 1 SUB, 2 AND, 3 OR, 4 XOR, 5 NOT A
module alu4(input [3:0] a,b, input [2:0] op,
            output reg [3:0] result, output reg carry, output zero);
  wire sub=(op==3'd1);
  wire [3:0] arithmetic;
  wire arithmetic_carry;
  ripple_adder4 addsub(a,b^{4{sub}},sub,arithmetic,arithmetic_carry);
  always @* begin
    result=4'b0; carry=1'b0;
    case(op)
      3'd0: begin result=arithmetic; carry=arithmetic_carry; end
      3'd1: begin result=arithmetic; carry=~arithmetic_carry; end // borrow flag
      3'd2: result=a&b;
      3'd3: result=a|b;
      3'd4: result=a^b;
      3'd5: result=~a;
      default: result=4'b0;
    endcase
  end
  assign zero=(result==4'b0);
endmodule

// The following modules preserve meaningful architectural boundaries.
module program_rom #(parameter ROM_FILE="programs/addition.hex")(
    input [3:0] address, output [7:0] data);
  reg [7:0] words [0:15];
  integer i;
  initial begin
    for (i=0;i<16;i=i+1) words[i]=8'hF0;
    $readmemh(ROM_FILE, words);
  end
  assign data=words[address];
endmodule

module data_ram(input clk, input write_enable, input [3:0] address,
                input [3:0] write_data, output [3:0] read_data);
  reg [3:0] words [0:15];
  integer i;
  initial for (i=0;i<16;i=i+1) words[i]=4'h0;
  assign read_data=words[address];
  always @(posedge clk) if(write_enable) words[address]<=write_data;
endmodule

module instruction_decoder(input [7:0] instruction,
                           output [3:0] opcode, operand,
                           output reg [2:0] alu_op,
                           output is_alu);
  assign opcode=instruction[7:4];
  assign operand=instruction[3:0];
  assign is_alu=(opcode>=4'h3 && opcode<=4'h8);
  always @* begin
    case(opcode)
      4'h3: alu_op=3'd0;
      4'h4: alu_op=3'd1;
      4'h5: alu_op=3'd2;
      4'h6: alu_op=3'd3;
      4'h7: alu_op=3'd4;
      4'h8: alu_op=3'd5;
      default: alu_op=3'd0;
    endcase
  end
endmodule

module control_unit(input [3:0] opcode, input zero_flag, carry_flag,
                    output load_immediate, load_b, load_ram, store_ram,
                    output execute_alu, jump, output_port_write, halt,
                    output update_zero);
  assign load_immediate=(opcode==4'h1);
  assign load_b=(opcode==4'h2);
  assign execute_alu=(opcode>=4'h3 && opcode<=4'h8);
  assign store_ram=(opcode==4'h9);
  assign load_ram=(opcode==4'hA);
  assign jump=(opcode==4'hB) || (opcode==4'hC && zero_flag) ||
              (opcode==4'hD && carry_flag);
  assign output_port_write=(opcode==4'hE);
  assign halt=(opcode==4'hF);
  assign update_zero=load_immediate || load_ram || execute_alu;
endmodule

module minicore4 #(
  parameter ROM_FILE="programs/addition.hex"
)(
  input clk, reset, step,
  output reg [3:0] pc, acc, reg_b, out_port,
  output reg zero_flag, carry_flag, halted,
  output [7:0] instruction,
  output [3:0] ram_read_data
);
  wire [3:0] opcode,operand;
  wire [2:0] alu_op;
  wire is_alu;
  wire load_immediate,load_b,load_ram,store_ram,execute_alu;
  wire jump,output_port_write,halt,update_zero;
  wire [3:0] alu_result;
  wire alu_carry,alu_zero;
  wire ram_write=step && !halted && !reset && store_ram;

  program_rom #(.ROM_FILE(ROM_FILE)) rom_unit(pc,instruction);
  instruction_decoder decoder(instruction,opcode,operand,alu_op,is_alu);
  control_unit controller(opcode,zero_flag,carry_flag,
    load_immediate,load_b,load_ram,store_ram,execute_alu,
    jump,output_port_write,halt,update_zero);
  alu4 alu_unit(acc,reg_b,alu_op,alu_result,alu_carry,alu_zero);
  data_ram ram_unit(clk,ram_write,operand,acc,ram_read_data);

  always @(posedge clk or posedge reset) begin
    if(reset) begin
      pc<=0; acc<=0; reg_b<=0; out_port<=0;
      zero_flag<=1; carry_flag<=0; halted<=0;
    end else if(step && !halted) begin
      pc<=pc+4'd1;
      if(load_immediate) begin
        acc<=operand; zero_flag<=(operand==0);
      end
      if(load_b) reg_b<=operand;
      if(execute_alu) begin
        acc<=alu_result; zero_flag<=alu_zero; carry_flag<=alu_carry;
      end
      if(load_ram) begin
        acc<=ram_read_data; zero_flag<=(ram_read_data==0);
      end
      if(jump) pc<=operand;
      if(output_port_write) out_port<=acc;
      if(halt) begin halted<=1; pc<=pc; end
    end
  end
endmodule
