'use client'
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw } from 'lucide-react';
import Navigation from './Navigation';

// 4대 지수와 관련 ETF 정의
const INDEX_GROUPS = [
  {
    id: 'sp500',
    label: 'S&P 500',
    primary: 'SPY',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    etfs: ['SPY', 'VOO', 'IVV', 'SPLG', '360750', '379800'],
    description: '미국 대형주 500',
  },
  {
    id: 'nasdaq',
    label: '나스닥 100',
    primary: 'QQQ',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    etfs: ['QQQ', 'QQQM', 'ONEQ', 'TQQQ', '381170', '133690'],
    description: '미국 기술주 중심',
  },
  {
    id: 'kospi',
    label: 'KOSPI 200',
    primary: '069500',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #0d9488)',
    etfs: ['069500', '102110', '278530', '122630', '252670'],
    description: '한국 대형주',
  },
  {
    id: 'kosdaq',
    label: 'KOSDAQ 150',
    primary: '229200',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    etfs: ['229200', '091180'],
    description: '한국 성장주',
  },
];

function formatReturn(val) {
  if (val == null) return '-';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

function ReturnBadge({ value, large = false }) {
  if (value == null) return <span style={{ color: '#64748b' }}>-</span>;
  const pos = value >= 0;
  return (
    <span style={{
      color: pos ? '#10b981' : '#f43f5e',
      fontWeight: large ? '800' : '600',
      fontSize: large ? 'clamp(1.8rem, 4vw, 2.5rem)' : 'inherit',
      fontFeatureSettings: '"tnum"',
    }}>
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function MiniBar({ value, maxAbs }) {
  if (value == null) return null;
  const pos = value >= 0;
  const width = maxAbs > 0 ? Math.abs(value) / maxAbs * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: pos ? '#10b981' : '#f43f5e',
          borderRadius: '3px',
          marginLeft: pos ? '0' : 'auto',
        }} />
      </div>
    </div>
  );
}

function IndexCard({ group, etfMap, indicesMap, period }) {
  const primaryEtf = etfMap[group.primary];
  const primaryReturn = primaryEtf?.returns?.[period] ?? null;
  const indexData = indicesMap[group.id] ?? null;

  // 관련 ETF 데이터 수집
  const relatedEtfs = group.etfs
    .map(ticker => etfMap[ticker])
    .filter(Boolean)
    .map(etf => ({
      ticker: etf.ticker,
      name: etf.name,
      isKR: etf.currency === 'KRW',
      ret: etf.returns?.[period] ?? null,
    }))
    .sort((a, b) => (b.ret ?? -Infinity) - (a.ret ?? -Infinity));

  const maxAbs = Math.max(...relatedEtfs.map(e => Math.abs(e.ret ?? 0)), 0.01);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${group.color}30`,
      borderRadius: '20px',
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-block',
            background: group.gradient,
            borderRadius: '8px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem',
          }}>
            {group.label}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{group.description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
            {group.primary}
          </div>
          <ReturnBadge value={primaryReturn} large />
        </div>
      </div>

      {/* 실제 지수 변동 - 모든 기간에 표시 */}
      {indexData && (
        <IndexSummary indexData={indexData} period={period} color={group.color} />
      )}

      {/* 구분선 */}
      <div style={{ borderTop: `1px solid ${group.color}20` }} />

      {/* 관련 ETF 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {relatedEtfs.map(etf => (
          <div key={etf.ticker} style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 70px',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <div>
              <div style={{
                color: '#fff', fontWeight: '600', fontSize: '0.85rem',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px',
              }}>
                {etf.isKR ? etf.name : etf.ticker}
              </div>
              <div style={{
                color: '#64748b',
                fontSize: '0.65rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '85px',
              }}>
                {etf.isKR ? etf.ticker : etf.name?.split(' ').slice(0, 3).join(' ')}
              </div>
            </div>
            <MiniBar value={etf.ret} maxAbs={maxAbs} />
            <div style={{ textAlign: 'right' }}>
              <ReturnBadge value={etf.ret} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 지수값 포맷
function fmtIndexValue(val, currency) {
  if (val == null) return '-';
  if (currency === 'KRW') return val.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 날짜 포맷: "2026-02-10" → "2.10"
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}.${parseInt(d)}`;
}

