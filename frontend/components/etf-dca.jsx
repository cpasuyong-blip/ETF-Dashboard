'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Navigation from './Navigation';

const COLOR_PALETTE = [
  '#8b5cf6','#10b981','#3b82f6','#f43f5e','#f59e0b',
  '#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6',
];
const PORTFOLIO_COLOR = '#fbbf24';

const CATEGORY_LABELS = {
  '미국_S&P500':'S&P500','미국_나스닥':'나스닥','미국_전체시장':'전체시장',
  '미국_소형중형':'소형/중형','미국_기술주':'기술주','미국_섹터':'섹터',
  '미국_채권':'채권','미국_배당':'배당','미국_커버드콜':'커버드콜',
  '미국_일드맥스':'일드맥스','미국_성장/가치':'성장/가치','미국_국제':'국제',
  '미국_금/원자재':'금/원자재','미국_리츠':'리츠','미국_테마':'테마',
  '미국_레버리지/인버스':'레버리지',
  '한국_미국S&P500':'S&P500(KR)','한국_미국나스닥':'나스닥(KR)',
  '한국_주식시장':'주식시장','한국_반도체/AI':'반도체/AI','한국_2차전지':'2차전지',
  '한국_바이오/헬스케어':'바이오','한국_채권':'채권(KR)','한국_금/원자재':'금/원자재(KR)',
  '한국_리츠/배당':'리츠/배당','한국_글로벌/선진국':'글로벌','한국_중국/아시아':'중국/아시아',
  '한국_인도':'인도','한국_미국테마':'미국테마','한국_기타':'기타',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function fmtUSD(v) {
  if (v >= 1e6) return `$${(v/1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${v.toLocaleString('en-US',{maximumFractionDigits:0})}`;
  return `$${v.toFixed(2)}`;
}
function fmtKRW(v) {
  if (v >= 1e8) return `₩${(v/1e8).toFixed(2)}억`;
  if (v >= 1e4) return `₩${Math.round(v/1e4).toLocaleString('ko-KR')}만`;
  return `₩${Math.round(v).toLocaleString('ko-KR')}`;
}
function fmtMoney(v, currency) { return currency === 'KRW' ? fmtKRW(v) : fmtUSD(v); }
function fmtPct(v) { if (v == null) return '-'; return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`; }
function parseAmt(str) { const n = parseInt((str||'').replace(/[^0-9]/g,''),10); return isNaN(n) ? 0 : n; }
function fmtInput(n) { return n ? n.toLocaleString() : ''; }
function calcCAGR(retPct, years) { if (!years || years <= 0) return null; return (Math.pow(1 + retPct/100, 1/years) - 1) * 100; }

function findStartIdx(history, year, month) {
  const prefix = `${year}-${String(month).padStart(2,'0')}`;
  let idx = history.findIndex(d => d.date.startsWith(prefix));
  if (idx >= 0) return idx;
  const target = new Date(year, month - 1, 1);
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date) >= target) return i;
  }
  return -1;
}

// 적립식 DCA 계산: { date, invested, value }[] 반환
function calcDCASeries(history, startIdx, monthlyAmt) {
  let shares = 0, invested = 0;
  const result = [];
  for (let i = startIdx; i < history.length; i++) {
    const p = history[i].price;
    if (!p || p <= 0) continue;
    shares += monthlyAmt / p;
    invested += monthlyAmt;
    result.push({ date: history[i].date.slice(0,7), invested, value: shares * p });
  }
  return result;
}

// 날짜 인덱스 맵 빌드 (빠른 조회용)
function buildDateMap(series) {
  const map = {};
  series.forEach((p, i) => { map[p.date] = i; });
  return map;
}
// 날짜 이하의 마지막 항목 조회
function lookupByDate(series, dateMap, targetDate) {
  if (!series.length) return null;
  if (dateMap[targetDate] !== undefined) return series[dateMap[targetDate]];
  // 이분 탐색
  let lo = 0, hi = series.length - 1, res = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].date <= targetDate) { res = series[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return res;
}

function DCATooltip({ active, payload, label, currency, etfMeta }) {
  if (!active || !payload?.length) return null;
  const items = [...payload].filter(p => p.value != null && p.value > 0)
    .sort((a,b) => (b.value ?? 0) - (a.value ?? 0));
  return (
    <div style={{ background:'rgba(10,10,26,0.97)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 16px', minWidth:'210px' }}>
      <div style={{ color:'#94a3b8', fontSize:'0.72rem', marginBottom:'8px' }}>{label}</div>
      {items.map(entry => {
        const isKR = entry.dataKey !== '_invested' && entry.dataKey !== '_portfolio' && etfMeta[entry.dataKey]?.currency === 'KRW';
        const cur = isKR ? 'KRW' : currency;
        return (
          <div key={entry.dataKey} style={{ marginBottom:'4px', display:'flex', justifyContent:'space-between', gap:'1.5rem' }}>
            <span style={{ color: entry.color, fontWeight:'600', fontSize:'0.8rem' }}>{entry.name}</span>
            <span style={{ color:'#e2e8f0', fontSize:'0.8rem' }}>{fmtMoney(entry.value, cur)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function EtfDCA() {
  const [historyData, setHistoryData] = useState(null);
  const [etfDatabase, setEtfDatabase] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startYear, setStartYear] = useState(CURRENT_YEAR - 5);
  const [startMonth, setStartMonth] = useState(1);
  const [usdInput, setUsdInput] = useState('500');
  const [krwInput, setKrwInput] = useState('500,000');
  const [selectedETFs, setSelectedETFs] = useState([]);
  const [weights, setWeights] = useState({});
  const [expandedCats, setExpandedCats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/etf-history').then(r => r.json()),
      fetch('/api/etf-data').then(r => r.json()),
    ]).then(([hist, db]) => { setHistoryData(hist); setEtfDatabase(db); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const etfMeta = useMemo(() => {
    if (!etfDatabase) return {};
    const meta = {};
    for (const cat of Object.values(etfDatabase.categories || {})) {
      for (const etf of cat.etfs || []) meta[etf.ticker] = { name: etf.name, currency: etf.currency };
    }
    return meta;
  }, [etfDatabase]);

  const categories = useMemo(() => {
    if (!etfDatabase || !historyData) return {};
    const result = {};
    for (const [catKey, cat] of Object.entries(etfDatabase.categories || {})) {
      const etfs = (cat.etfs || []).filter(e => historyData[e.ticker]?.length > 0);
      if (etfs.length > 0) result[catKey] = { ...cat, etfs };
    }
    return result;
  }, [etfDatabase, historyData]);

  const panelCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    const result = {};
    for (const [catKey, cat] of Object.entries(categories)) {
      const etfs = cat.etfs.filter(e => e.ticker.toLowerCase().includes(q) || (e.name||'').toLowerCase().includes(q));
      if (etfs.length > 0) result[catKey] = { ...cat, etfs };
    }
    return result;
  }, [categories, searchQuery]);

  // ETF 선택 변경 시 비중 자동 균등 배분
  const selKey = selectedETFs.join(',');
  useEffect(() => {
    if (!selectedETFs.length) { setWeights({}); return; }
    const eq = Math.floor(100 / selectedETFs.length);
    const rem = 100 - eq * selectedETFs.length;
    const w = {};
    selectedETFs.forEach((t, i) => { w[t] = eq + (i === 0 ? rem : 0); });
    setWeights(w);
    setSimulated(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selKey]);

  function toggleCat(key) { setExpandedCats(p => ({ ...p, [key]: !p[key] })); }
  function toggleETF(ticker) {
    setSimulated(false);
    setSelectedETFs(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker)
        : prev.length < 6 ? [...prev, ticker] : prev
    );
  }
  function getColor(ticker) { return COLOR_PALETTE[selectedETFs.indexOf(ticker) % 10]; }

  const usdAmt = parseAmt(usdInput);
  const krwAmt = parseAmt(krwInput);
  const hasUSD = selectedETFs.some(t => etfMeta[t]?.currency !== 'KRW');
  const hasKRW = selectedETFs.some(t => etfMeta[t]?.currency === 'KRW');
  const mixedCurrency = hasUSD && hasKRW;
  const weightSum = selectedETFs.reduce((s, t) => s + (weights[t] || 0), 0);

  // ── DCA 계산 ──────────────────────────────────────────────────────────────
  const { chartData, etfResults, portfolioResult } = useMemo(() => {
    const empty = { chartData: [], etfResults: [], portfolioResult: null };
    if (!historyData || !simulated || !selectedETFs.length) return empty;

    // 개별 ETF 시리즈 (각 ETF에 월 전액 투자 가정 → 단독 비교용)
    const etfSeriesMap = {};
    for (const ticker of selectedETFs) {
      const hist = historyData[ticker];
      if (!hist?.length) continue;
      const si = findStartIdx(hist, startYear, startMonth);
      if (si < 0) continue;
      const currency = etfMeta[ticker]?.currency || 'USD';
      const mAmt = currency === 'KRW' ? krwAmt : usdAmt;
      if (!mAmt) continue;
      const series = calcDCASeries(hist, si, mAmt);
      if (!series.length) continue;
      etfSeriesMap[ticker] = { series, dateMap: buildDateMap(series), currency, mAmt };
    }
    if (!Object.keys(etfSeriesMap).length) return empty;

    // 차트 기준 날짜: 가장 데이터가 많은 ETF 기준
    const refTicker = Object.keys(etfSeriesMap).reduce((a, b) =>
      etfSeriesMap[a].series.length >= etfSeriesMap[b].series.length ? a : b
    );
    const refDates = etfSeriesMap[refTicker].series.map(p => p.date);

    // 포트폴리오 시리즈 (비중 적용, 동일 통화만)
    let portfolioSeries = [];
    const showPortfolio = selectedETFs.length > 1 && !mixedCurrency;
    if (showPortfolio) {
      const currency = etfSeriesMap[Object.keys(etfSeriesMap)[0]].currency;
      const totalMonthly = currency === 'KRW' ? krwAmt : usdAmt;
      // 비중 합이 0이면 균등 배분
      const totalW = selectedETFs.reduce((s, t) => s + (weights[t] || 0), 0);
      const normalize = totalW > 0 ? 100 / totalW : 0;

      const weightedSeriesMap = {};
      for (const ticker of selectedETFs) {
        const hist = historyData[ticker];
        if (!hist?.length) continue;
        const si = findStartIdx(hist, startYear, startMonth);
        if (si < 0) continue;
        const w = ((weights[ticker] || 0) * normalize) / 100;
        const mAmt = totalMonthly * w;
        if (!mAmt) continue;
        const series = calcDCASeries(hist, si, mAmt);
        weightedSeriesMap[ticker] = { series, dateMap: buildDateMap(series) };
      }

      portfolioSeries = refDates.map(date => {
        let totalValue = 0, totalInvested = 0;
        for (const { series, dateMap } of Object.values(weightedSeriesMap)) {
          const entry = lookupByDate(series, dateMap, date);
          if (entry) { totalValue += entry.value; totalInvested += entry.invested; }
        }
        return { date, value: totalValue, invested: totalInvested };
      });
    }

    // 차트 데이터 병합
    const portDateMap = buildDateMap(portfolioSeries);
    const chartData = refDates.map(date => {
      const entry = { date };
      // 투자금 기준선
      const refP = lookupByDate(etfSeriesMap[refTicker].series, etfSeriesMap[refTicker].dateMap, date);
      if (refP) entry['_invested'] = Math.round(refP.invested);
      // 개별 ETF
      for (const [ticker, { series, dateMap }] of Object.entries(etfSeriesMap)) {
        const p = lookupByDate(series, dateMap, date);
        if (p) entry[ticker] = Math.round(p.value);
      }
      // 포트폴리오
      if (showPortfolio) {
        const pp = lookupByDate(portfolioSeries, portDateMap, date);
        if (pp?.value > 0) entry['_portfolio'] = Math.round(pp.value);
      }
      return entry;
    });

    // 결과 카드 데이터
    const etfResults = Object.entries(etfSeriesMap).map(([ticker, { series, currency, mAmt }]) => {
      const last = series[series.length - 1];
      const retPct = (last.value / last.invested - 1) * 100;
      return {
        ticker, name: etfMeta[ticker]?.name, currency, mAmt,
        totalInvested: last.invested, currentValue: last.value,
        profit: last.value - last.invested,
        returnPct: retPct,
        cagr: calcCAGR(retPct, series.length / 12),
        months: series.length,
      };
    }).sort((a, b) => b.returnPct - a.returnPct);

    let portfolioResult = null;
    if (showPortfolio && portfolioSeries.length) {
      const last = portfolioSeries[portfolioSeries.length - 1];
      const currency = etfSeriesMap[Object.keys(etfSeriesMap)[0]].currency;
      const mAmt = currency === 'KRW' ? krwAmt : usdAmt;
      const retPct = last.invested > 0 ? (last.value / last.invested - 1) * 100 : 0;
      portfolioResult = {
        currency, mAmt,
        totalInvested: last.invested, currentValue: last.value,
        profit: last.value - last.invested,
        returnPct: retPct,
        cagr: calcCAGR(retPct, portfolioSeries.length / 12),
        months: portfolioSeries.length,
      };
    }

    return { chartData, etfResults, portfolioResult };
  }, [historyData, simulated, selKey, weights, startYear, startMonth, usdAmt, krwAmt, etfMeta, mixedCurrency]);

  const chartCurrency = hasKRW && !hasUSD ? 'KRW' : 'USD';
  function xAxisFmt(d) { if (!d) return ''; const [y,m] = d.split('-'); return `${y.slice(2)}/${m}`; }
  function yAxisFmt(v) { return fmtMoney(v, chartCurrency); }

  const inputStyle = {
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
    borderRadius:'8px', color:'#e2e8f0', padding:'0.45rem 0.75rem',
    fontSize:'0.875rem', outline:'none', boxSizing:'border-box',
  };
  const selectStyle = { ...inputStyle, cursor:'pointer' };

  if (loading) return (
    <div style={{ background:'#0a0a1a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#10b981' }}>데이터 로딩 중...</span>
    </div>
  );

  return (
    <div style={{ background:'#0a0a1a', minHeight:'100vh', color:'#e2e8f0', fontFamily:"'Pretendard',-apple-system,sans-serif", padding:'0 1rem 3rem' }}>
      <Navigation />
      <div style={{ maxWidth:'1400px', margin:'0 auto', paddingTop:'5rem' }}>

        {/* 헤더 */}
        <header style={{ marginBottom:'1.5rem', textAlign:'center' }}>
          <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:'700', background:'linear-gradient(135deg,#fff 0%,#10b981 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:'0 0 0.4rem', letterSpacing:'-0.02em' }}>
            ETF 조합 시뮬레이터
          </h1>
          <p style={{ color:'#94a3b8', fontSize:'0.9rem', margin:0 }}>
            매월 일정 금액을 투자했다면 지금 얼마가 됐을지 계산합니다 · ETF 조합 포트폴리오 비교 가능
          </p>
        </header>

        {/* 투자 조건 입력 */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'1rem 1.25rem', marginBottom:'1rem', display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'flex-end' }}>

          {/* 시작월 */}
          <div>
            <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>적립 시작</div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <select value={startYear} onChange={e => { setStartYear(+e.target.value); setSimulated(false); }} style={selectStyle}>
                {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={startMonth} onChange={e => { setStartMonth(+e.target.value); setSimulated(false); }} style={selectStyle}>
                {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* 월 투자금 */}
          {(hasUSD || !hasKRW) && (
            <div>
              <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>월 투자금 (USD)</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ color:'#94a3b8', fontSize:'0.875rem' }}>$</span>
                <input type="text" value={usdInput}
                  onChange={e => { setUsdInput(fmtInput(parseAmt(e.target.value)) || e.target.value.replace(/[^0-9,]/g,'')); setSimulated(false); }}
                  style={{ ...inputStyle, width:'110px', textAlign:'right' }} />
              </div>
            </div>
          )}
          {hasKRW && (
            <div>
              <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>월 투자금 (KRW)</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ color:'#94a3b8', fontSize:'0.875rem' }}>₩</span>
                <input type="text" value={krwInput}
                  onChange={e => { setKrwInput(fmtInput(parseAmt(e.target.value)) || e.target.value.replace(/[^0-9,]/g,'')); setSimulated(false); }}
                  style={{ ...inputStyle, width:'130px', textAlign:'right' }} />
              </div>
            </div>
          )}

          {/* 포트폴리오 비중 설정 (2개 이상 동일 통화 선택 시) */}
          {selectedETFs.length > 1 && !mixedCurrency && (
            <div style={{ borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:'1rem' }}>
              <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                포트폴리오 비중
                {weightSum !== 100 && <span style={{ color:'#f43f5e', marginLeft:'6px' }}>합계 {weightSum}%</span>}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                {selectedETFs.map((ticker, i) => {
                  const isKR = etfMeta[ticker]?.currency === 'KRW';
                  const label = isKR ? (etfMeta[ticker]?.name || ticker) : ticker;
                  const shortLabel = label.length > 9 ? label.slice(0,9)+'…' : label;
                  return (
                    <div key={ticker} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: COLOR_PALETTE[i%10], flexShrink:0 }} />
                      <span style={{ color: COLOR_PALETTE[i%10], fontSize:'0.8rem', fontWeight:'600' }}>{shortLabel}</span>
                      <input type="number" value={weights[ticker] ?? 0} min="0" max="100"
                        onChange={e => { setWeights(p => ({ ...p, [ticker]: Math.max(0, Math.min(100, +e.target.value)) })); setSimulated(false); }}
                        style={{ ...inputStyle, width:'52px', textAlign:'center', padding:'0.3rem 0.4rem' }} />
                      <span style={{ color:'#64748b', fontSize:'0.8rem' }}>%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={() => { if (selectedETFs.length > 0) setSimulated(true); }} disabled={selectedETFs.length === 0}
            style={{ background: selectedETFs.length > 0 ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)', color: selectedETFs.length > 0 ? '#fff' : '#475569', border:'none', borderRadius:'10px', padding:'0.5rem 1.5rem', fontSize:'0.875rem', fontWeight:'700', cursor: selectedETFs.length > 0 ? 'pointer' : 'not-allowed', marginLeft:'auto' }}>
            계산하기
          </button>
        </div>

        {/* 메인 레이아웃 */}
        <style>{`
          .dca-layout { display:grid; gap:1rem; align-items:start; }
          @media (min-width:769px) { .dca-layout { grid-template-columns:260px 1fr; } }
          .etf-panel { position:static; }
          @media (min-width:769px) { .etf-panel { position:sticky; top:80px; } }
        `}</style>
        <div className="dca-layout">

          {/* 좌측: ETF 선택 패널 */}
          <div className="etf-panel" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'1.25rem', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.75rem', color:'#94a3b8', fontWeight:'600', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                ETF 선택 ({selectedETFs.length}/6)
              </span>
              {selectedETFs.length > 0 && (
                <button onClick={() => setSelectedETFs([])} style={{ padding:'0.2rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'600', cursor:'pointer', background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)' }}>
                  초기화
                </button>
              )}
            </div>
            <div style={{ position:'relative', marginBottom:'0.75rem' }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="ETF 검색 (티커/이름)"
                style={{ width:'100%', padding:'0.5rem 2rem 0.5rem 0.75rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', color:'#e2e8f0', fontSize:'0.8125rem', outline:'none', boxSizing:'border-box' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:'0.5rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.875rem', padding:0 }}>✕</button>
              )}
            </div>
            {Object.keys(panelCategories).length === 0 && searchQuery && (
              <div style={{ color:'#64748b', fontSize:'0.8rem', textAlign:'center', padding:'1rem 0' }}>검색 결과 없음</div>
            )}
            <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto' }}>
              {Object.entries(panelCategories).map(([catKey, cat]) => {
                const isExpanded = searchQuery.trim() ? true : expandedCats[catKey];
                return (
                  <div key={catKey} style={{ marginBottom:'0.5rem' }}>
                    <button onClick={() => toggleCat(catKey)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'8px', color:'#cbd5e1', fontSize:'0.8125rem', fontWeight:'600', cursor:'pointer', marginBottom: isExpanded ? '0.375rem' : 0 }}>
                      <span>{CATEGORY_LABELS[catKey] || catKey}</span>
                      <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && cat.etfs.map(etf => {
                      const isSel = selectedETFs.includes(etf.ticker);
                      const color = getColor(etf.ticker);
                      const isKR = etf.currency === 'KRW';
                      const label = isKR ? etf.name : etf.ticker;
                      return (
                        <button key={etf.ticker} onClick={() => toggleETF(etf.ticker)}
                          style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.375rem 0.75rem', marginBottom:'0.25rem', border: isSel ? `1px solid ${color}60` : '1px solid transparent', borderRadius:'8px', background: isSel ? `${color}15` : 'transparent', color: isSel ? '#fff' : '#64748b', fontSize:'0.8125rem', fontWeight: isSel ? '600' : '400', cursor:'pointer', transition:'all 0.2s', textAlign:'left' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth:0 }}>
                            {isSel && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color, flexShrink:0 }} />}
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                            {isKR && <span style={{ fontSize:'0.7rem', color:'#475569' }}>{etf.ticker}</span>}
                            {isSel && selectedETFs.length > 1 && (
                              <span style={{ fontSize:'0.72rem', color: color, fontWeight:'700' }}>{weights[etf.ticker] || 0}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측: 결과 영역 */}
          <div>
            {selectedETFs.length === 0 && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4rem 2rem', textAlign:'center', color:'#475569' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>💰</div>
                <div style={{ fontSize:'1rem', fontWeight:'600', marginBottom:'0.5rem' }}>좌측에서 ETF를 선택해 주세요</div>
                <div style={{ fontSize:'0.85rem' }}>최대 6개 · 여러 ETF 조합으로 포트폴리오 비교 가능</div>
              </div>
            )}

            {selectedETFs.length > 0 && !simulated && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4rem 2rem', textAlign:'center', color:'#475569' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⚙️</div>
                <div style={{ fontSize:'1rem', fontWeight:'600', marginBottom:'0.5rem' }}>{selectedETFs.length}개 ETF 선택됨</div>
                <div style={{ fontSize:'0.85rem' }}>적립 조건을 설정하고 계산하기 버튼을 눌러주세요</div>
              </div>
            )}

            {simulated && chartData.length > 0 && (
              <>
                {/* 자산 성장 차트 */}
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'1.25rem', marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:'700', color:'#94a3b8', marginBottom:'1rem' }}>
                    📈 자산 성장 추이 — {startYear}년 {startMonth}월부터 매월 {chartCurrency === 'KRW' ? fmtKRW(krwAmt) : fmtUSD(usdAmt)} 적립
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top:5, right:20, left:15, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="date" tickFormatter={xAxisFmt} tick={{ fill:'#64748b', fontSize:11 }} tickLine={false}
                        interval={Math.max(0, Math.floor(chartData.length / 8) - 1)} />
                      <YAxis tickFormatter={yAxisFmt} tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} width={72} />
                      <Tooltip content={<DCATooltip currency={chartCurrency} etfMeta={etfMeta} />} />
                      <Legend wrapperStyle={{ fontSize:'0.75rem', color:'#94a3b8' }} />

                      {/* 투자금 기준선 (회색 점선) */}
                      <Line dataKey="_invested" name="총 투자금" stroke="#475569" strokeDasharray="5 3" strokeWidth={1.5} dot={false} />

                      {/* 개별 ETF 라인 */}
                      {selectedETFs.map((ticker, i) => {
                        const isKR = etfMeta[ticker]?.currency === 'KRW';
                        const name = isKR ? (etfMeta[ticker]?.name?.slice(0,12) || ticker) : ticker;
                        return (
                          <Line key={ticker} dataKey={ticker} name={name}
                            stroke={COLOR_PALETTE[i%10]} strokeWidth={2} dot={false} />
                        );
                      })}

                      {/* 포트폴리오 라인 (골드, 더 굵게) */}
                      {selectedETFs.length > 1 && !mixedCurrency && (
                        <Line dataKey="_portfolio" name="포트폴리오" stroke={PORTFOLIO_COLOR} strokeWidth={2.5} dot={false} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 결과 카드 */}
                <div style={{ display:'grid', gap:'0.75rem', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))' }}>

                  {/* 포트폴리오 카드 (2개 이상 선택 시) */}
                  {portfolioResult && (
                    <div style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.35)', borderRadius:'16px', padding:'1.25rem', gridColumn: etfResults.length === 1 ? undefined : '1 / -1' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:PORTFOLIO_COLOR, flexShrink:0 }} />
                        <span style={{ fontSize:'0.875rem', fontWeight:'700', color:PORTFOLIO_COLOR }}>포트폴리오 합산</span>
                        <span style={{ fontSize:'0.72rem', color:'#94a3b8', marginLeft:'auto' }}>
                          {selectedETFs.map(t => {
                            const isKR = etfMeta[t]?.currency === 'KRW';
                            const label = isKR ? (etfMeta[t]?.name?.slice(0,8) || t) : t;
                            return `${label} ${weights[t]||0}%`;
                          }).join(' + ')}
                        </span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
                        {[
                          ['월 투자금', fmtMoney(portfolioResult.mAmt, portfolioResult.currency), null],
                          ['총 투자금', fmtMoney(portfolioResult.totalInvested, portfolioResult.currency), null],
                          ['현재 가치', fmtMoney(portfolioResult.currentValue, portfolioResult.currency), null],
                          ['수익금', fmtMoney(portfolioResult.profit, portfolioResult.currency), portfolioResult.profit],
                          ['수익률', fmtPct(portfolioResult.returnPct), portfolioResult.returnPct],
                          ['CAGR', fmtPct(portfolioResult.cagr), portfolioResult.cagr],
                        ].map(([label, val, sign]) => (
                          <div key={label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'0.6rem' }}>
                            <div style={{ fontSize:'0.67rem', color:'#64748b', marginBottom:'0.2rem' }}>{label}</div>
                            <div style={{ fontSize:'0.875rem', fontWeight:'700', color: sign == null ? '#e2e8f0' : sign >= 0 ? '#10b981' : '#f43f5e' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 개별 ETF 카드 */}
                  {etfResults.map(r => {
                    const colIdx = selectedETFs.indexOf(r.ticker);
                    const color = COLOR_PALETTE[colIdx % 10];
                    return (
                      <div key={r.ticker} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${color}40`, borderRadius:'16px', padding:'1.25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                          <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:color, flexShrink:0 }} />
                          <span style={{ fontSize:'0.875rem', fontWeight:'700', color }}>
                            {r.currency === 'KRW' ? (r.name || r.ticker) : r.ticker}
                          </span>
                          {r.currency === 'KRW' && <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{r.ticker}</span>}
                          <span style={{ fontSize:'0.7rem', color:'#475569', marginLeft:'auto' }}>{r.months}개월</span>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                          {[
                            ['월 투자금', fmtMoney(r.mAmt, r.currency), null],
                            ['총 투자금', fmtMoney(r.totalInvested, r.currency), null],
                            ['현재 가치', fmtMoney(r.currentValue, r.currency), null],
                            ['수익금', fmtMoney(r.profit, r.currency), r.profit],
                            ['수익률', fmtPct(r.returnPct), r.returnPct],
                            ['CAGR', fmtPct(r.cagr), r.cagr],
                          ].map(([label, val, sign]) => (
                            <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'8px', padding:'0.6rem' }}>
                              <div style={{ fontSize:'0.67rem', color:'#64748b', marginBottom:'0.2rem' }}>{label}</div>
                              <div style={{ fontSize:'0.875rem', fontWeight:'700', color: sign == null ? '#e2e8f0' : sign >= 0 ? '#10b981' : '#f43f5e' }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
