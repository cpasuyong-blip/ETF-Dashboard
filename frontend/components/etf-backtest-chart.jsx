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

const PERIOD_YEARS = { '1M': 1/12, '3M': 3/12, '6M': 6/12, '1Y': 1, '3Y': 3, '5Y': 5 };

// 한국 ETF: 이름이 primary, 코드가 secondary / 미국 ETF: 티커가 primary, 이름이 secondary
const getDisplayLabel = (etf) => {
  const isKR = etf.currency === 'KRW';
  return {
    primary: isKR ? etf.name : etf.ticker,
    secondary: isKR ? etf.ticker : etf.name,
  };
};

// 재사용 가능한 수평 바 차트 컴포넌트
function HorizontalBarChart({ data, title, icon, subtitle, tooltipLabel }) {
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
            {tooltipLabel}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        {icon}
        <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', margin: 0 }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1rem', paddingLeft: '2.25rem' }}>
          {subtitle}
        </p>
      )}

      {data.length === 0 ? (
        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
          선택한 기간의 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(150, data.length * 50 + 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
            <Bar
              dataKey="return"
              radius={[0, 6, 6, 0]}
              maxBarSize={36}
              label={({ x, y, width, height, value }) => {
                const label = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                const isNarrow = Math.abs(width) < 60;
                return (
                  <text
                    x={isNarrow ? x + width + (value >= 0 ? 6 : -6) : x + width - (value >= 0 ? 8 : -8)}
                    y={y + height / 2}
                    fill={isNarrow ? '#94a3b8' : '#fff'}
                    fontSize={12}
                    fontWeight={700}
                    textAnchor={isNarrow ? (value >= 0 ? 'start' : 'end') : (value >= 0 ? 'end' : 'start')}
                    dominantBaseline="central"
                  >
                    {label}
                  </text>
                );
              }}
            >
              {data.map((entry) => (
                <Cell key={entry.ticker} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

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

  // 3가지 차트 데이터 생성
  const buildChartData = (getValue) => {
    return selectedETFs
      .map(ticker => {
        const etf = allEtfs.find(e => e.ticker === ticker);
        if (!etf) return null;
        const value = getValue(etf);
        const { primary } = getDisplayLabel(etf);
        return { ticker: primary, return: value, color: getColor(ticker) };
      })
      .filter(d => d && d.return !== null)
      .sort((a, b) => b.return - a.return);
  };

  const priceData = buildChartData(etf => etf.returns?.[selectedPeriod] ?? null);
  const dividendData = buildChartData(etf => etf.dividendYield ?? null);
  const totalReturnData = buildChartData(etf => {
    const priceRet = etf.returns?.[selectedPeriod];
    const divYield = etf.dividendYield || 0;
    if (priceRet == null) return null;
    return Math.round((priceRet + divYield * PERIOD_YEARS[selectedPeriod]) * 100) / 100;
  });

  const statsData = selectedETFs.map(ticker => allEtfs.find(e => e.ticker === ticker)).filter(Boolean);
  const best = totalReturnData[0];
  const worst = totalReturnData[totalReturnData.length - 1];

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
      padding: '4rem 0.75rem 2rem',
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
            ETF 수익률 데이터
          </h1>
          <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', padding: '0 0.5rem' }}>
            실제 시장 데이터 기반 Total Return · 주가 · 배당 수익률 비교 분석
          </p>
        </header>

        {/* 기간 탭 */}
        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['1M', '3M', '6M', '1Y', '3Y', '5Y'].map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
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

        <style>{`
          .backtest-layout { display: grid; gap: 1rem; margin-bottom: 2rem; align-items: start; }
          @media (min-width: 769px) { .backtest-layout { grid-template-columns: 260px 1fr; } }
          @media (max-width: 768px) { .backtest-layout { grid-template-columns: 1fr; } }
          .sub-charts { display: grid; gap: 1rem; }
          @media (min-width: 769px) { .sub-charts { grid-template-columns: 1fr 1fr; } }
          @media (max-width: 768px) { .sub-charts { grid-template-columns: 1fr; } }
        `}</style>

        {/* 메인 레이아웃: ETF 선택 (좌) + 차트 (우) */}
        <div className="backtest-layout">
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

                {expandedCats[catKey] && cat.etfs.map(etf => {
                  const isSelected = selectedETFs.includes(etf.ticker);
                  const ret = etf.returns?.[selectedPeriod];
                  const color = getColor(etf.ticker);
                  const { primary } = getDisplayLabel(etf);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        {isSelected && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>
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

          {/* 차트 영역: 3개 차트 */}
          <div style={{ display: 'grid', gap: '1.5rem' }}>

            {/* 1. Total Return 차트 (메인) */}
            <HorizontalBarChart
              data={totalReturnData}
              title={`${selectedPeriod} Total Return`}
              icon={<TrendingUp size={24} color="#8b5cf6" />}
              subtitle="주가 수익률 + 배당 수익률 (기간 비례 환산)"
              tooltipLabel={`${selectedPeriod} Total Return`}
            />

            {/* 2+3. 주가수익률 / 배당수익률 나란히 */}
            <div className="sub-charts">
              <HorizontalBarChart
                data={priceData}
                title={`${selectedPeriod} 주가 수익률`}
                icon={<TrendingUp size={20} color="#3b82f6" />}
                tooltipLabel={`${selectedPeriod} 주가 수익률`}
              />
              <HorizontalBarChart
                data={dividendData}
                title="배당 수익률 (연간)"
                icon={<Percent size={20} color="#10b981" />}
                tooltipLabel="연간 배당 수익률"
              />
            </div>

          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {statsData.map(etf => {
            const color = getColor(etf.ticker);
            const priceRet = etf.returns?.[selectedPeriod];
            const divYield = etf.dividendYield || 0;
            const totalRet = priceRet != null
              ? Math.round((priceRet + divYield * PERIOD_YEARS[selectedPeriod]) * 100) / 100
              : null;
            const { primary, secondary } = getDisplayLabel(etf);
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
                      {primary}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {secondary}
                    </p>
                  </div>
                  {totalRet != null && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                      borderRadius: '8px',
                      color: totalRet >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                    }}>
                      {totalRet >= 0 ? '+' : ''}{totalRet.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {/* 주가 수익률 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.625rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={15} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>주가 수익률 ({selectedPeriod})</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: priceRet != null && priceRet >= 0 ? '#22c55e' : '#ef4444' }}>
                      {priceRet != null ? `${priceRet >= 0 ? '+' : ''}${priceRet.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>

                  {/* 배당 수익률 */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.625rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={15} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>배당 수익률 (연간)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#22c55e' }}>
                      {etf.dividendYield != null ? `${etf.dividendYield}%` : 'N/A'}
                    </span>
                  </div>

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
        {totalReturnData.length >= 2 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.1) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            backdropFilter: 'blur(20px)',
          }}>
            <h3 style={{
              fontSize: '1.25rem', fontWeight: '700', color: '#fff',
              display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1rem',
            }}>
              <TrendingUp size={24} color="#8b5cf6" />
              {selectedPeriod} 수익률 인사이트
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem', color: '#cbd5e1', fontSize: 'clamp(0.8rem, 2vw, 0.9375rem)', lineHeight: '1.6' }}>
              {best && (
                <p style={{ margin: 0 }}>
                  • <strong style={{ color: getColor(best.ticker) }}>{best.ticker}</strong>가{' '}
                  <strong style={{ color: '#22c55e' }}>+{best.return.toFixed(1)}%</strong>로{' '}
                  {selectedPeriod} 최고 Total Return을 기록했습니다.
                </p>
              )}
              {worst && worst.ticker !== best?.ticker && (
                <p style={{ margin: 0 }}>
                  • <strong style={{ color: getColor(worst.ticker) }}>{worst.ticker}</strong>의 Total Return은{' '}
                  <strong style={{ color: worst.return >= 0 ? '#22c55e' : '#ef4444' }}>
                    {worst.return >= 0 ? '+' : ''}{worst.return.toFixed(1)}%
                  </strong>
                  로 비교 대상 중 가장 낮습니다.
                </p>
              )}
              {(() => {
                const bestDiv = [...(statsData.filter(e => e.dividendYield))].sort((a, b) => b.dividendYield - a.dividendYield)[0];
                if (bestDiv && bestDiv.dividendYield > 0) {
                  const { primary: divPrimary } = getDisplayLabel(bestDiv);
                  return (
                    <p style={{ margin: 0 }}>
                      • 배당 수익률은 <strong style={{ color: getColor(bestDiv.ticker) }}>{divPrimary}</strong>가{' '}
                      <strong style={{ color: '#22c55e' }}>{bestDiv.dividendYield}%</strong>로 가장 높습니다.
                    </p>
                  );
                }
                return null;
              })()}
              {(() => {
                const highVol = [...statsData].sort((a, b) => (b.volatility || 0) - (a.volatility || 0))[0];
                const lowVol = [...statsData].sort((a, b) => (a.volatility || 999) - (b.volatility || 999))[0];
                if (highVol && lowVol && highVol.ticker !== lowVol.ticker && highVol.volatility && lowVol.volatility) {
                  const { primary: hvName } = getDisplayLabel(highVol);
                  const { primary: lvName } = getDisplayLabel(lowVol);
                  return (
                    <p style={{ margin: 0 }}>
                      • 변동성은 <strong style={{ color: getColor(highVol.ticker) }}>{hvName}</strong>{' '}
                      ({highVol.volatility}%)가 가장 높고,{' '}
                      <strong style={{ color: getColor(lowVol.ticker) }}>{lvName}</strong>{' '}
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

        {/* Disclaimer */}
        <footer style={{
          marginTop: '3rem',
          padding: '1.5rem 2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          color: '#475569',
          fontSize: '0.7rem',
          lineHeight: '1.7',
          letterSpacing: '0.01em',
        }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: '#64748b', fontSize: '0.75rem' }}>
            Data Methodology
          </p>
          <p style={{ margin: 0 }}>
            수익률은 Yahoo Finance(yfinance)에서 제공하는 배당·분할 조정 종가(Adjusted Close) 기준 Total Return으로 계산됩니다.
            기간 산출은 달력 날짜 기준이며, 해당 일자가 비거래일인 경우 직전 마지막 거래일 종가를 사용합니다(Yahoo Finance 동일 방식).
            3년·5년 수익률에 표기된 연환산(CAGR)은 복리 기준 연평균 수익률입니다.
            변동성은 일별 수익률의 표준편차를 연환산(×√252)한 값이며, 최대 낙폭(MDD)은 누적 수익률 고점 대비 최대 하락폭입니다.
            본 데이터는 투자 참고용이며, 투자 판단의 최종 책임은 이용자 본인에게 있습니다.
          </p>
        </footer>

      </div>
    </div>
  );
}
