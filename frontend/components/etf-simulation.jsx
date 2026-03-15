'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Navigation from './Navigation';

const COLOR_PALETTE = [
  '#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6',
];

const CATEGORY_LABELS = {
  '미국_S&P500': 'S&P500', '미국_나스닥': '나스닥', '미국_전체시장': '전체시장',
  '미국_소형중형': '소형/중형', '미국_기술주': '기술주', '미국_섹터': '섹터',
  '미국_채권': '채권', '미국_배당': '배당', '미국_커버드콜': '커버드콜',
  '미국_일드맥스': '일드맥스', '미국_성장/가치': '성장/가치', '미국_국제': '국제',
  '미국_금/원자재': '금/원자재', '미국_리츠': '리츠', '미국_테마': '테마',
  '미국_레버리지/인버스': '레버리지',
  '한국_미국S&P500': 'S&P500(KR)', '한국_미국나스닥': '나스닥(KR)',
  '한국_주식시장': '주식시장', '한국_반도체/AI': '반도체/AI', '한국_2차전지': '2차전지',
  '한국_바이오/헬스케어': '바이오', '한국_채권': '채권', '한국_금/원자재': '금/원자재',
  '한국_리츠/배당': '리츠/배당', '한국_글로벌/선진국': '글로벌', '한국_중국/아시아': '중국/아시아',
  '한국_인도': '인도', '한국_미국테마': '미국테마', '한국_기타': '기타',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function fmtUSD(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${v.toFixed(2)}`;
}
function fmtKRW(v) {
  if (v >= 1e8) return `₩${(v / 1e8).toFixed(2)}억`;
  if (v >= 1e4) return `₩${Math.round(v / 1e4)}만`;
  return `₩${Math.round(v).toLocaleString('ko-KR')}`;
}
function fmtMoney(v, currency) { return currency === 'KRW' ? fmtKRW(v) : fmtUSD(v); }
function fmtPct(v) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`; }
function calcCAGR(totalReturnPct, years) {
  if (!years || years <= 0) return null;
  return (Math.pow(1 + totalReturnPct / 100, 1 / years) - 1) * 100;
}
function findStartIndex(history, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  let idx = history.findIndex(d => d.date.startsWith(prefix));
  if (idx >= 0) return idx;
  const target = new Date(year, month - 1, 1);
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date) >= target) return i;
  }
  return -1;
}
function parseAmount(str) {
  const n = parseInt(str.replace(/[^0-9]/g, '') || '0', 10);
  return isNaN(n) ? 0 : n;
}
function formatAmountInput(n) { return n ? n.toLocaleString() : ''; }

