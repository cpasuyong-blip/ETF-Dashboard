'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, X, Search } from 'lucide-react';
import Navigation from './Navigation';

const COLOR_PALETTE = [
  '#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 10 + i);
const MONTHS = [
  { value: 1, label: '1월' }, { value: 2, label: '2월' }, { value: 3, label: '3월' },
  { value: 4, label: '4월' }, { value: 5, label: '5월' }, { value: 6, label: '6월' },
  { value: 7, label: '7월' }, { value: 8, label: '8월' }, { value: 9, label: '9월' },
  { value: 10, label: '10월' }, { value: 11, label: '11월' }, { value: 12, label: '12월' },
];

function formatMoney(value, currency) {
  if (currency === 'KRW') {
    if (value >= 1e8) return `${(value / 1e8).toFixed(2)}억원`;
    if (value >= 1e4) return `${(value / 1e4).toFixed(0)}만원`;
    return `${Math.round(value).toLocaleString()}원`;
  }
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(v) {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function calcCAGR(totalReturnPct, years) {
  if (years <= 0) return null;
  const r = totalReturnPct / 100;
  return (Math.pow(1 + r, 1 / years) - 1) * 100;
}

// 주어진 연·월에 가장 가까운 월말 데이터 포인트 찾기
function findStartIndex(history, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  // 해당 월 데이터 우선
  let idx = history.findIndex(d => d.date.startsWith(prefix));
  if (idx >= 0) return idx;
  // 없으면 그 다음 달 이후 첫 번째
  const target = new Date(year, month - 1, 1);
  for (let i = 0; i < history.length; i++) {
    if (new Date(history[i].date) >= target) return i;
  }
  return -1;
}

// 커스텀 툴팁
function CustomTooltip({ active, payload, label, investment, selectedEtfs, etfMeta }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px', padding: '12px 16px', minWidth: '180px',
    }}>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '8px' }}>{label}</div>
      {payload.map((entry) => {
        const ticker = entry.dataKey;
        const meta = etfMeta[ticker];
        const currency = meta?.currency || 'USD';
        const currentValue = investment * (1 + entry.value / 100);
        return (
          <div key={ticker} style={{ marginBottom: '4px' }}>
            <span style={{ color: entry.color, fontWeight: '700', fontSize: '0.8rem' }}>{ticker}</span>
            <span style={{ color: '#e2e8f0', fontSize: '0.8rem', marginLeft: '8px' }}>
              {formatPct(entry.value)}
            </span>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              {formatMoney(currentValue, currency)}
            </div>
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
  const [error, setError] = useState(null);

  // 입력값
  const [startYear, setStartYear] = useState(CURRENT_YEAR - 3);
  const [startMonth, setStartMonth] = useState(1);
  const [investment, setInvestment] = useState(10000000); // 1000만원
  const [investmentInput, setInvestmentInput] = useState('10,000,000');
  const [selectedEtfs, setSelectedEtfs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [simulated, setSimulated] = useState(false);

  // 데이터 로드
  useEffect(() => {
    Promise.all([
      fetch('/api/etf-history').then(r => r.json()),
      fetch('/api/etf-data').then(r => r.json()),
    ]).then(([hist, db]) => {
      setHistoryData(hist);
      setEtfDatabase(db);
      setLoading(false);
    }).catch(e => {
      setError('데이터를 불러올 수 없습니다.');
      setLoading(false);
    });
  }, []);

  // 전체 ETF 메타 정보 (ticker → {name, currency})
  const etfMeta = useMemo(() => {
    if (!etfDatabase) return {};
    const meta = {};
    for (const cat of Object.values(etfDatabase.categories || {})) {
      for (const etf of cat.etfs || []) {
        meta[etf.ticker] = { name: etf.name, currency: etf.currency };
      }
    }
    return meta;
  }, [etfDatabase]);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!historyData || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.keys(historyData)
      .filter(ticker => {
        if (selectedEtfs.includes(ticker)) return false;
        const meta = etfMeta[ticker];
        return (
          ticker.toLowerCase().includes(q) ||
          (meta?.name || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [historyData, searchQuery, selectedEtfs, etfMeta]);

  // 투자금액 입력 처리
  function handleInvestmentChange(e) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw || '0', 10);
    setInvestment(num);
    setInvestmentInput(num ? num.toLocaleString() : '');
  }

  function addEtf(ticker) {
    if (selectedEtfs.length >= 10) return;
    setSelectedEtfs(prev => [...prev, ticker]);
    setSearchQuery('');
  }

  function removeEtf(ticker) {
    setSelectedEtfs(prev => prev.filter(t => t !== ticker));
  }

  // 시뮬레이션 차트 데이터 계산
  const { chartData, results } = useMemo(() => {
    if (!historyData || !simulated || selectedEtfs.length === 0 || investment <= 0) {
      return { chartData: [], results: [] };
    }

    // 각 ETF의 시작 인덱스 및 공통 날짜 범위 결정
    const etfSeries = {};
    for (const ticker of selectedEtfs) {
      const hist = historyData[ticker];
      if (!hist || hist.length === 0) continue;
      const startIdx = findStartIndex(hist, startYear, startMonth);
      if (startIdx < 0) continue;
      etfSeries[ticker] = { hist, startIdx, startPrice: hist[startIdx].price };
    }

    if (Object.keys(etfSeries).length === 0) return { chartData: [], results: [] };

    // 공통 날짜 축: 가장 많은 데이터를 가진 ETF 기준
    const refTicker = Object.keys(etfSeries).reduce((a, b) =>
      etfSeries[a].hist.length - etfSeries[a].startIdx > etfSeries[b].hist.length - etfSeries[b].startIdx ? a : b
    );
    const refSeries = etfSeries[refTicker];

    const chartData = [];
    for (let i = refSeries.startIdx; i < refSeries.hist.length; i++) {
      const date = refSeries.hist[i].date;
      const label = date.slice(0, 7); // YYYY-MM
      const point = { date: label };

      for (const [ticker, { hist, startIdx, startPrice }] of Object.entries(etfSeries)) {
        // 날짜가 맞는 포인트 찾기 (±1개월 허용)
        const targetDate = new Date(date);
        let closest = null;
        let minDiff = Infinity;
        for (let j = startIdx; j < hist.length; j++) {
          const diff = Math.abs(new Date(hist[j].date) - targetDate);
          if (diff < minDiff) { minDiff = diff; closest = hist[j]; }
          else break;
        }
        if (closest && minDiff < 45 * 86400000) { // 45일 이내
          point[ticker] = parseFloat(((closest.price / startPrice - 1) * 100).toFixed(2));
        }
      }
      chartData.push(point);
    }

    // 결과 카드 데이터
    const results = Object.entries(etfSeries).map(([ticker, { hist, startIdx, startPrice }]) => {
      const lastPrice = hist[hist.length - 1].price;
      const totalReturn = (lastPrice / startPrice - 1) * 100;
      const startDate = new Date(hist[startIdx].date);
      const endDate = new Date(hist[hist.length - 1].date);
      const years = (endDate - startDate) / (365.25 * 86400000);
      const cagr = calcCAGR(totalReturn, years);
      const currency = etfMeta[ticker]?.currency || 'USD';
      const currentValue = investment * (1 + totalReturn / 100);
      return { ticker, totalReturn, cagr, currency, currentValue, years };
    }).sort((a, b) => b.totalReturn - a.totalReturn);

    return { chartData, results };
  }, [historyData, simulated, selectedEtfs, startYear, startMonth, investment, etfMeta]);

  function handleRun() {
    if (selectedEtfs.length === 0 || investment <= 0) return;
    setSimulated(true);
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#e2e8f0', padding: '0.5rem 0.75rem',
    fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
  };

  if (loading) return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#8b5cf6', fontSize: '1rem' }}>데이터 로딩 중...</div>
    </div>
  );

  if (error) return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#f43f5e' }}>{error}</div>
    </div>
  );

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Pretendard', -apple-system, sans-serif" }}>
      <Navigation />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 1rem 3rem' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem' }}>
            📈 투자 시뮬레이션
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            특정 날짜에 투자했다면 지금 얼마가 됐을지 시뮬레이션합니다.
          </p>
        </div>

        {/* 컨트롤 패널 */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          {/* 날짜 + 투자금액 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: '600' }}>투자 시작일</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={startYear} onChange={e => { setStartYear(+e.target.value); setSimulated(false); }} style={selectStyle}>
                  {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select value={startMonth} onChange={e => { setStartMonth(+e.target.value); setSimulated(false); }} style={selectStyle}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: '600' }}>투자 금액</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={investmentInput}
                  onChange={handleInvestmentChange}
                  onFocus={() => setSimulated(false)}
                  placeholder="10,000,000"
                  style={{
                    ...selectStyle,
                    width: '160px',
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ETF 검색 */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.4rem', fontWeight: '600' }}>
              ETF 선택 (최대 10개)
            </div>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="티커 또는 ETF명 검색..."
                style={{
                  ...selectStyle,
                  width: '100%',
                  paddingLeft: '30px',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
              {/* 검색 드롭다운 */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: 'rgba(20,20,40,0.98)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px', marginTop: '4px', overflow: 'hidden',
                }}>
                  {searchResults.map(ticker => {
                    const meta = etfMeta[ticker];
                    const isKR = meta?.currency === 'KRW';
                    return (
                      <button
                        key={ticker}
                        onClick={() => addEtf(ticker)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                          padding: '0.6rem 0.9rem', cursor: 'pointer', color: '#e2e8f0',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ fontWeight: '700', color: isKR ? '#60a5fa' : '#a78bfa', fontSize: '0.85rem' }}>
                          {isKR ? (meta?.name || ticker) : ticker}
                        </span>
                        {!isKR && meta?.name && (
                          <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '8px' }}>
                            {meta.name.length > 30 ? meta.name.slice(0, 30) + '…' : meta.name}
                          </span>
                        )}
                        {isKR && (
                          <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '8px' }}>{ticker}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 선택된 ETF 태그 */}
          {selectedEtfs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {selectedEtfs.map((ticker, idx) => {
                const meta = etfMeta[ticker];
                const isKR = meta?.currency === 'KRW';
                const label = isKR ? (meta?.name || ticker) : ticker;
                return (
                  <div key={ticker} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: `${COLOR_PALETTE[idx % 10]}22`,
                    border: `1px solid ${COLOR_PALETTE[idx % 10]}66`,
                    borderRadius: '20px', padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem', fontWeight: '600', color: COLOR_PALETTE[idx % 10],
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLOR_PALETTE[idx % 10], flexShrink: 0 }} />
                    {label}
                    <button onClick={() => { removeEtf(ticker); setSimulated(false); }} style={{ background: 'none', border: 'none', color: COLOR_PALETTE[idx % 10], cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem', marginLeft: '2px' }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 실행 버튼 */}
          <button
            onClick={handleRun}
            disabled={selectedEtfs.length === 0 || investment <= 0}
            style={{
              background: selectedEtfs.length > 0 && investment > 0
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                : 'rgba(255,255,255,0.06)',
              color: selectedEtfs.length > 0 && investment > 0 ? '#fff' : '#475569',
              border: 'none', borderRadius: '10px',
              padding: '0.6rem 1.75rem', fontSize: '0.9rem', fontWeight: '700',
              cursor: selectedEtfs.length > 0 && investment > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            시뮬레이션 실행
          </button>
        </div>

        {/* 결과 영역 */}
        {simulated && chartData.length > 0 && (
          <>
            {/* 성장 차트 */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0 0 1.25rem' }}>
                수익률 추이 (%)
              </h2>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={v => v.slice(0, 7)}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                    width={60}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  <Tooltip content={<CustomTooltip investment={investment} selectedEtfs={selectedEtfs} etfMeta={etfMeta} />} />
                  <Legend
                    formatter={value => {
                      const meta = etfMeta[value];
                      return meta?.currency === 'KRW' ? (meta?.name || value) : value;
                    }}
                    wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }}
                  />
                  {selectedEtfs.map((ticker, idx) => (
                    <Line
                      key={ticker}
                      type="monotone"
                      dataKey={ticker}
                      stroke={COLOR_PALETTE[idx % 10]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 결과 카드 */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0 0 1rem' }}>
                최종 결과 ({startYear}년 {startMonth}월 투자 기준)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {results.map((r, idx) => {
                  const etfIdx = selectedEtfs.indexOf(r.ticker);
                  const color = COLOR_PALETTE[etfIdx % 10];
                  const meta = etfMeta[r.ticker];
                  const isKR = r.currency === 'KRW';
                  const displayName = isKR ? (meta?.name || r.ticker) : r.ticker;
                  const isPositive = r.totalReturn >= 0;
                  return (
                    <div key={r.ticker} style={{
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}44`,
                      borderRadius: '14px', padding: '1.25rem',
                      borderTop: `3px solid ${color}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ color, fontWeight: '800', fontSize: '1rem' }}>{displayName}</div>
                          {isKR && <div style={{ color: '#475569', fontSize: '0.72rem' }}>{r.ticker}</div>}
                        </div>
                        <div style={{
                          background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                          color: isPositive ? '#10b981' : '#f43f5e',
                          borderRadius: '8px', padding: '0.25rem 0.6rem',
                          fontSize: '0.85rem', fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {formatPct(r.totalReturn)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <div style={{ color: '#475569', fontSize: '0.7rem', marginBottom: '2px' }}>투자금</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
                            {formatMoney(investment, r.currency)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#475569', fontSize: '0.7rem', marginBottom: '2px' }}>현재 가치</div>
                          <div style={{ color: isPositive ? '#10b981' : '#f43f5e', fontSize: '0.85rem', fontWeight: '700' }}>
                            {formatMoney(r.currentValue, r.currency)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#475569', fontSize: '0.7rem', marginBottom: '2px' }}>손익</div>
                          <div style={{ color: isPositive ? '#10b981' : '#f43f5e', fontSize: '0.85rem', fontWeight: '600' }}>
                            {isPositive ? '+' : ''}{formatMoney(r.currentValue - investment, r.currency)}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#475569', fontSize: '0.7rem', marginBottom: '2px' }}>연환산(CAGR)</div>
                          <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600' }}>
                            {r.cagr !== null ? formatPct(r.cagr) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 면책 고지 */}
            <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: '2rem', lineHeight: '1.6' }}>
              * 본 시뮬레이션은 배당 재투자 포함 과거 수익률을 기반으로 계산됩니다. 과거 수익률이 미래 수익률을 보장하지 않습니다. 투자 결정 시 전문가 상담을 권장합니다.
            </p>
          </>
        )}

        {simulated && chartData.length === 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#475569',
          }}>
            선택한 날짜의 데이터가 없습니다. 다른 날짜나 ETF를 선택해 주세요.
          </div>
        )}
      </div>
    </div>
  );
}
