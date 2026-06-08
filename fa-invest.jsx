// fa-invest.jsx — interactive compound-interest simulator (S&P 500 style)
// for the bottom of the Tipy screen. Monthly contribution + years + expected
// annual return → projected value with reinvested dividends, an area chart that
// separates contributions from compound gains, and a short educational caption.

const { useState: useInvState, useMemo: useInvMemo, useEffect: useInvEffect } = React;

function InvestSim() {
  const [monthly, setMonthly] = useInvState(500);
  const [years, setYears] = useInvState(20);
  const [rateKey, setRateKey] = useInvState('avg');
  const RATES = { cons: 0.06, avg: 0.08, opt: 0.10 };
  const r = RATES[rateKey];

  // year-by-year projection (monthly deposits, monthly compounding)
  const data = useInvMemo(() => {
    const i = r / 12;
    const pts = [];
    for (let y = 0; y <= years; y++) {
      const n = y * 12;
      const fv = i > 0 ? monthly * ((Math.pow(1 + i, n) - 1) / i) : monthly * n;
      pts.push({ y, fv, contributed: monthly * n });
    }
    return pts;
  }, [monthly, years, r]);

  const final = data[data.length - 1];
  const contributed = final.contributed;
  const gains = Math.max(final.fv - contributed, 0);

  // ── chart geometry ──
  const W = 300, H = 132;
  const maxV = Math.max(final.fv * 1.08, 1);
  const n = data.length;
  const X = (idx) => (n > 1 ? (idx / (n - 1)) * W : 0);
  const Y = (v) => H - (v / maxV) * H;

  const contribArea = (() => {
    let d = `M 0 ${H}`;
    data.forEach((p, idx) => { d += ` L ${X(idx).toFixed(1)} ${Y(p.contributed).toFixed(1)}`; });
    d += ` L ${W} ${H} Z`;
    return d;
  })();
  const gainsBand = (() => {
    let d = `M ${X(0)} ${Y(data[0].fv).toFixed(1)}`;
    data.forEach((p, idx) => { d += ` L ${X(idx).toFixed(1)} ${Y(p.fv).toFixed(1)}`; });
    for (let idx = n - 1; idx >= 0; idx--) { d += ` L ${X(idx).toFixed(1)} ${Y(data[idx].contributed).toFixed(1)}`; }
    d += ' Z';
    return d;
  })();
  const fvLine = data.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${X(idx).toFixed(1)} ${Y(p.fv).toFixed(1)}`).join(' ');
  const contribLine = data.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${X(idx).toFixed(1)} ${Y(p.contributed).toFixed(1)}`).join(' ');

  const rateOpts = [
    { k: 'cons', label: L('Opatrný'), pct: '6 %' },
    { k: 'avg',  label: L('Průměr'),  pct: '8 %' },
    { k: 'opt',  label: L('Odvážný'), pct: '10 %' },
  ];

  return (
    <Card pad={18} style={{ marginTop: 6 }}>
      {/* headline result */}
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 4 }}>{Lf('Za {y} let by sis naspořila', { y: years })}</div>
        <div style={{ fontFamily: 'var(--title)', fontSize: 36, fontWeight: 600, color: 'var(--ink)', lineHeight: 1, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>
          {fmt(Math.round(final.fv))}<span style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, color: 'var(--ink-soft)' }}>&nbsp;Kč</span>
        </div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--brand)', fontWeight: 600, marginTop: 6, whiteSpace: 'nowrap' }}>
          {Lf('z toho výnos +\u00a0{v}\u00a0Kč', { v: fmt(Math.round(gains)) })}
        </div>
      </div>

      {/* chart */}
      <div style={{ marginTop: 14, position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="faGainsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          {/* faint gridlines */}
          {[0.25, 0.5, 0.75].map((g, k) => (
            <line key={k} x1="0" y1={H * g} x2={W} y2={H * g} stroke="var(--card-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {/* contributions (lower band) */}
          <path d={contribArea} fill="var(--invest-contrib)" />
          {/* gains (upper band) */}
          <path d={gainsBand} fill="url(#faGainsGrad)" />
          {/* contributed boundary line */}
          <path d={contribLine} fill="none" stroke="var(--invest-contrib-solid)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="3 3" />
          {/* value line on top */}
          <path d={fvLine} fill="none" stroke="var(--brand)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: 'var(--sans)', fontSize: 10.5, color: 'var(--ink-faint)' }}>
          <span>{L('dnes')}</span><span>{Lf('za {y} let', { y: years })}</span>
        </div>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <Legend swatch="var(--invest-contrib-solid)" label={L('Vklady')} value={kc(Math.round(contributed))} />
        <Legend swatch="var(--brand)" label={L('Výnos (úroky)')} value={kc(Math.round(gains))} />
      </div>

      {/* controls */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <Slider label={L('Měsíčně vkládám')} value={`${fmt(monthly)} Kč`} min={100} max={5000} step={50} v={monthly} set={setMonthly} />
        <Slider label={L('Po dobu')} value={Lf('{y} let', { y: years })} min={5} max={40} step={1} v={years} set={setYears} />
        <div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 7 }}>{L('Očekávaný roční výnos')}</div>
          <div className="fa-seg">
            {rateOpts.map(o => (
              <button key={o.k} data-on={rateKey === o.k} onClick={() => setRateKey(o.k)}>
                {o.label}<span style={{ display: 'block', fontSize: 10.5, opacity: 0.8, fontWeight: 700 }}>{o.pct}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* educational caption */}
      <div className="fa-invest-note">
        <Icon name={rateKey === 'opt' ? 'bulb' : 'sprout'} size={15} stroke={1.7} />
        <p style={{ margin: 0 }}>
          {L('Složené úročení znamená, že výnosy samy vydělávají další výnosy. Index S&P\u00a0500 historicky vynesl s reinvesticí dividend zhruba 7–10\u00a0% ročně. Graf je zjednodušená ilustrace — minulé výnosy nezaručují budoucí a nejde o investiční doporučení.')}
        </p>
      </div>
    </Card>
  );
}

function Legend({ swatch, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: swatch, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{value}</div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, v, set }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
        <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
      </div>
      <input type="range" className="fa-range" min={min} max={max} step={step} value={v}
        style={{ ['--accent']: 'var(--brand)' }}
        onChange={e => set(+e.target.value)} />
    </div>
  );
}

Object.assign(window, { InvestSim });
