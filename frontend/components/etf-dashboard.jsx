'use client'

import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, BarChart3, Star, X, Activity, Percent } from 'lucide-react';
import Navigation from './Navigation';

// 카테고리명 → 테마 매핑
const categoryToTheme = {
  '미국_S&P500': '대형주',
  '미국_나스닥': '성장주',
  '미국_채권': '채권',
  '미국_기술주': '섹터-기술',
  '미국_배당': '배당주',
  '한국_KOSPI': '대형주',
  '한국_KOSDAQ': '성장주',
  '한국_산업별': '테마',
};

// 카테고리 표시 레이블
const categoryLabels = {
  '미국_S&P500': 'S&P500',
  '미국_나스닥': '나스닥',
  '미국_채권': '채권',
  '미국_기술주': '기술주',
  '미국_배당': '배당',
  '한국_KOSPI': 'KOSPI',
  '한국_KOSDAQ': 'KOSDAQ',
  '한국_산업별': '산업테마',
};

const US_CATEGORIES = ['미국_S&P500', '미국_나스닥', '미국_채권', '미국_기술주', '미국_배당'];
const KR_CATEGORIES = ['한국_KOSPI', '한국_KOSDAQ', '한국_산업별'];

// AUM 숫자 → 포맷 문자열
function formatAUM(aum, currency) {
  if (!aum) return '-';
  if (currency === 'KRW') {
    const jo = aum / 1e12;
    return jo >= 1 ? `${jo.toFixed(1)}조` : `${(aum / 1e8).toFixed(0)}억`;
  }
  if (aum >= 1e12) return `${(aum / 1e12).toFixed(1)}T`;
  if (aum >= 1e9) return `${(aum / 1e9).toFixed(0)}B`;
  return `${(aum / 1e6).toFixed(0)}M`;
}

// API 데이터 → 컴포넌트 형식으로 변환
function transformData(database) {
  const result = [];
  for (const [category, info] of Object.entries(database.categories)) {
    const theme = categoryToTheme[category] || '기타';
    for (const etf of info.etfs) {
      result.push({
        ticker: etf.ticker,
        name: etf.name,
        price: etf.price,
        change: etf.priceChangePct,
        returns: etf.returns,
        aum: formatAUM(etf.aum, etf.currency),
        theme,
        category,
        country: etf.currency === 'KRW' ? 'KR' : 'US',
        currency: etf.currency,
        volatility: etf.volatility,
        maxDrawdown: etf.maxDrawdown,
        dividendYield: etf.dividendYield,
        expenseRatio: etf.expenseRatio,
      });
    }
  }
  return result;
}

// 테마별 그라디언트 색상 (CSS hex)
const themeColors = {
  '성장주': '#8b5cf6 #6366f1',
  '배당주': '#10b981 #0d9488',
  '대형주': '#3b82f6 #4f46e5',
  '테마': '#f43f5e #ec4899',
  '섹터-기술': '#06b6d4 #3b82f6',
  '채권': '#f59e0b #d97706',
  '기타': '#6b7280 #4b5563',
};

const getGradient = (theme, dir = '135deg') =>
  `linear-gradient(${dir}, ${(themeColors[theme] || themeColors['기타']).split(' ').join(', ')})`;

