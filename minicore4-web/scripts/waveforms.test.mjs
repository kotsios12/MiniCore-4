import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseVcd,normalize} from '../src/components/SignalWaveforms/vcdParser.ts';
import {liveTrace,valueAt,formatValue,transitionTimes} from '../src/components/SignalWaveforms/waveformUtils.ts';
import {reset,step} from '../src/simulator/core.ts';
const vcd=readFileSync(new URL('../public/waveforms/minicore4.vcd',import.meta.url),'utf8');
test('bundled real Icarus trace preserves widths, timestamps, clock and addition',()=>{
 const t=parseVcd(vcd); assert.equal(t.timescale,'1ps');assert.equal(t.end,120000);
 const s=n=>t.signals.find(s=>s.name===n);
 assert.equal(t.signals.length,13);assert.equal(s('instruction').width,8);assert.equal(s('alu_result').width,4);
 assert.equal(valueAt(s('acc'),0),'xxxx');assert.equal(valueAt(s('reset'),2000),'1');assert.equal(valueAt(s('reset'),4000),'0');
 assert.equal(valueAt(s('acc'),15000),'0101');assert.equal(valueAt(s('reg_b'),35000),'0011');assert.equal(valueAt(s('acc'),55000),'1000');assert.equal(valueAt(s('out_port'),75000),'1000');assert.equal(valueAt(s('halted'),95000),'1');assert.equal(valueAt(s('pc'),120000),'0100');
 assert.ok(s('clk').changes.length>20);assert.deepEqual(transitionTimes(t,'acc'),[0,2000,15000,55000]);
});
test('VCD scalar aliases, vector extension, X/Z, timescale and metadata',()=>{
 const t=parseVcd('$comment data #100 b1111 a $end $timescale 10 ns $end $scope module minicore4_tb $end $scope module dut $end $var wire 4 a acc $end $var wire 4 a reg_b $end $var wire 1 ! halted $end $upscope $end $upscope $end $enddefinitions $end #0 $dumpvars bx a X! $end #5 bz a #12 b1 a 1!');
 assert.equal(t.timescale,'10ns');assert.equal(t.end,12);for(const s of t.signals.filter(s=>s.width===4)){assert.equal(valueAt(s,0),'xxxx');assert.equal(valueAt(s,5),'zzzz');assert.equal(valueAt(s,12),'0001');}assert.equal(valueAt(t.signals.find(s=>s.name==='halted'),0),'x');assert.equal(normalize('z',4),'zzzz');assert.throws(()=>parseVcd('garbage'));
 assert.equal(formatValue('1000','hex'),'0x8');assert.equal(formatValue('00001000','hex'),'0x08');assert.equal(formatValue('1000','bin'),'1000');assert.equal(formatValue('10xz','hex'),'10XZ');
});
test('live stepping, run-to-halt, clear, load/reset and bounded history keep instruction boundaries',()=>{
 let cpu=reset([0x15,0x23,0x30,0xe0,0xf0]);const history=[];
 while(!cpu.halted){const before=cpu;cpu=step(cpu);history.push({before,after:cpu});}
 let t=liveTrace(cpu,history);const acc=t.signals.find(s=>s.name==='acc');assert.equal(valueAt(acc,2),'0101');assert.equal(valueAt(acc,3),'1000');assert.match(t.labels[3],/ADD/);assert.equal(t.signals.some(s=>['clk','reset','ir'].includes(s.name)),false);
 assert.equal(valueAt(t.signals.find(s=>s.name==='alu_result'),3),'1011'); // next OUT defaults to combinational ADD 8+3
 t=liveTrace(cpu,[]);assert.equal(t.signals[0].changes[0].time,5);
 cpu=reset(cpu.rom,cpu.ram);t=liveTrace(cpu,[]);assert.equal(t.end,1);assert.equal(valueAt(t.signals.find(s=>s.name==='acc'),0),'0000');
 cpu=reset(Array(16).fill(0));let bounded=[];for(let i=0;i<600;i++){const before=cpu;cpu=step(cpu);bounded=[...bounded.slice(-255),{before,after:cpu}];}t=liveTrace(cpu,bounded);assert.equal(bounded.length,256);assert.equal(t.signals[0].changes[0].time,344);assert.equal(Object.keys(t.labels).length,257);
});