// 지수 변동 컴포넌트 (날짜 제거, 수치 크게)
function IndexSummary({ indexData, period, color }) {
  if (!indexData) return null;
  const pd = indexData.periods?.[period];
  if (!pd) return null;
  const pos = pd.changePct >= 0;
  const sign = pos ? '+' : '';
  return (
    <div style={{
      background: `${color}10`,
      border: `1px solid ${color}35`,
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
    }}>
      {/* 지수값: 시작 → 현재 */}
      <div>
        <div style={{ color: '#475569', fontSize: '0.68rem', marginBottom: '0.3rem' }}>
          {indexData.label} 지수
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {fmtIndexValue(pd.prevValue, indexData.currency)}
          <span style={{ margin: '0 0.35rem', color: '#334155' }}>→</span>
          <span style={{ color: '#e2e8f0', fontWeight: '700' }}>
            {fmtIndexValue(indexData.currentValue, indexData.currency)}
          </span>
        </div>
      </div>
      {/* 변동률 크게 */}
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <div style={{
          color: pos ? '#10b981' : '#f43f5e',
          fontWeight: '800',
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {sign}{pd.changePct.toFixed(2)}%
        </div>
        <div style={{ color: pos ? '#6ee7b7' : '#fca5a5', fontSize: '0.72rem', marginTop: '0.25rem' }}>
          {sign}{fmtIndexValue(pd.changePoints, indexData.currency)} pts
        </div>
      </div>
    </div>
  );
}

export default function ETFRecap() {
  const [period, setPeriod] = useState('1W');
  const [etfMap, setEtfMap] = useState({});
  const [indicesMap, setIndicesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetch('/api/etf-data')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        // ticker → ETF 데이터 맵 생성
        const map = {};
        for (const cat of Object.values(data.categories)) {
          for (const etf of cat.etfs) {
            map[etf.ticker] = etf;
          }
        }
        setEtfMap(map);
        setIndicesMap(data.indices || {});
        setLastUpdate(data.metadata?.lastUpdate);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 기간 안내: 인덱스 데이터의 실제 날짜 사용
  const firstIndex = Object.values(indicesMap)[0];
  const periodDateInfo = firstIndex?.periods?.[period]
    ? { from: firstIndex.periods[period].prevDate, to: firstIndex.currentDate }
    : null;

  const periodOptions = [
    { key: '1W', label: '주간' },
    { key: '1M', label: '월간' },
    { key: '3M', label: '3개월' },
  ];

  const bgStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  };

  if (loading) {
    return (
      <div style={{ ...bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Navigation />
        <div style={{ width: '40px', height: '40px', border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b' }}>데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...bgStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navigation />
        <p style={{ color: '#f43f5e' }}>오류: {error}</p>
      </div>
    );
  }

  return (
    <div style={bgStyle}>
      <Navigation />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4.5rem, 10vw, 6rem) 1rem 3rem' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Calendar size={20} color="#8b5cf6" />
            <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: '800', color: '#fff' }}>
              주요 지수 리캡
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', paddingLeft: '1.75rem' }}>
            <RefreshCw size={12} />
            {lastUpdate ? `업데이트: ${new Date(lastUpdate).toLocaleString('ko-KR')}` : ''}
          </div>
        </div>

        {/* 기간 선택 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {periodOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.85rem',
                background: period === key
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : 'rgba(255,255,255,0.06)',
                color: period === key ? '#fff' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 기간 안내 - 실제 날짜 표시 */}
        {periodDateInfo && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '10px',
            padding: '0.4rem 1rem',
            fontSize: '0.8rem',
            color: '#a78bfa',
            marginBottom: '1.5rem',
          }}>
            <Calendar size={13} />
            {fmtDate(periodDateInfo.from)} ~ {fmtDate(periodDateInfo.to)} 기준
          </div>
        )}

        {/* 4개 지수 카드 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 480px), 1fr))',
          gap: '1.25rem',
        }}>
          {INDEX_GROUPS.map(group => (
            <IndexCard
              key={group.id}
              group={group}
              etfMap={etfMap}
              indicesMap={indicesMap}
              period={period}
            />
          ))}
        </div>

        {/* 범례 */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem 1.5rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          fontSize: '0.75rem',
          color: '#64748b',
        }}>
          * 수익률은 각 ETF의 종가 기준이며, 주간은 최근 5 거래일 기준입니다.
          미국 ETF는 USD 기준, 한국 ETF는 KRW 기준입니다.
        </div>
      </div>
    </div>
  );
}
