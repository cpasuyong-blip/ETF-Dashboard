import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar, DollarSign, Percent, Activity } from 'lucide-react';

// 백테스트 데이터 (100으로 정규화된 수익률)
const backtestData = [
  { date: '2024-02', QQQ: 100, SCHD: 100, 'KODEX 200': 100 },
  { date: '2024-03', QQQ: 103.2, SCHD: 101.5, 'KODEX 200': 99.2 },
  { date: '2024-04', QQQ: 108.7, SCHD: 103.8, 'KODEX 200': 101.5 },
  { date: '2024-05', QQQ: 112.4, SCHD: 105.2, 'KODEX 200': 98.7 },
  { date: '2024-06', QQQ: 118.9, SCHD: 107.9, 'KODEX 200': 102.3 },
  { date: '2024-07', QQQ: 115.3, SCHD: 109.4, 'KODEX 200': 100.8 },
  { date: '2024-08', QQQ: 121.7, SCHD: 111.8, 'KODEX 200': 103.6 },
  { date: '2024-09', QQQ: 125.2, SCHD: 113.2, 'KODEX 200': 105.9 },
  { date: '2024-10', QQQ: 128.9, SCHD: 115.7, 'KODEX 200': 107.2 },
  { date: '2024-11', QQQ: 134.6, SCHD: 118.3, 'KODEX 200': 109.8 },
  { date: '2024-12', QQQ: 138.2, SCHD: 120.9, 'KODEX 200': 111.4 },
  { date: '2025-01', QQQ: 142.8, SCHD: 123.1, 'KODEX 200': 113.7 },
  { date: '2025-02', QQQ: 148.7, SCHD: 125.8, 'KODEX 200': 115.2 }
];

// 변동성 데이터
const volatilityData = [
  { etf: 'QQQ', volatility: 18.5, sharpe: 1.42 },
  { etf: 'SCHD', volatility: 12.3, sharpe: 1.68 },
  { etf: 'KODEX 200', volatility: 15.8, sharpe: 0.98 }
];