// 커스텀 툴팁
function SimTooltip({ active, payload, label, usdAmt, krwAmt, etfMeta }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,15,30,0.97)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 16px', minWidth:'180px' }}>
      <div style={{ color:'#94a3b8', fontSize:'0.72rem', marginBottom:'8px' }}>{label}</div>
      {[...payload].sort((a,b) => (b.value??-Infinity)-(a.value??-Infinity)).map(entry => {
        const ticker = entry.dataKey;
        const meta = etfMeta[ticker];
        const isKR = meta?.currency === 'KRW';
        const amt = isKR ? krwAmt : usdAmt;
        const currentVal = amt * (1 + entry.value / 100);
        const label2 = isKR ? (meta?.name || ticker) : ticker;
        return (
          <div key={ticker} style={{ marginBottom:'5px' }}>
            <span style={{ color:entry.color, fontWeight:'700', fontSize:'0.8rem' }}>{label2}</span>
            <span style={{ color:'#e2e8f0', fontSize:'0.8rem', marginLeft:'8px' }}>{fmtPct(entry.value)}</span>
            {amt > 0 && <div style={{ color:'#64748b', fontSize:'0.71rem' }}>{fmtMoney(currentVal, isKR?'KRW':'USD')}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function EtfSimulation() {
  const [historyData, setHistoryData] = useState(null);
  const [etfDatabase, setEtfDatabase] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startYear, setStartYear] = useState(CURRENT_YEAR - 3);
  const [startMonth, setStartMonth] = useState(1);
  const [usdInput, setUsdInput] = useState('10,000');
  const [krwInput, setKrwInput] = useState('1,000,000');
  const [selectedETFs, setSelectedETFs] = useState([]);
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

  // 카테고리별 ETF 목록 (히스토리 있는 것만)
  const categories = useMemo(() => {
    if (!etfDatabase || !historyData) return {};
    const result = {};
    for (const [catKey, cat] of Object.entries(etfDatabase.categories || {})) {
      const etfs = (cat.etfs || []).filter(e => historyData[e.ticker]?.length > 0);
      if (etfs.length > 0) result[catKey] = { ...cat, etfs };
    }
    return result;
  }, [etfDatabase, historyData]);

  // 검색 필터
  const panelCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    const result = {};
    for (const [catKey, cat] of Object.entries(categories)) {
      const etfs = cat.etfs.filter(e =>
        e.ticker.toLowerCase().includes(q) || (e.name || '').toLowerCase().includes(q)
      );
      if (etfs.length > 0) result[catKey] = { ...cat, etfs };
    }
    return result;
  }, [categories, searchQuery]);

  function toggleCat(key) { setExpandedCats(p => ({ ...p, [key]: !p[key] })); }
  function toggleETF(ticker) {
    setSimulated(false);
    setSelectedETFs(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker)
        : prev.length < 10 ? [...prev, ticker] : prev
    );
  }
  function getColor(ticker) {
    const idx = selectedETFs.indexOf(ticker);
    return idx >= 0 ? COLOR_PALETTE[idx % 10] : COLOR_PALETTE[0];
  }

  const usdAmt = parseAmount(usdInput);
  const krwAmt = parseAmount(krwInput);

  // 시뮬레이션 계산
  const { chartData, results } = useMemo(() => {
    if (!historyData || !simulated || selectedETFs.length === 0) return { chartData: [], results: [] };

    const etfSeries = {};
    for (const ticker of selectedETFs) {
      const hist = historyData[ticker];
      if (!hist?.length) continue;
      const startIdx = findStartIndex(hist, startYear, startMonth);
      if (startIdx < 0) continue;
      etfSeries[ticker] = { hist, startIdx, startPrice: hist[startIdx].price };
    }
    if (!Object.keys(etfSeries).length) return { chartData: [], results: [] };

    const refTicker = Object.keys(etfSeries).reduce((a, b) =>
      (etfSeries[a].hist.length - etfSeries[a].startIdx) >= (etfSeries[b].hist.length - etfSeries[b].startIdx) ? a : b
    );
    const refSeries = etfSeries[refTicker];

    const chartData = [];
    for (let i = refSeries.startIdx; i < refSeries.hist.length; i++) {
      const date = refSeries.hist[i].date;
      const point = { date: date.slice(0, 7) };
      for (const [ticker, { hist, startIdx, startPrice }] of Object.entries(etfSeries)) {
        const targetDate = new Date(date);
        let closest = null, minDiff = Infinity;
        for (let j = startIdx; j < hist.length; j++) {
          const diff = Math.abs(new Date(hist[j].date) - targetDate);
          if (diff < minDiff) { minDiff = diff; closest = hist[j]; } else break;
        }
        if (closest && minDiff < 46 * 86400000) {
          point[ticker] = parseFloat(((closest.price / startPrice - 1) * 100).toFixed(2));
        }
      }
      chartData.push(point);
    }

    const results = Object.entries(etfSeries).map(([ticker, { hist, startIdx, startPrice }]) => {
      const last = hist[hist.length - 1];
      const totalReturn = (last.price / startPrice - 1) * 100;
      const years = (new Date(last.date) - new Date(hist[startIdx].date)) / (365.25 * 86400000);
      const currency = etfMeta[ticker]?.currency || 'USD';
      const amt = currency === 'KRW' ? krwAmt : usdAmt;
      return {
        ticker, totalReturn,
        cagr: calcCAGR(totalReturn, years),
        currency, amt,
        currentValue: amt * (1 + totalReturn / 100),
        years,
      };
    }).sort((a, b) => b.totalReturn - a.totalReturn);

    return { chartData, results };
  }, [historyData, simulated, selectedETFs, startYear, startMonth, usdAmt, krwAmt, etfMeta]);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#e2e8f0', padding: '0.45rem 0.75rem',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  if (loading) return (
    <div style={{ background:'#0a0a1a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'#8b5cf6' }}>데이터 로딩 중...</span>
    </div>
  );

  const hasUSD = selectedETFs.some(t => etfMeta[t]?.currency !== 'KRW');
  const hasKRW = selectedETFs.some(t => etfMeta[t]?.currency === 'KRW');

  return (
    <div style={{ background:'#0a0a1a', minHeight:'100vh', color:'#e2e8f0', fontFamily:"'Pretendard',-apple-system,sans-serif", padding:'0 1rem 3rem' }}>
      <Navigation />

      <div style={{ maxWidth:'1400px', margin:'0 auto', paddingTop:'5rem' }}>
        {/* 헤더 */}
        <header style={{ marginBottom:'1.5rem', textAlign:'center' }}>
          <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:'700', background:'linear-gradient(135deg,#fff 0%,#8b5cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', margin:'0 0 0.4rem', letterSpacing:'-0.02em' }}>
            투자 시뮬레이션
          </h1>
          <p style={{ color:'#94a3b8', fontSize:'0.9rem', margin:0 }}>
            특정 날짜에 투자했다면 지금 얼마가 됐을지 시뮬레이션합니다 (배당 재투자 포함)
          </p>
        </header>

        {/* 투자 조건 입력 */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'1rem 1.25rem', marginBottom:'1rem', display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'flex-end' }}>
          <div>
            <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>투자 시작일</div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <select value={startYear} onChange={e => { setStartYear(+e.target.value); setSimulated(false); }} style={selectStyle}>
                {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={startMonth} onChange={e => { setStartMonth(+e.target.value); setSimulated(false); }} style={selectStyle}>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          </div>

          {(hasUSD || !hasKRW) && (
            <div>
              <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>투자금 (USD $)</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ color:'#94a3b8', fontSize:'0.875rem' }}>$</span>
                <input type="text" value={usdInput}
                  onChange={e => { setUsdInput(formatAmountInput(parseAmount(e.target.value)) || e.target.value.replace(/[^0-9,]/g,'')); setSimulated(false); }}
                  style={{ ...inputStyle, width:'130px', textAlign:'right' }} />
              </div>
            </div>
          )}

          {hasKRW && (
            <div>
              <div style={{ color:'#64748b', fontSize:'0.72rem', fontWeight:'600', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>투자금 (KRW ₩)</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ color:'#94a3b8', fontSize:'0.875rem' }}>₩</span>
                <input type="text" value={krwInput}
                  onChange={e => { setKrwInput(formatAmountInput(parseAmount(e.target.value)) || e.target.value.replace(/[^0-9,]/g,'')); setSimulated(false); }}
                  style={{ ...inputStyle, width:'140px', textAlign:'right' }} />
              </div>
            </div>
          )}

          <button
            onClick={() => { if (selectedETFs.length > 0) setSimulated(true); }}
            disabled={selectedETFs.length === 0}
            style={{
              background: selectedETFs.length > 0 ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.06)',
              color: selectedETFs.length > 0 ? '#fff' : '#475569',
              border:'none', borderRadius:'10px', padding:'0.5rem 1.5rem',
              fontSize:'0.875rem', fontWeight:'700', cursor: selectedETFs.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            시뮬레이션 실행
          </button>
        </div>

        {/* 메인 레이아웃 */}
        <style>{`
          .sim-layout { display: grid; gap: 1rem; align-items: start; }
          @media (min-width: 769px) { .sim-layout { grid-template-columns: 260px 1fr; } }
          @media (max-width: 768px) { .sim-layout { grid-template-columns: 1fr; } }
          .sim-panel { position: static; }
          @media (min-width: 769px) { .sim-panel { position: sticky; top: 80px; } }
        `}</style>

        <div className="sim-layout">
          {/* 좌측: ETF 선택 패널 */}
          <div className="sim-panel" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'1.25rem', backdropFilter:'blur(20px)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.75rem', color:'#94a3b8', fontWeight:'600', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                ETF 선택 ({selectedETFs.length}/10)
              </span>
              {selectedETFs.length > 0 && (
                <button onClick={() => { setSelectedETFs([]); setSimulated(false); }} style={{ padding:'0.2rem 0.5rem', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'600', cursor:'pointer', background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)' }}>
                  초기화
                </button>
              )}
            </div>

            {/* 검색창 */}
            <div style={{ position:'relative', marginBottom:'0.75rem' }}>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="ETF 검색 (티커/이름)"
                style={{ width:'100%', padding:'0.5rem 2rem 0.5rem 0.75rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', color:'#e2e8f0', fontSize:'0.8125rem', outline:'none', boxSizing:'border-box' }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:'0.5rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.875rem', padding:0, lineHeight:1 }}>✕</button>
              )}
            </div>
            {Object.keys(panelCategories).length === 0 && searchQuery && (
              <div style={{ color:'#64748b', fontSize:'0.8rem', textAlign:'center', padding:'1rem 0' }}>검색 결과 없음</div>
            )}

            {/* 카테고리 아코디언 */}
            <div style={{ maxHeight:'calc(100vh - 320px)', overflowY:'auto' }}>
              {Object.entries(panelCategories).map(([catKey, cat]) => {
                const isExpanded = searchQuery.trim() ? true : expandedCats[catKey];
                return (
                  <div key={catKey} style={{ marginBottom:'0.5rem' }}>
                    <button onClick={() => toggleCat(catKey)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.05)', border:'none', borderRadius:'8px', color:'#cbd5e1', fontSize:'0.8125rem', fontWeight:'600', cursor:'pointer', marginBottom: isExpanded ? '0.375rem' : 0 }}>
                      <span>{CATEGORY_LABELS[catKey] || catKey}</span>
                      <span style={{ fontSize:'0.7rem', color:'#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && cat.etfs.map(etf => {
                      const isSelected = selectedETFs.includes(etf.ticker);
                      const color = getColor(etf.ticker);
                      const isKR = etf.currency === 'KRW';
                      const label = isKR ? etf.name : etf.ticker;
                      return (
                        <button key={etf.ticker} onClick={() => toggleETF(etf.ticker)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.375rem 0.75rem', marginBottom:'0.25rem', border: isSelected ? `1px solid ${color}60` : '1px solid transparent', borderRadius:'8px', background: isSelected ? `${color}15` : 'transparent', color: isSelected ? '#fff' : '#64748b', fontSize:'0.8125rem', fontWeight: isSelected ? '600' : '400', cursor:'pointer', transition:'all 0.2s', textAlign:'left' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth:0 }}>
                            {isSelected && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:color, flexShrink:0 }} />}
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
                          </div>
                          <span style={{ fontSize:'0.72rem', color: isSelected ? color : '#475569', flexShrink:0, marginLeft:'4px' }}>
                            {isKR ? etf.ticker : ''}
                          </span>
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
            {/* 선택된 ETF 없음 */}
            {selectedETFs.length === 0 && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4rem 2rem', textAlign:'center', color:'#475569' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📊</div>
                <div style={{ fontSize:'1rem', fontWeight:'600', marginBottom:'0.5rem' }}>좌측에서 ETF를 선택해 주세요</div>
                <div style={{ fontSize:'0.85rem' }}>최대 10개까지 동시 비교 가능합니다</div>
              </div>
            )}

            {/* 선택은 했지만 시뮬레이션 미실행 */}
            {selectedETFs.length > 0 && !simulated && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'4rem 2rem', textAlign:'center', color:'#475569' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⚙️</div>
                <div style={{ fontSize:'1rem', fontWeight:'600', marginBottom:'0.5rem' }}>
                  {selectedETFs.length}개 ETF 선택됨
                </div>
                <div style={{ fontSize:'0.85rem' }}>날짜와 투자금을 확인 후 시뮬레이션 실행 버튼을 눌러주세요</div>
              </div>
            )}

            {/* 시뮬레이션 결과 */}
            {simulated && chartData.length > 0 && (
              <>
                {/* 성장 차트 */}
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'1.25rem', marginBottom:'1rem' }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:'700', color:'#94a3b8', marginBottom:'1rem', letterSpacing:'0.03em' }}>
                    📈 수익률 추이 — {startYear}년 {startMonth}월 투자 기준
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={chartData} margin={{ top:5, right:20, left:10, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `${v>=0?'+':''}${v}%`} width={58} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />
                      <Tooltip content={<SimTooltip usdAmt={usdAmt} krwAmt={krwAmt} etfMeta={etfMeta} />} />
                      <Legend formatter={v => { const m = etfMeta[v]; return m?.currency==='KRW' ? (m?.name||v) : v; }} wrapperStyle={{ fontSize:'0.78rem', color:'#94a3b8' }} />
                      {selectedETFs.map((ticker, idx) => (
                        <Line key={ticker} type="monotone" dataKey={ticker} stroke={COLOR_PALETTE[idx%10]} strokeWidth={2} dot={false} activeDot={{ r:4 }} connectNulls />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 결과 카드 */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'0.875rem' }}>
                  {results.map(r => {
                    const idx = selectedETFs.indexOf(r.ticker);
                    const color = COLOR_PALETTE[idx % 10];
                    const meta = etfMeta[r.ticker];
                    const isKR = r.currency === 'KRW';
                    const name = isKR ? (meta?.name || r.ticker) : r.ticker;
                    const sub = isKR ? r.ticker : (meta?.name || '');
                    const pos = r.totalReturn >= 0;
                    return (
                      <div key={r.ticker} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${color}44`, borderRadius:'16px', padding:'1.1rem', borderTop:`3px solid ${color}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                          <div>
                            <div style={{ color, fontWeight:'800', fontSize:'0.9rem', marginBottom:'1px' }}>{name}</div>
                            {sub && <div style={{ color:'#475569', fontSize:'0.7rem' }}>{sub.length > 28 ? sub.slice(0,28)+'…' : sub}</div>}
                          </div>
                          <div style={{ background: pos?'rgba(16,185,129,0.15)':'rgba(244,63,94,0.15)', color: pos?'#10b981':'#f43f5e', borderRadius:'8px', padding:'0.2rem 0.5rem', fontSize:'0.8rem', fontWeight:'700', display:'flex', alignItems:'center', gap:'3px', flexShrink:0 }}>
                            {pos ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {fmtPct(r.totalReturn)}
                          </div>
                        </div>

                        {r.amt > 0 && (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem', marginBottom:'0.6rem' }}>
                            <div>
                              <div style={{ color:'#475569', fontSize:'0.68rem', marginBottom:'2px' }}>투자금</div>
                              <div style={{ color:'#94a3b8', fontSize:'0.82rem', fontWeight:'600' }}>{fmtMoney(r.amt, r.currency)}</div>
                            </div>
                            <div>
                              <div style={{ color:'#475569', fontSize:'0.68rem', marginBottom:'2px' }}>현재 가치</div>
                              <div style={{ color: pos?'#10b981':'#f43f5e', fontSize:'0.82rem', fontWeight:'700' }}>{fmtMoney(r.currentValue, r.currency)}</div>
                            </div>
                            <div>
                              <div style={{ color:'#475569', fontSize:'0.68rem', marginBottom:'2px' }}>손익</div>
                              <div style={{ color: pos?'#10b981':'#f43f5e', fontSize:'0.82rem', fontWeight:'600' }}>
                                {pos?'+':''}{fmtMoney(r.currentValue - r.amt, r.currency)}
                              </div>
                            </div>
                            <div>
                              <div style={{ color:'#475569', fontSize:'0.68rem', marginBottom:'2px' }}>연환산(CAGR)</div>
                              <div style={{ color:'#e2e8f0', fontSize:'0.82rem', fontWeight:'600' }}>{r.cagr!=null ? fmtPct(r.cagr) : '-'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p style={{ color:'#334155', fontSize:'0.7rem', marginTop:'1.5rem', lineHeight:'1.6' }}>
                  * 배당 재투자 포함 과거 수익률 기반 시뮬레이션입니다. 과거 수익률이 미래 수익률을 보장하지 않습니다.
                </p>
              </>
            )}

            {simulated && chartData.length === 0 && (
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'3rem', textAlign:'center', color:'#475569' }}>
                선택한 날짜의 데이터가 없습니다. 다른 날짜나 ETF를 선택해 주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
