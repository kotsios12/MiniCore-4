import {execFileSync} from 'node:child_process';
import {copyFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const hardware=fileURLToPath(new URL('../../MiniCore4-Hierarchical/',import.meta.url));
execFileSync('bash',['scripts/run.sh'],{cwd:hardware,stdio:'inherit'});
const output=new URL('../public/waveforms/',import.meta.url);
mkdirSync(output,{recursive:true});
copyFileSync(new URL('build/minicore4.vcd',new URL('file://'+hardware)),new URL('minicore4.vcd',output));
console.log('Copied actual Icarus VCD to public/waveforms/minicore4.vcd');