export default function ETFDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('1Y');
  const [selectedTheme, setSelectedTheme] = useState('전체');
  const [selectedCountry, setSelectedCountry] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [etfData, setEtfData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEtf, setSelectedEtf] = useState(null);

  // 모달 Escape 키 닫기
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setSelectedEtf(null); };
    if (selectedEtf) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedEtf]);

  useEffect(() => {
    fetch('/api/etf-data')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setEtfData(transformData(data));
        setMetadata(data.metadata);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const periods = ['1M', '3M', '6M', '1Y'];
  const themes = ['전체', '성장주', '배당주', '대형주', '테마', '섹터-기술', '채권'];

  // 국가 탭에 따라 보여줄 카테고리 탭 목록
  const visibleCategories =
    selectedCountry === 'US' ? US_CATEGORIES :
    selectedCountry === 'KR' ? KR_CATEGORIES :
    [...US_CATEGORIES, ...KR_CATEGORIES];

  // 국가 탭 변경 시 카테고리 리셋 핸들러
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedCategory('전체');
  };

  // 3단계 필터 적용
  let filteredData = etfData;
  if (selectedCountry !== '전체') filteredData = filteredData.filter(e => e.country === selectedCountry);
  if (selectedCategory !== '전체') filteredData = filteredData.filter(e => e.category === selectedCategory);
  if (selectedTheme !== '전체') filteredData = filteredData.filter(e => e.theme === selectedTheme);

  const sortedData = [...filteredData].sort(
    (a, b) => (b.returns[selectedPeriod] ?? -Infinity) - (a.returns[selectedPeriod] ?? -Infinity)
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(139, 92, 246, 0.3)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>ETF 데이터 로딩 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p style={{ color: '#ef4444', fontSize: '1rem' }}>⚠ 데이터 로드 실패: {error}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '5rem 1rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Navigation />
      {/* 배경 장식 */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* 헤더 */}
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1rem', padding: '0.5rem 1.5rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '100px', backdropFilter: 'blur(10px)'
          }}>
            <BarChart3 size={20} color="#a78bfa" />
            <span style={{ fontSize: '0.875rem', color: '#c4b5fd', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Premium ETF Analytics
            </span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '700',
            background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: '0.5rem', letterSpacing: '-0.02em'
          }}>
            ETF Performance Hub
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            미국과 한국 주요 ETF의 실시간 성과 분석과 투자 인사이트
          </p>
          {metadata && (
            <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.5rem' }}>
              마지막 업데이트: {new Date(metadata.lastUpdate).toLocaleString('ko-KR')} · 총 {metadata.totalETFs}개 ETF
            </p>
          )}
        </header>

        {/* 1단: 국가 탭 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { key: '전체', label: '전체', flag: '🌐' },
            { key: 'US',   label: '미국',  flag: '🇺🇸' },
            { key: 'KR',   label: '한국',  flag: '🇰🇷' },
          ].map(({ key, label, flag }) => {
            const active = selectedCountry === key;
            return (
              <button
                key={key}
                onClick={() => handleCountryChange(key)}
                style={{
                  padding: '0.625rem 1.5rem',
                  borderRadius: '100px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  background: active ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#fff' : '#94a3b8',
                  border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: active ? '0 4px 16px rgba(139,92,246,0.3)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{flag}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* 2단: 카테고리 탭 */}
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: '0.4rem', marginBottom: '2rem',
          padding: '0.75rem 1rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => setSelectedCategory('전체')}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedCategory === '전체' ? 'rgba(139,92,246,0.3)' : 'transparent',
              color: selectedCategory === '전체' ? '#c4b5fd' : '#64748b',
              border: selectedCategory === '전체' ? '1px solid rgba(139,92,246,0.5)' : '1px solid transparent',
            }}
          >
            전체
          </button>
          {visibleCategories.map(cat => {
            const active = selectedCategory === cat;
            const isKR = KR_CATEGORIES.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: active
                    ? isKR ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'
                    : 'transparent',
                  color: active
                    ? isKR ? '#93c5fd' : '#c4b5fd'
                    : '#64748b',
                  border: active
                    ? isKR ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(139,92,246,0.5)'
                    : '1px solid transparent',
                }}
              >
                {categoryLabels[cat]}
              </button>
            );
          })}
        </div>

        {/* 3단: 기간 + 테마 필터 */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              기간
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {periods.map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: selectedPeriod === period ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedPeriod === period ? '#fff' : '#94a3b8',
                    backdropFilter: 'blur(10px)',
                    border: selectedPeriod === period ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    transform: selectedPeriod === period ? 'translateY(-2px)' : 'none',
                    boxShadow: selectedPeriod === period ? '0 8px 20px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              테마
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{
                padding: '0.625rem 1rem', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)', color: '#fff',
                fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                backdropFilter: 'blur(10px)', outline: 'none', minWidth: '180px'
              }}
            >
              {themes.map(theme => (
                <option key={theme} value={theme} style={{ background: '#1a1a2e' }}>{theme}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TOP 3 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {sortedData.slice(0, 3).map((etf, index) => (
            <div
              key={etf.ticker}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px', padding: '1.75rem',
                backdropFilter: 'blur(20px)', position: 'relative',
                overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer', animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {index === 0 && (
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', color: '#1a1a2e'
                }}>
                  <Star size={12} fill="currentColor" />
                  TOP
                </div>
              )}

              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: getGradient(etf.theme, '90deg') }} />

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                        {etf.ticker}
                      </h3>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '6px', color: '#c4b5fd', fontWeight: '600' }}>
                        {etf.country}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                      {etf.name}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: getGradient(etf.theme), borderRadius: '8px', color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {etf.theme}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '1rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {etf.country === 'US' ? '$' : '₩'}{etf.price.toLocaleString()}
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.25rem 0.625rem', borderRadius: '6px',
                    background: etf.change >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${etf.change >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    {etf.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: etf.change >= 0 ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                      {etf.change >= 0 ? '+' : ''}{etf.change}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 수익률 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1.25rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {Object.entries(etf.returns).map(([period, value]) => (
                  <div key={period} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.375rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {period}
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: value == null ? '#64748b' : value >= 0 ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                      {value == null ? '-' : `${value >= 0 ? '+' : ''}${value}%`}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>운용자산</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{etf.aum}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedEtf(etf); }}
                  style={{ padding: '0.625rem 1.25rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', color: '#c4b5fd', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = '#c4b5fd'; }}
                >
                  상세보기 <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 전체 랭킹 테이블 */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrendingUp size={24} color="#8b5cf6" />
              전체 ETF 성과 랭킹
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                  <th style={tableHeaderStyle}>순위</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>ETF</th>
                  <th style={tableHeaderStyle}>현재가</th>
                  <th style={tableHeaderStyle}>1개월</th>
                  <th style={tableHeaderStyle}>3개월</th>
                  <th style={tableHeaderStyle}>6개월</th>
                  <th style={tableHeaderStyle}>1년</th>
                  <th style={tableHeaderStyle}>테마</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((etf, index) => (
                  <tr
                    key={etf.ticker}
                    onClick={() => setSelectedEtf(etf)}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={tableCellStyle}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: index < 3 ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.05)', fontWeight: '700', fontSize: '0.875rem', margin: '0 auto' }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' }}>{etf.ticker}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{etf.name}</div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                        {etf.country === 'US' ? '$' : '₩'}{etf.price.toLocaleString()}
                      </span>
                    </td>
                    {['1M', '3M', '6M', '1Y'].map(period => (
                      <td key={period} style={tableCellStyle}>
                        {etf.returns[period] == null ? (
                          <span style={{ color: '#64748b' }}>-</span>
                        ) : (
                          <span style={{ color: etf.returns[period] >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
                            {etf.returns[period] >= 0 ? '+' : ''}{etf.returns[period]}%
                          </span>
                        )}
                      </td>
                    ))}
                    <td style={tableCellStyle}>
                      <span style={{ padding: '0.375rem 0.75rem', background: getGradient(etf.theme), borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {etf.theme}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 푸터 */}
        <footer style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', color: '#64748b', fontSize: '0.875rem' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            데이터는 실시간으로 업데이트됩니다 • 투자 결정 시 참고용으로만 활용하세요
          </p>
          <p style={{ margin: 0, color: '#475569' }}>
            © 2026 ETF Performance Hub • Premium Analytics for Smart Investors
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ETF 상세 팝업 모달 */}
      {selectedEtf && (
        <div
          onClick={() => setSelectedEtf(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '2rem',
              width: '100%', maxWidth: '480px',
              position: 'relative',
              animation: 'modalIn 0.25s ease-out',
            }}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedEtf(null)}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8',
              }}
            >
              <X size={16} />
            </button>

            {/* 상단 색상 바 */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: getGradient(selectedEtf.theme, '90deg'),
              borderRadius: '24px 24px 0 0',
            }} />

            {/* 티커 + 뱃지 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                {selectedEtf.ticker}
              </h2>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', color: '#c4b5fd', fontWeight: '600' }}>
                {selectedEtf.country}
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', background: getGradient(selectedEtf.theme), borderRadius: '6px', color: '#fff', fontWeight: '600' }}>
                {selectedEtf.theme}
              </span>
            </div>

            {/* 이름 */}
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: '1.4' }}>
              {selectedEtf.name}
            </p>

            {/* 현재가 + 등락 */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: '700', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {selectedEtf.country === 'US' ? '$' : '₩'}{selectedEtf.price.toLocaleString()}
              </span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.25rem 0.625rem', borderRadius: '6px',
                background: selectedEtf.change >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${selectedEtf.change >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {selectedEtf.change >= 0 ? <ArrowUpRight size={14} color="#22c55e" /> : <ArrowDownRight size={14} color="#ef4444" />}
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: selectedEtf.change >= 0 ? '#22c55e' : '#ef4444' }}>
                  {selectedEtf.change >= 0 ? '+' : ''}{selectedEtf.change}%
                </span>
              </div>
            </div>

            {/* 기간별 수익률 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem', padding: '1.25rem',
              background: 'rgba(0,0,0,0.25)', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem',
            }}>
              {['1M', '3M', '6M', '1Y'].map(period => {
                const val = selectedEtf.returns?.[period];
                return (
                  <div key={period} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.375rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{period}</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: val == null ? '#64748b' : val >= 0 ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                      {val == null ? '-' : `${val >= 0 ? '+' : ''}${val}%`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 리스크 지표 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { icon: <Activity size={15} color="#94a3b8" />, label: '변동성 (연환산)', value: selectedEtf.volatility != null ? `${selectedEtf.volatility}%` : '-', color: '#fff' },
                { icon: <TrendingUp size={15} color="#94a3b8" />, label: '최대 낙폭 (MDD)', value: selectedEtf.maxDrawdown != null ? `${selectedEtf.maxDrawdown}%` : '-', color: '#ef4444' },
                { icon: <Percent size={15} color="#94a3b8" />, label: '배당 수익률', value: selectedEtf.dividendYield != null ? `${selectedEtf.dividendYield}%` : '-', color: '#22c55e' },
                { icon: <BarChart3 size={15} color="#94a3b8" />, label: '총보수 (비용비율)', value: selectedEtf.expenseRatio != null ? `${selectedEtf.expenseRatio}%` : '-', color: '#fff' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{
                  padding: '0.875rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                  display: 'flex', flexDirection: 'column', gap: '0.375rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {icon}
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* AUM */}
            <div style={{
              padding: '0.875rem 1.25rem',
              background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>운용자산 (AUM)</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>{selectedEtf.aum}</span>
            </div>

            {/* 백테스트 이동 버튼 */}
            <a
              href={`/backtest`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '0.9375rem', fontWeight: '700',
                textDecoration: 'none', cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              백테스트에서 비교하기 <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: '1rem',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'center'
};

const tableCellStyle = {
  padding: '1.25rem 1rem',
  fontSize: '0.875rem',
  color: '#fff',
  textAlign: 'center'
};