// 드로다운 데이터
const drawdownData = [
  { date: '2024-02', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-03', QQQ: 0, SCHD: 0, 'KODEX 200': -0.8 },
  { date: '2024-04', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-05', QQQ: 0, SCHD: 0, 'KODEX 200': -2.8 },
  { date: '2024-06', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-07', QQQ: -3.0, SCHD: 0, 'KODEX 200': -1.5 },
  { date: '2024-08', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-09', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-10', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-11', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2024-12', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2025-01', QQQ: 0, SCHD: 0, 'KODEX 200': 0 },
  { date: '2025-02', QQQ: 0, SCHD: 0, 'KODEX 200': 0 }
];

const etfColors = {
  'QQQ': '#8b5cf6',
  'SCHD': '#10b981',
  'KODEX 200': '#3b82f6'
};

export default function ETFBacktestChart() {
  const [selectedETFs, setSelectedETFs] = useState(['QQQ', 'SCHD', 'KODEX 200']);
  const [chartType, setChartType] = useState('cumulative');

  const toggleETF = (etf) => {
    if (selectedETFs.includes(etf)) {
      if (selectedETFs.length > 1) {
        setSelectedETFs(selectedETFs.filter(e => e !== etf));
      }
    } else {
      setSelectedETFs([...selectedETFs, etf]);
    }
  };

  // 최종 수익률 계산
  const finalReturns = {
    'QQQ': ((backtestData[backtestData.length - 1].QQQ - 100) / 100 * 100).toFixed(1),
    'SCHD': ((backtestData[backtestData.length - 1].SCHD - 100) / 100 * 100).toFixed(1),
    'KODEX 200': ((backtestData[backtestData.length - 1]['KODEX 200'] - 100) / 100 * 100).toFixed(1)
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 15, 30, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginBottom: '0.5rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={12} />
            {label}
          </div>
          {payload.map((entry, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginTop: '0.375rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: entry.color
                }} />
                <span style={{
                  fontSize: '0.875rem',
                  color: '#fff',
                  fontWeight: '600'
                }}>
                  {entry.name}
                </span>
              </div>
              <span style={{
                fontSize: '0.875rem',
                color: entry.color,
                fontWeight: '700',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {chartType === 'cumulative' 
                  ? `${((entry.value - 100)).toFixed(1)}%`
                  : `${entry.value.toFixed(1)}%`
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '2rem 1rem'
    }}>
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
            letterSpacing: '-0.02em'
          }}>
            ETF 백테스트 비교
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            2024년 2월 ~ 2025년 2월 (1년) 성과 비교 분석
          </p>
        </header>

        {/* ETF 선택 버튼 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {Object.keys(etfColors).map(etf => (
            <button
              key={etf}
              onClick={() => toggleETF(etf)}
              style={{
                padding: '0.75rem 1.5rem',
                border: selectedETFs.includes(etf) 
                  ? `2px solid ${etfColors[etf]}`
                  : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                background: selectedETFs.includes(etf)
                  ? `${etfColors[etf]}20`
                  : 'rgba(255, 255, 255, 0.03)',
                color: selectedETFs.includes(etf) ? etfColors[etf] : '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transform: selectedETFs.includes(etf) ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!selectedETFs.includes(etf)) {
                  e.currentTarget.style.borderColor = etfColors[etf];
                  e.currentTarget.style.color = etfColors[etf];
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedETFs.includes(etf)) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: etfColors[etf]
              }} />
              {etf}
              <span style={{
                fontSize: '0.75rem',
                padding: '0.125rem 0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                fontVariantNumeric: 'tabular-nums'
              }}>
                +{finalReturns[etf]}%
              </span>
            </button>
          ))}
        </div>

        {/* 차트 타입 선택 */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setChartType('cumulative')}
            style={{
              padding: '0.625rem 1.25rem',
              border: 'none',
              borderRadius: '10px',
              background: chartType === 'cumulative'
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: chartType === 'cumulative' ? '#fff' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            누적 수익률
          </button>
          <button
            onClick={() => setChartType('drawdown')}
            style={{
              padding: '0.625rem 1.25rem',
              border: 'none',
              borderRadius: '10px',
              background: chartType === 'drawdown'
                ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              color: chartType === 'drawdown' ? '#fff' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            드로다운
          </button>
        </div>

        {/* 메인 차트 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <TrendingUp size={24} color="#8b5cf6" />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0
            }}>
              {chartType === 'cumulative' ? '누적 수익률 추이' : '최대 낙폭 (MDD)'}
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'cumulative' ? (
              <AreaChart data={backtestData}>
                <defs>
                  {selectedETFs.map(etf => (
                    <linearGradient key={etf} id={`gradient-${etf}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={etfColors[etf]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={etfColors[etf]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255, 255, 255, 0.05)"
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[95, 155]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                  iconType="circle"
                />
                {selectedETFs.map(etf => (
                  <Area
                    key={etf}
                    type="monotone"
                    dataKey={etf}
                    stroke={etfColors[etf]}
                    strokeWidth={3}
                    fill={`url(#gradient-${etf})`}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                ))}
              </AreaChart>
            ) : (
              <AreaChart data={drawdownData}>
                <defs>
                  {selectedETFs.map(etf => (
                    <linearGradient key={etf} id={`gradient-dd-${etf}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255, 255, 255, 0.05)"
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '0.75rem' }}
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                  iconType="circle"
                />
                {selectedETFs.map(etf => (
                  <Area
                    key={etf}
                    type="monotone"
                    dataKey={etf}
                    stroke={etfColors[etf]}
                    strokeWidth={3}
                    fill={`url(#gradient-dd-${etf})`}
                    animationDuration={1000}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {selectedETFs.map(etf => {
            const volatility = volatilityData.find(v => v.etf === etf);
            return (
              <div
                key={etf}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${etfColors[etf]}30`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: etfColors[etf]
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#fff',
                    margin: 0
                  }}>
                    {etf}
                  </h3>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: `${etfColors[etf]}20`,
                    border: `1px solid ${etfColors[etf]}40`,
                    borderRadius: '8px',
                    color: etfColors[etf],
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    +{finalReturns[etf]}%
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        변동성
                      </span>
                    </div>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#fff',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {volatility?.volatility}%
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        샤프 비율
                      </span>
                    </div>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#22c55e',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {volatility?.sharpe}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Percent size={16} color="#94a3b8" />
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        최대 낙폭
                      </span>
                    </div>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#ef4444',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {etf === 'QQQ' ? '-3.0%' : etf === 'SCHD' ? '0%' : '-2.8%'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 인사이트 섹션 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <DollarSign size={24} color="#8b5cf6" />
            백테스트 인사이트
          </h3>
          <div style={{
            display: 'grid',
            gap: '1rem',
            color: '#cbd5e1',
            fontSize: '0.9375rem',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: 0 }}>
              • <strong style={{ color: '#8b5cf6' }}>QQQ</strong>가 가장 높은 수익률(+48.7%)을 기록했으나, 변동성도 18.5%로 가장 높습니다.
            </p>
            <p style={{ margin: 0 }}>
              • <strong style={{ color: '#10b981' }}>SCHD</strong>는 안정적인 성과(+25.8%)와 가장 높은 샤프 비율(1.68)로 리스크 대비 최고의 효율을 보였습니다.
            </p>
            <p style={{ margin: 0 }}>
              • <strong style={{ color: '#3b82f6' }}>KODEX 200</strong>은 상대적으로 낮은 수익률(+15.2%)을 기록했으며, 한국 시장의 부진이 반영되었습니다.
            </p>
            <p style={{ margin: 0 }}>
              • 포트폴리오 분산 전략으로 세 ETF를 조합하면, 리스크를 낮추면서도 안정적인 수익을 기대할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
