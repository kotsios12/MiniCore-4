`timescale 1ns/1ps
module minicore4_tb;
  reg clk=0, reset=0, step=0;
  wire [3:0] pc,acc,reg_b,out_port,ram_read_data;
  wire zero_flag,carry_flag,halted;
  wire [7:0] instruction;
  minicore4 dut(.clk(clk),.reset(reset),.step(step),.pc(pc),.acc(acc),
    .reg_b(reg_b),.out_port(out_port),.zero_flag(zero_flag),
    .carry_flag(carry_flag),.halted(halted),.instruction(instruction),
    .ram_read_data(ram_read_data));
  always #5 clk=~clk;
  task tick;
    begin
      @(negedge clk); step=1;
      @(posedge clk); #1;
      $display("PC=%h IR=%h ACC=%h B=%h OUT=%h Z=%b C=%b HLT=%b",
        pc,instruction,acc,reg_b,out_port,zero_flag,carry_flag,halted);
      @(negedge clk); step=0;
    end
  endtask
  initial begin
    $dumpfile("build/minicore4.vcd");
    $dumpvars(0,minicore4_tb);
    #2; reset=1; #2; reset=0;
    tick(); if(acc!==4'd5) $fatal(1,"LDI failed");
    tick(); if(reg_b!==4'd3) $fatal(1,"LDB failed");
    tick(); if(acc!==4'd8) $fatal(1,"ADD failed");
    tick(); if(out_port!==4'd8) $fatal(1,"OUT failed");
    tick(); if(!halted) $fatal(1,"HLT failed");
    tick(); if(pc!==4'd4) $fatal(1,"Halted PC changed");
    $display("PASS: 5 + 3 = 8; OUT=8; HLT holds CPU");
    $finish;
  end
endmodule
