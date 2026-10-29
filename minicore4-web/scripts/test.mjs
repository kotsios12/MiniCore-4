import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
import {reset,step,alu,assemble,decode,programs,ISA} from '../src/simulator/core.ts'
function run(code){let s=reset(assemble(code).words);for(let i=0;i<100&&!s.halted;i++)s=step(s);return s}
test('reset initializes registers and flags, preserves supplied RAM',()=>{let s=run('LDI 7\nSTA 4\nHLT');s=reset(s.rom,s.ram);assert.deepEqual([s.pc,s.acc,s.b,s.out,s.zero,s.carry,s.halted,s.ram[4]],[0,0,0,0,true,false,false,7])})
test('all 256 instruction words decode into exact nibbles',()=>{for(let w=0;w<256;w++){const d=decode(w);assert.equal(d.opcode,w>>4);assert.equal(d.operand,w&15);assert.equal(d.mnemonic,ISA[w>>4][0])}})
test('addition, overflow, subtraction and borrow',()=>{assert.deepEqual(alu(15,1,0),{result:0,carry:true,zero:true});assert.deepEqual(alu(3,5,1),{result:14,carry:true,zero:false});assert.deepEqual(alu(5,3,1),{result:2,carry:false,zero:false});assert.equal(run(programs[0].code).out,8)})
test('bitwise ALU operations clear carry and update zero',()=>{for(let a=0;a<16;a++)for(let b=0;b<16;b++)for(let op=2;op<6;op++){const expected=[a&b,a|b,a^b,(~a)&15][op-2];assert.deepEqual(alu(a,b,op),{result:expected,carry:false,zero:expected===0})}})
test('store/load, flag retention, branches and PC wrap',()=>{assert.equal(run('LDI 7\nSTA 12\nLDI 0\nLDA 12\nOUT\nHLT').out,7);assert.equal(run('LDI 0\nJZ yes\nLDI 7\nyes: OUT\nHLT').out,0);assert.equal(run('LDI 1\nJZ 4\nOUT\nHLT').out,1);assert.equal(run('LDI 15\nLDB 1\nADD\nLDI 5\nJC 7\nLDI 0\nHLT\nOUT\nHLT').out,5);let s=reset(Array(16).fill(0));for(let i=0;i<16;i++)s=step(s);assert.equal(s.pc,0)})
test('halt holds entire CPU and instruction wire tracks ROM at PC',()=>{let s=reset([0x15,0xf0]);s=step(s);assert.equal(s.rom[s.pc],0xf0);s=step(s);assert.equal(s.pc,1);assert.equal(step(s),s)})
test('assembler supports labels, hex, binary, comments and exact bytes',()=>{assert.deepEqual(assemble('start: LDI 0x5 ; hi\nLDB 0b11\nADD\nJMP start\nHLT'),{words:[0x15,0x23,0x30,0xb0,0xf0],errors:[]})})
test('invalid assembly reports line numbers and rejects program',()=>{for(const code of ['BAD','LDI 16','LDI -1','LDI 1.5','LDI nope','OUT 3','LDI','NOP\nJMP nowhere','a: NOP\na: HLT',Array(17).fill('NOP').join('\n'),'']){const r=assemble(code);assert.ok(r.errors.length,code);assert.equal(r.words.length,0)}})
test('all example programs reach their expected output',()=>{for(const p of programs){const s=run(p.code);assert.equal(s.halted,true,p.name);assert.equal(s.out,p.expected,p.name)}})
test('differential Icarus RTL: every ALU input and operation, every opcode, traces and reset',()=>{
 const dir=mkdtempSync(join(tmpdir(),'minicore4-test-'))
 try{
 const rtl=resolve('public/source/minicore4.v')
 assert.deepEqual(readFileSync(rtl),readFileSync(resolve('../MiniCore4-Hierarchical/rtl/minicore4.v')),'Published source copy must match authoritative hardware RTL')
 // Do not change or generate anything in the hardware project.
 writeFileSync(join(dir,'empty.hex'),Array(16).fill('00').join('\n'))
 const tb=`module tb;
 reg clk=0, reset=0, en=0; wire [3:0] pc,acc,b,outp,rd; wire z,c,h; wire [7:0] ins;
 reg [3:0] aa,bb; reg [2:0] op; wire [3:0] ar; wire ac,az;
 alu4 al(aa,bb,op,ar,ac,az);
 minicore4 #(.ROM_FILE("${join(dir,'empty.hex')}")) dut(clk,reset,en,pc,acc,b,outp,z,c,h,ins,rd);
 integer i,j,k,t,r; reg [31:0] seed=32'h12345678;
 task tick; begin #1;clk=1;#1; $write("S %0d %0d %0d %0d %0d %0d %0d %0d",pc,acc,b,outp,z,c,h,ins); for(r=0;r<16;r=r+1)$write(" %0d",dut.ram_unit.words[r]);$display("");clk=0;#1;end endtask
 initial begin
 for(i=0;i<6;i=i+1)for(j=0;j<16;j=j+1)for(k=0;k<16;k=k+1)begin op=i;aa=j;bb=k;#1;$display("A %0d %0d %0d %0d %0d %0d",i,j,k,ar,ac,az);end
 for(t=0;t<48;t=t+1)begin
 reset=1;#1;reset=0;
 for(i=0;i<16;i=i+1)begin seed=seed ^ (seed<<13);seed=seed ^ (seed>>17);seed=seed ^ (seed<<5);dut.rom_unit.words[i]=seed[7:0];$display("R %0d",seed[7:0]);end
 en=1;for(i=0;i<24;i=i+1)tick();
 end
 // Explicit instruction coverage: each opcode at each nibble operand.
 for(t=0;t<256;t=t+1)begin
 reset=1;#1;reset=0;
 dut.rom_unit.words[0]=8'h1f;dut.rom_unit.words[1]=8'h23;dut.rom_unit.words[2]=t;
 $display("T %0d",t);en=1;tick();tick();tick();
 end
 reset=1;#1;reset=0;$display("RESET");tick();
 $finish;end endmodule`
 writeFileSync(join(dir,'tb.v'),tb)
 execFileSync('iverilog',['-g2012','-s','tb','-o',join(dir,'sim'),rtl,join(dir,'tb.v')])
 const output=execFileSync('vvp',[join(dir,'sim')],{encoding:'utf8',maxBuffer:8*1024*1024})
 let s=reset(),rom=[],trace=0,checks=0
 for(const line of output.trim().split('\n')){
 const [tag,...ns]=line.split(' ');const v=ns.map(Number)
 if(tag==='A'){const [op,a,b,r,c,z]=v;assert.deepEqual(alu(a,b,op),{result:r,carry:!!c,zero:!!z});checks++}
 if(tag==='R'){rom.push(v[0]);if(rom.length===16){s=reset(rom,s.ram);rom=[];trace++}}
 if(tag==='T'){s=reset([0x1f,0x23,v[0],...s.rom.slice(3)],s.ram)}
 if(tag==='RESET')s=reset(s.rom,s.ram)
 if(tag==='S'){s=step(s);assert.deepEqual([s.pc,s.acc,s.b,s.out,+s.zero,+s.carry,+s.halted,s.rom[s.pc],...s.ram],v,`RTL trace ${trace}, step ${s.steps}`);checks++}
 }
 assert.ok(checks>3400,`Only ${checks} comparisons`)
 console.log(`Compared ${checks} ALU results and full CPU states directly against Icarus Verilog.`)
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('original hardware addition testbench passes unchanged',()=>{
 const dir=mkdtempSync(join(tmpdir(),'minicore4-original-'))
 try{
 mkdirSync(join(dir,'build'));mkdirSync(join(dir,'programs'));writeFileSync(join(dir,'programs/addition.hex'),['15','23','30','E0',...Array(12).fill('F0')].join('\n'))
 execFileSync('iverilog',['-g2012','-s','minicore4_tb','-o',join(dir,'sim'),resolve('public/source/minicore4.v'),resolve('../MiniCore4-Hierarchical/tb/minicore4_tb.v')])
 const output=execFileSync('vvp',[join(dir,'sim')],{cwd:dir,encoding:'utf8'});assert.ok(output.includes('PASS: 5 + 3 = 8; OUT=8; HLT holds CPU'))
 }finally{rmSync(dir,{recursive:true,force:true})}
})
