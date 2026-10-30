import { alu, decode } from '../../simulator/core.ts';
import type { CPU } from '../../simulator/core.ts';
import { descriptions } from './waveformTypes.ts';
import type { Trace, Signal } from './waveformTypes.ts';
export interface Entry { before: CPU; after: CPU }
export function valueAt(signal: Signal, time: number) {
 let lo=0,hi=signal.changes.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(signal.changes[mid].time<=time)lo=mid+1;else hi=mid;}
 return signal.changes[lo-1]?.value ?? 'x'.repeat(signal.width);
}
export function formatValue(value: string, radix: 'hex'|'bin') {
 if(radix==='bin') return value;
 if(/[xz]/i.test(value)) return value.toUpperCase();
 return '0x'+parseInt(value,2).toString(16).toUpperCase().padStart(Math.ceil(value.length/4),'0');
}
export function liveTrace(cpu: CPU, history: Entry[]): Trace {
 const states=history.length ? [history[0].before,...history.map(e=>e.after)] : [cpu];
 const names=['pc','instruction','opcode','acc','reg_b','alu_result','carry_flag','zero_flag','out_port','halted'];
 const labels: Record<number,string>={};
 states.forEach(s=>{labels[s.steps]=s.steps===states[0].steps ? `STEP ${s.steps} — baseline; next ${decode(s.rom[s.pc]).text}` : `STEP ${s.steps}`;});
 history.forEach(e=>{labels[e.after.steps]=`STEP ${e.after.steps} — ${decode(e.before.rom[e.before.pc]).text} (PC 0x${e.before.pc.toString(16).toUpperCase()})`;});
 const signals=names.map(name=>{
  const width=name==='instruction'?8:['carry_flag','zero_flag','halted'].includes(name)?1:4;
  const changes=states.map(s=>{
   const word=s.rom[s.pc],op=word>>4;
   const values: Record<string,number>={pc:s.pc,instruction:word,opcode:op,acc:s.acc,reg_b:s.b,alu_result:alu(s.acc,s.b,op>=3&&op<=8?op-3:0).result,carry_flag:+s.carry,zero_flag:+s.zero,out_port:s.out,halted:+s.halted};
   return {time:s.steps,value:values[name].toString(2).padStart(width,'0')};
  }).filter((v,i,a)=>!i||v.value!==a[i-1].value);
  return {name,width,description:descriptions[name],changes};
 });
 return {signals,end:cpu.steps+1,timescale:'instruction steps',source:'live',labels};
}
export function transitionTimes(trace: Trace, name: string) {return [...new Set(trace.signals.find(s=>s.name===name)?.changes.map(c=>c.time)??[])].sort((a,b)=>a-b);}
