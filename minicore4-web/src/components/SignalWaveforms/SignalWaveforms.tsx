import { useEffect, useMemo, useRef, useState } from 'react';
import type { CPU } from '../../simulator/core';
import type { Entry } from './waveformUtils';
import { formatValue, liveTrace, transitionTimes, valueAt } from './waveformUtils';
import { parseVcd } from './vcdParser';
import type { Trace } from './waveformTypes';
import './SignalWaveforms.css';
const VCD_URL=import.meta.env.BASE_URL+'waveforms/minicore4.vcd';
export default function SignalWaveforms({cpu,history,selectedStep,onSelectStep,onClear}:{cpu:CPU;history:Entry[];selectedStep:number|null;onSelectStep:(step:number)=>void;onClear:()=>void}) {
 const [mode,setMode]=useState<'live'|'rtl'>('live'),[rtl,setRtl]=useState<Trace|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [radix,setRadix]=useState<'hex'|'bin'>('hex'),[selected,setSelected]=useState('acc'),[zoom,setZoom]=useState(1),[cursor,setCursor]=useState(0),[hover,setHover]=useState<{name:string;time:number}|null>(null),[viewport,setViewport]=useState(800);
 const scroll=useRef<HTMLDivElement>(null);
 useEffect(()=>{const abort=new AbortController();fetch(VCD_URL,{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error(`VCD request failed (${r.status})`);return r.text();}).then(t=>setRtl(parseVcd(t))).catch(e=>{if(e.name!=='AbortError')setError(String(e));});return()=>abort.abort();},[retry]);
 useEffect(()=>{const el=scroll.current;if(!el)return;const observer=new ResizeObserver(entries=>setViewport(Math.max(260,entries[0].contentRect.width-138)));observer.observe(el);return()=>observer.disconnect();},[]);
 const live=useMemo(()=>liveTrace(cpu,history),[cpu,history]);
 const trace=mode==='live'?live:rtl;
 const start=mode==='live'?(live.signals[0].changes[0]?.time??cpu.steps):0;
 const end=trace?.end??1,span=Math.max(1,end-start),plotWidth=Math.max(viewport,viewport*zoom);
 const current=Math.max(start,Math.min(end,mode==='live'?(selectedStep??cpu.steps):cursor));
 const x=(t:number)=>138+(t-start)/span*plotWidth;
 const pick=(time:number)=>{const t=Math.max(start,Math.min(end,mode==='live'?Math.floor(time):Math.round(time)));setCursor(t);if(mode==='live')onSelectStep(t);};
 const fromPointer=(e:React.PointerEvent<SVGSVGElement>)=>start+(e.clientX-e.currentTarget.getBoundingClientRect().left-138)/plotWidth*span;
 const signal=trace?.signals.find(s=>s.name===selected)??trace?.signals[0];
 const value=signal?valueAt(signal,current):'';
 const navigate=(direction:number)=>{if(!trace||!signal)return;const times=transitionTimes(trace,signal.name);const t=direction>0?times.find(t=>t>current):times.filter(t=>t<current).at(-1);if(t!==undefined){pick(t);scroll.current?.scrollTo({left:Math.max(0,x(t)-viewport/2),behavior:'smooth'});}};
 const resetView=()=>{setZoom(1);pick(start);scroll.current?.scrollTo({left:0});};
 return <section id="signal-waveforms">
  <div className="section-heading"><div><span className="section-number">TIMING LAB</span><h2>SIGNAL WAVEFORMS<span>.</span></h2><p>Explore the digital signals that drive MiniCore-4, cycle by cycle.</p></div></div>
  <div className="panel wave-panel">
   <div className="wave-modes" role="group" aria-label="Waveform source">{(['live','rtl'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);setZoom(1);setCursor(0);scroll.current?.scrollTo({left:0});}}>{m==='live'?'Live Emulator':'Verilog RTL Simulation'}</button>)}<span>{mode==='live'?'EMULATOR-DERIVED · INSTRUCTION SNAPSHOTS':'ICARUS VERILOG · BUNDLED ADDITION TEST'}</span></div>
   <p className="wave-explanation">{mode==='live'?'STEP and RUN in the simulator record settled states after each instruction. No sub-cycle edges are inferred. Reset or loading a program replaces this trace. Clock and reset pins are unavailable in the emulator.':'Actual simulated signals, not electrical measurements. This bundled 5 + 3 test does not change when you edit browser assembly. Registers execute only when step is high at a rising clk edge.'}</p>
   <div className="wave-toolbar" aria-label="Waveform controls">
    <button disabled={zoom>=32} onClick={()=>setZoom(z=>Math.min(32,z*2))}>Zoom In</button><button disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z/2))}>Zoom Out</button><button onClick={()=>{setZoom(1);scroll.current?.scrollTo({left:0});}}>Fit to Screen</button><button onClick={resetView}>Reset View</button>
    <button disabled={!signal?.changes.some(c=>c.time<current)} onClick={()=>navigate(-1)}>Previous Transition</button><button disabled={!signal?.changes.some(c=>c.time>current)} onClick={()=>navigate(1)}>Next Transition</button>
    <button onClick={()=>setRadix(r=>r==='hex'?'bin':'hex')}>{radix==='hex'?'Hexadecimal → Binary':'Binary → Hexadecimal'}</button>
    {mode==='rtl'?<a className="wave-download" href={VCD_URL} download="minicore4.vcd">Download VCD</a>:<button onClick={onClear}>Clear Live Trace</button>}
   </div>
   {mode==='rtl'&&error?<div role="alert" className="wave-explanation">{error} <button onClick={()=>{setError('');setRetry(r=>r+1);}}>Retry</button></div>:!trace?<p className="wave-explanation">Loading simulation…</p>:<>
    <div className="wave-readout"><strong>{mode==='live'?trace.labels?.[current]??`STEP ${current}`:`${current} × ${trace.timescale}`}</strong><span>{mode==='live'?'Latest 256 instructions retained':`Timescale ${trace.timescale} · dashed markers = rising clk edges`}</span></div>
    <div className="wave-scroll" ref={scroll}>
     <svg width={plotWidth+150} height={48+trace.signals.length*46} role="img" aria-label="Interactive digital signal waveforms" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pick(fromPointer(e));}} onPointerMove={e=>{if(e.buttons===1)pick(fromPointer(e));const row=Math.floor((e.clientY-e.currentTarget.getBoundingClientRect().top-42)/46);setHover(trace.signals[row]?{name:trace.signals[row].name,time:Math.max(start,Math.min(end,fromPointer(e)))}:null);}} onPointerLeave={()=>setHover(null)}>
      <rect width="100%" height="100%" fill="#0a1420"/>
      {Array.from({length:11},(_,i)=>{const t=start+span*i/10;return <g key={i}><line x1={x(t)} x2={x(t)} y1={30} y2="100%" stroke="#203342"/><text x={x(t)+3} y={21} fill="#7c9aae" fontSize={10}>{Number(t.toFixed(1))}{mode==='rtl'?` × ${trace.timescale}`:''}</text></g>;})}
      {mode==='rtl'&&trace.signals.find(s=>s.name==='clk')?.changes.filter(c=>c.value==='1').map((c,i)=><g key={c.time}><line x1={x(c.time)} x2={x(c.time)} y1={30} y2="100%" stroke="#3b6974" strokeDasharray="3 5"/><text x={x(c.time)+2} y={38} fill="#63939b" fontSize={8}>↑{i+1}</text></g>)}
      {trace.signals.map((s,row)=>{const y=44+row*46,color=selected===s.name?'#63f1d6':'#58afcc';const segments=s.changes.map((c,i)=>({...c,end:s.changes[i+1]?.time??end}));if(!segments.length||segments[0].time>start)segments.unshift({time:start,value:'x'.repeat(s.width),end:segments[0]?.time??end});return <g key={s.name}>
       <rect x={0} y={y-2} width="100%" height={44} fill={selected===s.name?'#15383166':row%2?'#10203055':'transparent'}/>
       {segments.map((c,i)=>{const left=x(c.time),right=x(c.end),unknown=/[xz]/.test(c.value),stroke=unknown?'#dcb473':color;if(right<138)return null;return <g key={i}><title>{s.name}: {formatValue(c.value,radix)} · {c.time} {trace.timescale}</title>{s.width===1&&!unknown?<path d={`M ${left} ${y+(c.value==='1'?8:30)} H ${right} ${i+1<segments.length?`V ${y+(segments[i+1].value==='1'?8:30)}`:''}`} fill="none" stroke={stroke} strokeWidth={2}/>:<><path d={`M ${left} ${y+19} l 4 -11 H ${Math.max(left+4,right-4)} L ${right} ${y+19} l -4 11 H ${left+4} Z`} fill={unknown?'#45341a55':'#14374377'} stroke={stroke}/>{right-left>24&&<text x={(left+right)/2} y={y+23} textAnchor="middle" fill={stroke} fontSize={10} textLength={Math.min(right-left-10,formatValue(c.value,radix).length*6)} lengthAdjust="spacingAndGlyphs">{formatValue(c.value,radix)}</text>}</>}</g>;})}
       <rect x={0} y={y-2} width={134} height={44} fill="#101e2b"/><text role="button" tabIndex={0} aria-label={`Inspect ${s.name}`} onPointerDown={e=>{e.stopPropagation();setSelected(s.name);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(s.name);}}} x={12} y={y+23} fill={color} fontSize={11} style={{cursor:'pointer'}}>{s.name}<tspan fill="#658294" fontSize={9}> [{s.width}]</tspan></text>
      </g>;})}
      <line x1={x(current)} x2={x(current)} y1={30} y2="100%" stroke="#ffcd78" strokeWidth={2}/>
     </svg>
    </div>
    <div className="wave-hover" aria-live="polite">{hover?`${hover.name} = ${formatValue(valueAt(trace.signals.find(s=>s.name===hover.name)!,hover.time),radix)} at ${Number(hover.time.toFixed(2))} ${trace.timescale}`:'Drag the gold cursor or use the timestamp control. Select a signal name to inspect it.'}</div>
    <label className="wave-cursor">{mode==='live'?'Instruction step':'Simulation timestamp'} <input aria-label="Waveform time cursor" type="range" min={start} max={mode==='live'?end-1:end} step={1} value={Math.min(current,mode==='live'?end-1:end)} onChange={e=>pick(Number(e.target.value))}/><output>{current}</output></label>
    {mode==='live'&&<div className="wave-steps" aria-label="Recorded instruction steps">{Object.entries(trace.labels??{}).map(([t,label])=><button key={t} aria-pressed={current===Number(t)} onClick={()=>pick(Number(t))}>{label}</button>)}</div>}
    {signal&&<div className="wave-inspector"><div><span>SIGNAL INSPECTOR</span><h3>{signal.name}</h3><p>{signal.description}</p></div><dl><dt>Width</dt><dd>{signal.width} bit{signal.width>1?'s':''}</dd><dt>Binary</dt><dd>{value}</dd><dt>Hexadecimal</dt><dd>{formatValue(value,'hex')}</dd><dt>Decimal</dt><dd>{/[xz]/.test(value)?'Unknown / high impedance':parseInt(value,2)}</dd><dt>{mode==='live'?'Step':'Timestamp'}</dt><dd>{current} {mode==='rtl'?`× ${trace.timescale}`:''}</dd></dl></div>}
   </>}
  </div>
 </section>;
}
