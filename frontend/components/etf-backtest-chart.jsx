'use client'
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Percent } from 'lucide-react';
import Navigation from './Navigation';

const COLOR_PALETTE = ['#8b5cf6', '#10b981', '#3b82f6', '#f43f5e', '#f59e0b'];

const CATEGORY_LABELS = {
  '미국_S&P500': 'S&P500', '미국_나스닥': '나스닥', '미국_채권': '채권',
  '미국_기술주': '기술주', '미국_배당': '배당',
  '한국_KOSPI': 'KOSPI', '한국_KOSDAQ': 'KOSDAQ', '한국_산업별': '산업테마',
};

export default function ETFBacktestChart() {
  const [allEtfs, setAllEtfs] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedETFs, setSelectedETFs] = useState(['QQQ', 'SCHD', 'SPY']);
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCats, setExpandedCats] = useState({ '미국_나스닥': true, '미국_배당': true, '미국_S&P500': true });

  useEffect(() => {
    fetch('/api/etf-data')
      .then(res => res.json())
      .then(data => {
        const etfs = [];
        const cats = {};
        Object.entries(data.categories).forEach(([catKey, cat]) => {
          cats[catKey] = cat;
          cat.etfs.forEach(etf => etfs.push({ ...etf, category: catKey, country: cat.country }));
        });
        setAllEtfs(etfs);
        setCategories(cats);
        // 기본 선택: QQQ, SCHD, SPY (있는 것만)
        const defaults = ['QQQ', 'SCHD', 'SPY'].filter(t => etfs.some(e => e.ticker === t));
        if (defaults.length > 0) setSelectedETFs(defaults);
        else setSelectedETFs(etfs.slice(0, 3).map(e => e.ticker));
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const getColor = (ticker) => {
    const idx = allEtfs.findIndex(e => e.ticker === ticker);
    return COLOR_PALETTE[idx % COLOR_PALETTE.length];
  };

  const toggleETF = (ticker) => {
    if (selectedETFs.includes(ticker)) {
      if (selectedETFs.length > 1) setSelectedETFs(prev => prev.filter(t => t !== ticker));
    } else {
      if (selectedETFs.length < 5) setSelectedETFs(prev => [...prev, ticker]);
    }
  };

  const toggleCat = (cat) => setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  // 차트 데이터: 선택 ETF를 수익률 순으로 정렬
  const chartData = selectedETFs
    .map(ticker => {
      const etf = allEtfs.find(e => e.ticker === ticker);
      if (!etf) return null;
      return {
        ticker,
        return: etf.returns?.[selectedPeriod] ?? null,
        color: getColor(ticker),
      };
    })
    .filter(d => d && d.return !== null)
    .sort((a, b) => b.return - a.return);

  // 통계 카드용 ETF 정보
  const statsData = selectedETFs.map(ticker => allEtfs.find(e => e.ticker === ticker)).filter(Boolean);

  // 동적 인사이트
  const best = chartData[0];
  const worst = chartData[chartData.length - 1];

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(15, 15, 30, 0.95)',
          border: `1px solid ${d.color}50`,
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ color: d.color, fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>
            {d.ticker}
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
            {d.return >= 0 ? '+' : ''}{d.return.toFixed(2)}%
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {selectedPeriod} 수익률
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Navigation />
      <div style={{ color: '#8b5cf6', fontSize: '1.25rem' }}>데이터 로딩 중...</div>
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <Navigation />
      <div style={{ color: '#ef4444', fontSize: '1.25rem' }}>오류: {error}</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '5rem 1rem 2rem',
    }}>
      <Navigation />
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fff 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            ETF 수익률 비교
          </h1>
          <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
            실제 시장 데이터 기반 기간별 수익률 · 리스크 비교 분석
          </p>
        </header>

        {/* 기간 탭 */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
          {['1M', '3M', '6M', '1Y'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              style={{
                padding: '0.625rem 1.5rem',
                border: 'none',
                borderRadius: '10px',
                background: selectedPeriod === p
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: selectedPeriod === p ? '#fff' : '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 메인 레이아웃: ETF 선택 (좌) + 차트 (우) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
          alignItems: 'start',
        }}>
          {/* ETF 선택 패널 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '1.25rem',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginBottom: '1rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              ETF 선택 ({selectedETFs.length}/5)
            </div>

            {Object.entries(categories).map(([catKey, cat]) => (
              <div key={catKey} style={{ marginBottom: '0.5rem' }}>
                {/* 카테고리 헤더 */}
                <button
                  onClick={() => toggleCat(catKey)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: expandedCats[catKey] ? '0.375rem' : '0',
                  }}
                >
                  <span>{CATEGORY_LABELS[catKey] || catKey}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {expandedCats[catKey] ? '▲' : '▼'}
                  </span>
                </button>

                {/* ETF 목록 */}
                {expandedCats[catKey] && cat.etfs.map(etf => {
                  const isSelected = selectedETFs.includes(etf.ticker);
                  const ret = etf.returns?.[selectedPeriod];
                  const color = getColor(etf.ticker);
                  return (
                    <button
                      key={etf.ticker}
                      onClick={() => toggleETF(etf.ticker)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.375rem 0.75rem',
                        marginBottom: '0.25rem',
                        border: isSelected ? `1px solid ${color}60` : '1px solid transparent',
                        borderRadius: '8px',
                        background: isSelected ? `${color}15` : 'transparent',
                        color: isSelected ? '#fff' : '#64748b',
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isSelected && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        )}
                        <span>{etf.ticker}</span>
                      </div>
                      {ret != null && (
                        <span style={{
                          fontSize: '0.75rem',
                          color: ret >= 0 ? '#22c55e' : '#ef4444',
                          fontWeight: '600',
                        }}>
                          {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 수익률 비교 차트 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <TrendingUp size={24} color="#8b5cf6" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                {selectedPeriod} 수익률 비교
              </h2>
            </div>

            {chartData.length === 0 ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                선택한 기간의 데이터가 없습니다.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 60 + 80)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }}
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar dataKey="return" radius={[0, 6, 6, 0]} maxBarSize={40}>
                    {chartData.map((entry) => (
                      <Cell key={entry.ticker} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          {statsData.map(etf => {
            const color = getColor(etf.ticker);
            const ret = etf.returns?.[selectedPeriod];
            return (
              <div
                key={etf.ticker}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${color}30`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color,
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                      {etf.ticker}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {etf.name}
                    </p>
                  </div>
                  {ret != null && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                      borderRadius: '8px',
                      color: ret >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                    }}>
                      {ret >= 0 ? '+' : ''}{ret.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {/* 변동성 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.625rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={15} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>변동성 (연환산)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                      {etf.volatility != null ? `${etf.volatility}%` : 'N/A'}
                    </span>
                  </div>

                  {/* 최대 낙폭 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.625rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingDown size={15} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>최대 낙폭 (MDD)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>
                      {etf.maxDrawdown != null ? `${etf.maxDrawdown}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 동적 인사이트 */}
        {chartData.length >= 2 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
          }}>
            <h3 style={{
              fontSize: '1.25rem', fontWeight: '700', color: '#fff',
              marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1rem',
            }}>
              <TrendingUp size={24} color="#8b5cf6" />
              {selectedPeriod} 수익률 인사이트
            </h3>
            <div style={{ display: 'grid', gap: '0.875rem', color: '#cbd5e1', fontSize: '0.9375rem', lineHeight: '1.6' }}>
              {best && (
                <p style={{ margin: 0 }}>
                  • <strong style={{ color: getColor(best.ticker) }}>{best.ticker}</strong>가{' '}
                  <strong style={{ color: '#22c55e' }}>+{best.return.toFixed(1)}%</strong>로{' '}
                  {selectedPeriod} 최고 수익률을 기록했습니다.
                </p>
              )}
              {worst && worst.ticker !== best?.ticker && (
                <p style={{ margin: 0 }}>
                  • <strong style={{ color: getColor(worst.ticker) }}>{worst.ticker}</strong>의 수익률은{' '}
                  <strong style={{ color: worst.return >= 0 ? '#22c55e' : '#ef4444' }}>
                    {worst.return >= 0 ? '+' : ''}{worst.return.toFixed(1)}%
                  </strong>
                  로 비교 대상 중 가장 낮습니다.
                </p>
              )}
              {(() => {
                const highVol = [...statsData].sort((a, b) => (b.volatility || 0) - (a.volatility || 0))[0];
                const lowVol = [...statsData].sort((a, b) => (a.volatility || 999) - (b.volatility || 999))[0];
                if (highVol && lowVol && highVol.ticker !== lowVol.ticker && highVol.volatility && lowVol.volatility) {
                  return (
                    <p style={{ margin: 0 }}>
                      • 변동성은 <strong style={{ color: getColor(highVol.ticker) }}>{highVol.ticker}</strong>{' '}
                      ({highVol.volatility}%)가 가장 높고,{' '}
                      <strong style={{ color: getColor(lowVol.ticker) }}>{lowVol.ticker}</strong>{' '}
                      ({lowVol.volatility}%)가 가장 낮아 안정적입니다.
                    </p>
                  );
                }
                return null;
              })()}
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                • 좌측 패널에서 ETF를 선택/해제하여 최대 5개까지 비교할 수 있습니다.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
