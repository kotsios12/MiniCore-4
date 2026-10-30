import { descriptions } from './waveformTypes.ts';
import type { Trace, Signal } from './waveformTypes.ts';
export function normalize(value: string, width: number) {
 const v = value.toLowerCase();
 if (!/^[01xz]+$/.test(v) || v.length > width) throw new Error('Invalid VCD bit vector');
 return v.padStart(width, /^[xz]/.test(v) ? v[0] : '0');
}
export function parseVcd(text: string): Trace {
 const tokens = text.match(/\S+/g) ?? []; const scopes: string[] = [];
 const signals: Signal[] = []; const ids = new Map<string, Signal[]>();
 let time = 0, end = 0, timescale = '', definitions = true;
 for (let i=0;i<tokens.length;i++) {
  const t=tokens[i];
  if(t.startsWith('$')) {
   if(t === '$dumpvars' || t === '$dumpon' || t === '$dumpoff' || t === '$end') continue;
   const args: string[]=[]; while(++i<tokens.length && tokens[i]!=='$end') args.push(tokens[i]);
   if(t==='$timescale') timescale=args.join('');
   if(t==='$scope') scopes.push(args[1]);
   if(t==='$upscope') scopes.pop();
   if(t==='$enddefinitions') definitions=false;
   if(t==='$var' && scopes.join('.')==='minicore4_tb.dut' && descriptions[args[3]]) {
    const s: Signal={ name:args[3], width:Number(args[1]), description:descriptions[args[3]], changes:[] };
    signals.push(s); ids.set(args[2], [...(ids.get(args[2])??[]),s]);
   }
   continue;
  }
  if(definitions) continue;
  if(t[0]==='#') {time=Number(t.slice(1)); if(!Number.isSafeInteger(time)||time<end) throw new Error('Invalid VCD timestamp'); end=time; continue;}
  let id='',value='';
  if(/^[bB]/.test(t)) {value=t.slice(1); id=tokens[++i];}
  else if(/^[01xXzZ]/.test(t)) {value=t[0];id=t.slice(1);}
  for(const s of ids.get(id)??[]) {
   const v=normalize(value,s.width), last=s.changes.at(-1);
   if(last?.time===time) last.value=v;
   else if(last?.value!==v) s.changes.push({time,value:v});
  }
 }
 if(!timescale || !signals.length) throw new Error('No supported MiniCore-4 signals or timescale in VCD');
 return {signals: Object.keys(descriptions).flatMap(n=>signals.filter(s=>s.name===n)),end,timescale,source:'rtl'};
}
