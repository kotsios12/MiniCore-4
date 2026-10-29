import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { markBootSeen, shouldPlayBoot } from "./bootSession";
import "./BootSequence.css";

type Phase = "offline" | "power" | "initializing" | "ready" | "reveal";
const traces = [
  "M0 150H200L260 210H350L390 250H470",
  "M0 310H250L300 260H380L420 290H470",
  "M0 490H190L250 430H360L400 390H470",
  "M180 0V85L290 195H400L440 230V270H470",
  "M430 0V130L510 160V180",
  "M640 0V130L590 160V180",
  "M1200 120H1000L900 220H800L750 270H730",
  "M1200 320H900L850 290H730",
  "M1200 490H1000L930 420H800L770 390H730",
  "M1010 650V560L880 430H800L760 350H730",
  "M430 650V530L510 500V480",
  "M680 650V520L590 500V480",
];
const pins = Array.from({ length: 10 }, (_, i) => 493 + i * 24);
const innerTraces = [
  "M501 266V290H540L558 308",
  "M525 266V280H570V300",
  "M597 266V287H620L637 304",
  "M669 266V290H651L643 308",
  "M699 290H674L659 315",
  "M699 338H666",
  "M699 386H671L652 367",
  "M675 394V375H657",
  "M501 386H530L545 365",
  "M501 338H534",
  "M525 394V378H552",
  "M573 394V382",
];

