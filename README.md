# ETF Performance Dashboard

46개의 주요 ETF(미국 31개 + 한국 15개)를 추적하는 대시보드 및 블로그 시스템

## 📊 추적 ETF 목록

### 🇺🇸 미국 ETF (31개)

#### S&P 500 추종 (4개)
- SPY, VOO, IVV, SPLG

#### 나스닥 추종 (7개)
- QQQ, QQQM, QQQE, QQQJ, ONEQ, TQQQ, PSQ

#### 채권 (3개)
- AGG, TLT, SHY

#### 기술주 (6개)
- XLK, VGT, SOXX, SMH, ARKK, IGV

#### 배당 (11개)
- VYM, SCHD, HDV, DVY, VIG, DGRO, DGRW, JEPI, JEPQ, SPYD, NOBL, SDY

### 🇰🇷 한국 ETF (15개)

#### KOSPI (3개)
- 069500 (KODEX 200), 102110 (TIGER 200), 278530

#### KOSDAQ (2개)
- 229200 (KODEX 코스닥150), 091180 (TIGER 코스닥150)

#### 산업별 (10개)
- 091160 (KODEX 반도체)
- 381180 (TIGER 반도체)
- 305540 (TIGER 2차전지)
- 371460 (TIGER 2차전지테마)
- 308620 (KODEX 배당성장)
- 458730 (TIGER 배당성장)
- 091220 (TIGER 자동차)
- 334690 (KODEX 헬스케어)
- 360750 (TIGER 미국S&P500)
- 133690 (TIGER 미국나스닥100)

## 🚀 시작하기

### 1. 데이터 수집

```bash
cd scripts
python collect_etf_data.py
```

첫 실행 시 약 20분 소요 (46개 ETF × 0.5초 대기)

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📁 프로젝트 구조

```
etf-dashboard-project/
├── scripts/
│   └── collect_etf_data.py       # 데이터 수집 스크립트
├── data/
│   ├── etf_database.json          # 실제 데이터 (자동 생성)
│   └── etf_database_sample.json   # 샘플 데이터 (테스트용)
├── frontend/
│   ├── components/
│   │   ├── ETFDashboard.jsx       # 메인 대시보드
│   │   └── ETFBacktestChart.jsx   # 백테스트 차트
│   └── pages/
│       └── index.js
├── .github/
│   └── workflows/
│       └── update_data.yml        # 자동 업데이트 (매일)
└── README.md
```

## 🔄 자동 업데이트

GitHub Actions를 통해 매일 자동으로 데이터 업데이트:
- **스케줄**: 월~금 한국시간 오전 7시 (미국장 마감 후)
- **수동 실행**: GitHub > Actions > "Update ETF Data" > Run workflow

## 📊 데이터 구조

```json
{
  "categories": {
    "미국_S&P500": {
      "description": "미국 대형주 500개 기업을 추종하는 ETF",
      "country": "US",
      "etfs": [
        {
          "ticker": "SPY",
          "name": "SPDR S&P 500 ETF Trust",
          "price": 502.34,
          "priceChange": 2.45,
          "priceChangePct": 0.49,
          "returns": {
            "1M": 3.2,
            "3M": 8.5,
            "1Y": 24.5
          },
          "volatility": 12.5,
          "maxDrawdown": -8.3
        }
      ]
    }
  }
}
```

## 🎨 블로그 콘텐츠 아이디어

### 주간 포스트
- "이번 주 수익률 TOP 5 ETF"
- "나스닥 vs S&P 500: 이번 주 승자는?"
- "한국 산업별 ETF 동향"

### 월간 포스트
- "배당 ETF 완전 분석: SCHD vs JEPI vs VYM"
- "나스닥 7종 세트 완전 정복"
- "한미 시장 자금 흐름 리뷰"

### 심층 분석
- "레버리지의 양날의 검: TQQQ 3년 백테스트"
- "동일가중 vs 시가총액가중: QQQE vs QQQ"
- "2차전지 ETF 비교: 어떤 것을 선택할까?"

## 🛠 기술 스택

- **데이터 수집**: Python, yfinance
- **프론트엔드**: Next.js, React, Recharts
- **스타일링**: Tailwind CSS (inline styles)
- **배포**: Vercel / Netlify
- **자동화**: GitHub Actions

## 📝 개발 로드맵

### Phase 1: 핵심 기능 (완료)
- [x] 46개 ETF 데이터 수집
- [x] 대시보드 UI 디자인
- [x] 백테스트 차트 구현

### Phase 2: 블로그 통합 (진행 중)
- [ ] Next.js 프로젝트 설정
- [ ] 블로그 페이지 구현
- [ ] SEO 최적화

### Phase 3: 고급 기능
- [ ] 포트폴리오 시뮬레이터
- [ ] 알림 기능
- [ ] 사용자 맞춤 워치리스트

## 📄 라이선스

MIT License

## 👤 작성자

탑티어 블로거를 위한 프리미엄 ETF 대시보드

---

**마지막 업데이트**: 2025-02-16