function ProcessorBoard() {
  return (
    <svg
      className="boot-board"
      viewBox="0 0 1200 660"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="boot-metal"
          x1="470"
          y1="240"
          x2="730"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#35414a" />
          <stop offset=".22" stopColor="#121c26" />
          <stop offset=".7" stopColor="#101a23" />
          <stop offset="1" stopColor="#25363e" />
        </linearGradient>
        <linearGradient
          id="boot-face"
          x1="490"
          y1="250"
          x2="690"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1b2a35" />
          <stop offset=".45" stopColor="#101c26" />
          <stop offset="1" stopColor="#0b151e" />
        </linearGradient>
        <linearGradient id="boot-pin" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#65747d" />
          <stop offset=".25" stopColor="#283640" />
          <stop offset=".55" stopColor="#73818a" />
          <stop offset="1" stopColor="#26343e" />
        </linearGradient>
        <radialGradient id="boot-pool">
          <stop stopColor="#3edbc1" stopOpacity=".15" />
          <stop offset="1" stopColor="#3edbc1" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="boot-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M40 0H0V40" stroke="#83b4bb" strokeOpacity=".06" />
        </pattern>
        <filter id="boot-shadow" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow
            dx="0"
            dy="16"
            stdDeviation="18"
            floodColor="#000"
            floodOpacity=".8"
          />
        </filter>
      </defs>
      <rect
        className="boot-grid"
        width="1200"
        height="660"
        fill="url(#boot-grid)"
      />
      <ellipse
        className="boot-light-pool"
        cx="600"
        cy="330"
        rx="370"
        ry="290"
        fill="url(#boot-pool)"
      />
      <g className="boot-trace-bed" stroke="#29404a" strokeWidth="1.2">
        {traces.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {[
          ["200", "150"],
          ["250", "310"],
          ["190", "490"],
          ["1000", "120"],
          ["900", "320"],
          ["1000", "490"],
          ["430", "130"],
          ["680", "520"],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#0a141d" />
        ))}
      </g>
      <g className="boot-energy" stroke="#6ef5da" strokeWidth="2" strokeLinecap="round">
        {traces.map((d, i) => (
          <path className="boot-pulse" key={i} d={d} pathLength="100"
            style={{ animationDelay: `${0.64 + (i % 6) * 0.09}s` }} />
        ))}
      </g>
      <g className="boot-return" stroke="#4bd9c4" strokeWidth="1.5" strokeLinecap="round">
        {traces.map((d, i) => (
          <path key={i} d={d} pathLength="100"
            style={{ animationDelay: `${2.72 + (i % 4) * 0.04}s` }} />
        ))}
      </g>
      <g className="boot-package">
        <rect
          className="boot-ripple"
          x="470"
          y="200"
          width="260"
          height="260"
          rx="12"
          stroke="#6fe9cf"
          strokeWidth="1"
        />
        <g className="boot-pins">
          {pins.map((x, i) => (
            <g
              key={x}
              style={{ "--pin-delay": `${1.12 + i * 0.035}s` } as CSSProperties}
            >
              <rect x={x} y="180" width="9" height="25" rx="1.5" />
              <rect x={x} y="456" width="9" height="25" rx="1.5" />
            </g>
          ))}
          {Array.from({ length: 10 }, (_, i) => 228 + i * 24).map((y, i) => (
            <g
              key={y}
              style={{ "--pin-delay": `${1.18 + i * 0.045}s` } as CSSProperties}
            >
              <rect x="450" y={y} width="25" height="9" rx="1.5" />
              <rect x="726" y={y} width="25" height="9" rx="1.5" />
            </g>
          ))}
        </g>
        <rect
          x="470"
          y="207"
          width="260"
          height="260"
          rx="9"
          fill="#060d13"
          stroke="#1e2d35"
        />
        <rect
          x="470"
          y="200"
          width="260"
          height="260"
          rx="9"
          fill="url(#boot-metal)"
          stroke="#52616a"
          strokeOpacity=".6"
          filter="url(#boot-shadow)"
        />
        <rect
          x="479"
          y="209"
          width="242"
          height="242"
          rx="5"
          fill="url(#boot-face)"
          stroke="#344651"
        />
        <path d="M485 215H715" stroke="#70838c" strokeOpacity=".15" />
        <rect
          className="boot-edge"
          x="479"
          y="209"
          width="242"
          height="242"
          rx="5"
          stroke="#5de8d0"
        />
        <g className="boot-internal" stroke="#3b988c" strokeWidth=".8">
          {innerTraces.map((d, i) => (
            <path key={i} d={d} />
          ))}
          {[501, 525, 597, 669].map((x) => (
            <circle key={x} cx={x} cy="266" r="2" />
          ))}
        </g>
        <g
          className="boot-symbol"
          stroke="#74f3d8"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="581" y="280" width="38" height="38" rx="4" />
          <rect x="590" y="289" width="20" height="20" rx="1" />
          <path d="M590 275v5m10-5v5m10-5v5m-20 38v5m10-5v5m10-5v5m-34-34h5m-5 10h5m-5 10h5m38-20h5m-5 10h5m-5 10h5" />
        </g>
        <text className="boot-chip-name" x="600" y="357" textAnchor="middle">
          MC-04
        </text>
        <text className="boot-chip-label" x="600" y="378" textAnchor="middle">
          4-BIT MICROPROCESSOR
        </text>
        <circle cx="491" cy="439" r="3" fill="#485965" />
        <path
          d="M691 435h16m-16 3h16m-16 3h16"
          stroke="#41545f"
          strokeWidth=".7"
        />
      </g>
      <g className="boot-arcs" strokeLinecap="round" strokeLinejoin="round">
        {[
          { delay: 1.35, path: 'M450 256L433 247L439 232L418 236L424 217L402 202', branch: 'M418 236L402 231L395 218' },
          { delay: 1.73, path: 'M751 280L770 267L764 252L785 256L779 235L799 221', branch: 'M785 256L802 249L811 234' },
          { delay: 2.12, path: 'M751 352L771 340L765 325L787 329L782 307L802 294', branch: 'M787 329L803 323L811 308' },
          { delay: 2.95, path: 'M622 180L633 160L620 153L639 135L630 119L642 103', branch: 'M639 135L656 131L666 116' },
          { delay: 3.34, path: 'M450 400L432 412L438 428L417 424L423 445L403 459', branch: 'M417 424L400 431L392 446' },
          { delay: 3.72, path: 'M522 481L509 498L522 508L503 523L511 542L491 554', branch: 'M503 523L486 526L477 542' },
        ].map(({delay,path,branch},i)=>(
          <g key={i} className="boot-arc" style={{animationDelay:`${delay}s`}}>
            <path className="boot-arc-halo" d={path}/>
            <path className="boot-arc-core" d={path}/>
            <path className="boot-arc-branch" d={branch}/>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function BootSequence({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(shouldPlayBoot);
  const [phase, setPhase] = useState<Phase>("offline");
  const [skipped, setSkipped] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    markBootSeen();
    if (!visible) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handlePreference = () => {
      if (preference.matches) {
        restoreFocus.current ||= document.activeElement === skipButton.current;
        setVisible(false);
      }
    };
    handlePreference();
    preference.addEventListener("change", handlePreference);
    return () => preference.removeEventListener("change", handlePreference);
  }, [visible]);

  useEffect(() => {
    if (!visible || skipped) return;
    const timings: [number, Phase][] = [
      [600, "power"],
      [1600, "initializing"],
      [2700, "ready"],
      [4300, "reveal"],
    ];
    const timers = timings.map(([delay, next]) =>
      window.setTimeout(() => setPhase(next), delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [visible, skipped]);

  useEffect(() => {
    if (!visible || phase !== "reveal") return;
    const timer = window.setTimeout(
      () => {
        restoreFocus.current ||= document.activeElement === skipButton.current;
        setVisible(false);
      },
      skipped ? 180 : 600,
    );
    return () => window.clearTimeout(timer);
  }, [visible, phase, skipped]);

  useEffect(() => {
    if (!visible && restoreFocus.current) {
      page.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const padding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${padding + scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [visible]);

  const skip = () => {
    restoreFocus.current = document.activeElement === skipButton.current;
    markBootSeen();
    setSkipped(true);
    setPhase("reveal");
  };
  return (
    <>
      <div
        ref={page}
        className="boot-page"
        inert={visible}
        aria-hidden={visible ? true : undefined}
        tabIndex={-1}
      >
        {children}
      </div>
      {visible && (
        <div
          className={`boot-sequence${skipped ? " boot-skipped" : ""}`}
          data-phase={phase}
          role="region"
          aria-label="MiniCore-4 animated introduction"
        >
          <div className="boot-vignette" />
          <div className="boot-topline" aria-hidden="true">
            <span className="boot-wordmark">
              MINICORE<span>4</span>
            </span>
            <span>
              PROCESSOR LAB <b>/</b> POWER-ON SEQUENCE
            </span>
          </div>
          <div className="boot-scene" aria-hidden="true">
            <ProcessorBoard />
          </div>
          <div className="boot-readout" aria-hidden="true">
            <div className="boot-offline">
              MINICORE-4 <span>//</span> SYSTEM OFFLINE
            </div>
            <div className="boot-initializing">
              INITIALIZING MINICORE-4<span className="boot-ellipsis">...</span>
            </div>
            <div className="boot-checks">
              {["POWER", "CLOCK", "ALU", "MEMORY"].map((name, i) => (
                <div
                  key={name}
                  style={{ animationDelay: `${1.72 + i * 0.22}s` }}
                >
                  <span>{name}</span>
                  <span className="boot-dots" />
                  <b>OK</b>
                </div>
              ))}
            </div>
            <div className="boot-ready">
              <i />
              SYSTEM READY<small>LOGIC TO LIFE.</small>
            </div>
          </div>
          <span className="boot-sr-only" role="status">
            {phase === "ready" || phase === "reveal"
              ? "System ready. Opening the processor lab."
              : "MiniCore-4 introduction. Skip intro to open the processor lab immediately."}
          </span>
          <div className="boot-bottomline">
            <span>
              VISUAL STARTUP SEQUENCE <b>·</b> NOT HARDWARE DIAGNOSTICS
            </span>
            <button
              ref={skipButton}
              type="button"
              className="boot-skip"
              onClick={skip}
              disabled={skipped}
              aria-label="Skip intro and open MiniCore-4"
            >
              SKIP INTRO <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
