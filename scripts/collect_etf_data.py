"""
ETF 데이터 수집 스크립트
미국 ~155개 + 한국 ~48개 = ~200개 ETF (AUM 기준 선별)
 - 미국: AUM $1B+ 기준
 - 한국: AUM 1000억원+ 기준
"""

import yfinance as yf
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import time

# 총보수 (%) 하드코딩 - yfinance가 이 값을 제공하지 않음
# 출처: 각 운용사 공식 사이트 / ETF.com (2025년 기준)
EXPENSE_RATIOS = {
    # ── 미국 ETF ──────────────────────────────────
    # S&P500
    'SPY': 0.0945, 'VOO': 0.03, 'IVV': 0.03, 'SPLG': 0.02, 'SPYM': 0.03,
    # 나스닥
    'QQQ': 0.20, 'QQQM': 0.15, 'ONEQ': 0.21, 'TQQQ': 0.88,
    # 전체시장
    'VTI': 0.03, 'SCHB': 0.03, 'ITOT': 0.03, 'VT': 0.07,
    'DIA': 0.16, 'RSP': 0.20,
    # 소형/중형
    'IWM': 0.19, 'IWB': 0.15, 'IJH': 0.05, 'IJR': 0.06,
    'VB': 0.05, 'VO': 0.04,
    # 기술주
    'XLK': 0.09, 'VGT': 0.10, 'SOXX': 0.35, 'SMH': 0.35,
    'ARKK': 0.75, 'IGV': 0.41,
    # 섹터
    'XLF': 0.09, 'XLV': 0.09, 'XLE': 0.09, 'XLI': 0.09,
    'XLP': 0.09, 'XLY': 0.09, 'XLU': 0.09, 'XLB': 0.09,
    'XLC': 0.09, 'XLRE': 0.09, 'IBB': 0.44, 'ITA': 0.39, 'KRE': 0.35,
    'XBI': 0.35, 'XRT': 0.35, 'XOP': 0.35, 'XME': 0.35, 'XHB': 0.35, 'XSW': 0.35,
    # 채권
    'AGG': 0.03, 'TLT': 0.15, 'SHY': 0.15, 'BND': 0.03,
    'LQD': 0.14, 'HYG': 0.48, 'JNK': 0.40, 'TIP': 0.19,
    'IEF': 0.15, 'SGOV': 0.09, 'BIL': 0.14, 'EMB': 0.39,
    'VCIT': 0.04, 'VCSH': 0.04, 'MUB': 0.05, 'BNDX': 0.07, 'VMBS': 0.04, 'FLOT': 0.15,
    'BIV': 0.04, 'TBIL': 0.15,
    # 배당
    'VYM': 0.06, 'SCHD': 0.06, 'HDV': 0.08, 'DVY': 0.38,
    'VIG': 0.06, 'DGRO': 0.08, 'DGRW': 0.28,
    'JEPI': 0.35, 'JEPQ': 0.35, 'SPYD': 0.07, 'NOBL': 0.35, 'SDY': 0.35,
    'XYLD': 0.60, 'QYLD': 0.60,
    'FDVV': 0.29, 'PFFD': 0.23,
    # 커버드콜 추가
    'DIVO': 0.55, 'SPYI': 0.68, 'RYLD': 0.60,
    # 일드맥스 (YieldMax)
    'TSLY': 0.99, 'NVDY': 0.99, 'AMZY': 0.99, 'MSFO': 0.99,
    'GOOGY': 0.99, 'APLY': 0.99, 'CONY': 0.99, 'YMAG': 0.29, 'YMAX': 0.29,
    # 성장/가치
    'VUG': 0.04, 'VTV': 0.04, 'IWF': 0.19, 'IWD': 0.19,
    'SCHG': 0.04, 'SCHV': 0.04, 'QUAL': 0.15, 'USMV': 0.15,
    'MGK': 0.07, 'MGV': 0.07, 'AVUV': 0.25, 'DFAC': 0.18,
    # 국제
    'VXUS': 0.07, 'VEA': 0.05, 'VWO': 0.08, 'IEFA': 0.07,
    'IEMG': 0.09, 'EFA': 0.32, 'EEM': 0.68, 'MCHI': 0.59,
    'EWJ': 0.50, 'KWEB': 0.67, 'VGK': 0.09, 'EWZ': 0.57,
    'EWY': 0.50, 'EWT': 0.57, 'EWG': 0.50, 'EWU': 0.50,
    'EWC': 0.50, 'EWA': 0.50, 'INDA': 0.65, 'EWH': 0.50,
    'VPL': 0.08, 'EWW': 0.50,
    # 금/원자재
    'GLD': 0.40, 'SLV': 0.50, 'IAU': 0.25, 'GLDM': 0.10,
    'GDX': 0.51, 'DBC': 0.85, 'USO': 0.79, 'REMX': 0.59,
    # 리츠
    'VNQ': 0.12, 'IYR': 0.39, 'SCHH': 0.07,
    'REET': 0.14, 'VNQI': 0.12, 'USRT': 0.08,
    # 테마
    'ARKW': 0.75, 'ARKX': 0.75, 'UFO': 0.75, 'ROKT': 0.75,
    'CIBR': 0.40, 'BOTZ': 0.68, 'ICLN': 0.40, 'LIT': 0.75, 'IBIT': 0.25,
    'ARKF': 0.75, 'ARKG': 0.75, 'ARKQ': 0.75,
    'CLOU': 0.68, 'JETS': 0.60, 'DRIV': 0.68,
    'WCLD': 0.45, 'FINX': 0.68, 'FBTC': 0.25,
    # 레버리지/인버스
    'PSQ': 0.95, 'SQQQ': 0.95, 'SPXL': 0.95, 'SPXS': 0.95,
    'SSO': 0.89, 'SDS': 0.89, 'SOXL': 0.95, 'SOXS': 1.01,
    'UPRO': 0.92, 'SH': 0.89,
    # ── 한국 ETF (연보수, %) ──────────────────────
    # 주식시장
    '069500': 0.15, '102110': 0.05, '278530': 0.05,
    '229200': 0.15, '091180': 0.25, '122630': 0.67, '252670': 0.64, '232080': 0.19, '354500': 0.09,
    '233740': 0.64, '291630': 0.64,
    # 반도체/AI
    '091160': 0.45, '381180': 0.49, '411380': 0.45, '445090': 0.45,
    # 2차전지
    '305540': 0.40, '371460': 0.49, '364980': 0.40,
    # 채권
    '308620': 0.30, '114820': 0.15, '157450': 0.05,
    '357870': 0.05, '385560': 0.30, '148070': 0.15,
    # S&P500 (KR) - TIGER·KODEX·ACE + 환헷지(H) 버전
    '360750': 0.07, '379800': 0.07, '360200': 0.07,
    '448290': 0.07, '449180': 0.07,
    # 나스닥100 (KR) - TIGER·KODEX·ACE
    '133690': 0.07, '379810': 0.07, '367380': 0.07,
    # 바이오/헬스케어
    '228800': 0.45, '143460': 0.40, '266410': 0.45,
    # 중국/아시아
    '099140': 0.69, '192090': 0.64,
    # 금/원자재
    '132030': 0.68, '319640': 0.50,
    # 글로벌/선진국
    '195970': 0.30, '192720': 0.30,
    # 리츠/배당
    '182480': 0.29, '292190': 0.12, '329200': 0.29,
    # 인도
    '453590': 0.49, '437080': 0.49,
    # 미국테마 (KR)
    '381170': 0.49, '449770': 0.49, '461900': 0.49,
    # 글로벌/선진국 (PLUS=구ARIRANG)
    '195980': 0.30, '213630': 0.30,
    # 기타
    '458730': 0.09, '091220': 0.50, '334690': 0.50,
}

# 미국 ETF 리스트 정의 (AUM $1B+ 기준)
US_ETFS = {
    'S&P500': {
        'tickers': ['SPY', 'VOO', 'IVV', 'SPLG', 'SPYM'],
        'description': '미국 대형주 500개 기업을 추종하는 ETF'
    },
    '나스닥': {
        'tickers': ['QQQ', 'QQQM', 'ONEQ', 'TQQQ'],
        'description': '기술주 중심의 나스닥 지수 추종 ETF'
    },
    '전체시장': {
        'tickers': ['VTI', 'SCHB', 'ITOT', 'VT', 'DIA', 'RSP'],
        'description': '미국 전체 시장 및 글로벌 시장 추종 ETF'
    },
    '소형중형': {
        'tickers': ['IWM', 'IWB', 'IJH', 'IJR', 'VB', 'VO'],
        'description': '미국 소형주 및 중형주 ETF'
    },
    '기술주': {
        'tickers': ['XLK', 'VGT', 'SOXX', 'SMH', 'ARKK', 'IGV'],
        'description': '기술 섹터 및 반도체 중심 투자 ETF'
    },
    '섹터': {
        'tickers': ['XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLY', 'XLU', 'XLB', 'XLC', 'XLRE',
                    'IBB', 'ITA', 'KRE', 'XBI', 'XRT', 'XOP', 'XME', 'XHB', 'XSW'],
        'description': '금융, 헬스케어, 에너지, 바이오, 리테일 등 산업 섹터 ETF'
    },
    '채권': {
        'tickers': ['AGG', 'TLT', 'SHY', 'BND', 'LQD', 'HYG', 'JNK', 'TIP', 'IEF',
                    'SGOV', 'BIL', 'TBIL', 'EMB', 'VCIT', 'VCSH', 'BIV', 'MUB', 'BNDX', 'VMBS', 'FLOT'],
        'description': '국채, 회사채, 지방채, 국제채권 등 채권에 투자하는 ETF'
    },
    '배당': {
        'tickers': ['VYM', 'SCHD', 'HDV', 'DVY', 'VIG', 'DGRO', 'DGRW', 'SPYD', 'NOBL', 'SDY',
                    'FDVV', 'PFFD'],
        'description': '고배당 및 배당 성장주에 투자하는 ETF'
    },
    '커버드콜': {
        'tickers': ['JEPI', 'JEPQ', 'XYLD', 'QYLD', 'RYLD', 'DIVO', 'SPYI'],
        'description': 'S&P500, 나스닥100, 러셀2000 커버드콜 전략 ETF (옵션 프리미엄 수익)'
    },
    '일드맥스': {
        'tickers': ['TSLY', 'NVDY', 'AMZY', 'MSFO', 'GOOGY', 'APLY', 'CONY', 'YMAG', 'YMAX'],
        'description': 'YieldMax 개별 종목 커버드콜 ETF (초고배당 월분배, 단기 투자용)'
    },
    '성장/가치': {
        'tickers': ['VUG', 'VTV', 'IWF', 'IWD', 'SCHG', 'SCHV', 'QUAL', 'USMV',
                    'MGK', 'MGV', 'AVUV', 'DFAC'],
        'description': '성장주와 가치주, 팩터·소형가치 투자 ETF'
    },
    '국제': {
        'tickers': ['VXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM', 'MCHI',
                    'EWJ', 'KWEB', 'VGK', 'EWZ',
                    'EWY', 'EWT', 'EWG', 'EWU', 'EWC', 'EWA', 'INDA', 'EWH', 'VPL', 'EWW'],
        'description': '미국 외 선진국·신흥국·국가별 시장 ETF'
    },
    '금/원자재': {
        'tickers': ['GLD', 'SLV', 'IAU', 'GLDM', 'GDX', 'DBC', 'USO', 'REMX'],
        'description': '금, 은, 원유, 희토류 등 원자재에 투자하는 ETF'
    },
    '리츠': {
        'tickers': ['VNQ', 'IYR', 'SCHH', 'REET', 'VNQI', 'USRT'],
        'description': '미국·글로벌 부동산 투자신탁(REIT) ETF'
    },
    '테마': {
        'tickers': ['ARKW', 'ARKX', 'UFO', 'ROKT', 'CIBR', 'BOTZ', 'ICLN', 'LIT', 'IBIT',
                    'ARKF', 'ARKG', 'ARKQ', 'CLOU', 'JETS', 'DRIV', 'WCLD', 'FINX', 'FBTC'],
        'description': '사이버보안, AI, 클라우드, EV, 항공, 핀테크, 비트코인 등 테마 ETF'
    },
    '레버리지/인버스': {
        'tickers': ['PSQ', 'SQQQ', 'SPXL', 'SPXS', 'SSO', 'SDS', 'SOXL', 'SOXS', 'UPRO', 'SH'],
        'description': '레버리지 및 인버스 전략 ETF (단기 투자용)'
    },
}

# 한국 ETF 리스트 정의 (AUM 1000억원+ 기준)
KR_ETFS = {
    '주식시장': {
        'codes': ['069500', '102110', '278530', '229200', '091180', '122630',
                  '252670', '232080', '354500', '233740', '291630'],
        'description': 'KOSPI200, 코스닥150 추종 및 레버리지/인버스 ETF'
    },
    '반도체/AI': {
        'codes': ['091160', '381180', '411380', '445090'],
        'description': '반도체 및 AI 관련 산업에 투자하는 ETF'
    },
    '2차전지': {
        'codes': ['305540', '371460', '364980'],
        'description': '2차전지 및 배터리 산업에 투자하는 ETF'
    },
    '채권': {
        'codes': ['308620', '114820', '157450', '357870', '385560', '148070'],
        'description': '국내외 채권 및 단기 금리 ETF'
    },
    '바이오/헬스케어': {
        'codes': ['228800', '143460', '266410'],
        'description': '바이오·헬스케어·의약품 산업에 투자하는 ETF'
    },
    '중국/아시아': {
        'codes': ['099140', '192090'],
        'description': '중국 H주, CSI300 등 아시아 시장에 투자하는 ETF'
    },
    '금/원자재': {
        'codes': ['132030', '319640'],
        'description': '금, 은 선물 등 원자재에 투자하는 국내 ETF'
    },
    '글로벌/선진국': {
        'codes': ['195970', '192720', '195980', '213630'],
        'description': '선진국 MSCI, 다우존스 등 글로벌 지수 추종 ETF (ARIRANG→PLUS 포함)'
    },
    '리츠/배당': {
        'codes': ['182480', '292190', '329200'],
        'description': '국내 부동산 인프라, 배당가치 ETF'
    },
    '인도': {
        'codes': ['453590', '437080'],
        'description': '인도 Nifty50 지수 추종 ETF'
    },
    '미국테마': {
        'codes': ['381170', '449770', '461900'],
        'description': '미국 빅테크·AI·테크TOP10 테마를 추종하는 국내 상장 ETF'
    },
    '기타': {
        'codes': ['458730', '091220', '334690'],
        'description': '원유, 기타 테마 ETF'
    },
}

# 주요 지수 정의 (Yahoo Finance 티커)
INDICES = {
    'sp500':  {'ticker': '^GSPC', 'label': 'S&P 500',    'currency': 'USD'},
    'nasdaq': {'ticker': '^NDX',  'label': 'Nasdaq 100',  'currency': 'USD'},
    'kospi':  {'ticker': '^KS11', 'label': 'KOSPI',       'currency': 'KRW'},
    'kosdaq': {'ticker': '^KQ11', 'label': 'KOSDAQ',      'currency': 'KRW'},
}

import requests as _requests

def fetch_index(idx_id, info):
    """주요 지수 현재값 및 기간별(1W/1M/3M) 변동 수집"""
    try:
        print(f"  지수 수집: {info['ticker']}...", end=' ')
        idx = yf.Ticker(info['ticker'])
        history = idx.history(period="6mo")  # 3M 계산을 위해 6개월 필요

        if len(history) < 6:
            print("SKIP 데이터 부족")
            return None

        is_kr = info['currency'] == 'KRW'
        current = history['Close'].iloc[-1]
        current_date = str(history.index[-1].date())

        # 기간별 비교: (키, 거래일 수)
        period_map = [('1W', 5), ('1M', 21), ('3M', 63)]
        periods = {}
        for pk, n_days in period_map:
            prev_idx = max(0, len(history) - n_days - 1)
            prev = history['Close'].iloc[prev_idx]
            prev_date = str(history.index[prev_idx].date())
            chg_pts = current - prev
            chg_pct = (chg_pts / prev) * 100
            periods[pk] = {
                'prevValue': round(prev, 0 if is_kr else 2),
                'prevDate': prev_date,
                'changePoints': round(chg_pts, 0 if is_kr else 2),
                'changePct': round(chg_pct, 2),
            }

        print("OK")
        return {
            'id': idx_id,
            'label': info['label'],
            'currency': info['currency'],
            'currentValue': round(current, 0 if is_kr else 2),
            'currentDate': current_date,
            'periods': periods,
        }
    except Exception as e:
        print(f"ERR: {str(e)[:50]}")
        return None


def fetch_kr_etf_name(code):
    """NAVER 금융 API에서 한국 ETF 공식 한글 이름 조회"""
    try:
        r = _requests.get(
            f'https://m.stock.naver.com/api/stock/{code}/basic',
            timeout=5
        )
        data = r.json()
        name = data.get('stockName')
        if name:
            return name
    except Exception:
        pass
    return None

def calculate_returns(history):
    """달력 날짜 기준 수익률 계산 (Yahoo Finance 방식)"""
    if history is None or len(history) == 0:
        return {}, {}

    current_price = history['Close'].iloc[-1]
    last_date = history.index[-1]
    returns = {}
    cagr = {}

    # 기간 정의: (이름, relativedelta 오프셋, 연수)
    period_defs = [
        ('1W', relativedelta(weeks=1), 1/52),
        ('1M', relativedelta(months=1), 1/12),
        ('3M', relativedelta(months=3), 3/12),
        ('6M', relativedelta(months=6), 6/12),
        ('1Y', relativedelta(years=1), 1),
        ('3Y', relativedelta(years=3), 3),
        ('5Y', relativedelta(years=5), 5),
    ]

    for name, delta, years in period_defs:
        target_date = last_date - delta
        # target_date 이전 마지막 거래일 찾기 (Yahoo Finance 방식)
        mask = history.index <= target_date
        if mask.any():
            start_price = history['Close'].loc[mask].iloc[-1]
            cumulative = ((current_price / start_price) - 1) * 100
            returns[name] = round(cumulative, 2)
            # 3Y, 5Y는 CAGR도 계산
            if years >= 3:
                cagr_val = ((current_price / start_price) ** (1 / years) - 1) * 100
                cagr[name] = round(cagr_val, 2)
        else:
            returns[name] = None

    return returns, cagr

def calculate_dividend_yield(etf_obj, current_price):
    """TTM(최근 12개월) 배당수익률 직접 계산"""
    try:
        divs = etf_obj.dividends
        if len(divs) == 0 or current_price <= 0:
            return 0
        one_year_ago = datetime.now() - timedelta(days=365)
        recent = divs[divs.index >= str(one_year_ago.date())]
        if len(recent) == 0:
            return 0
        ttm_div = recent.sum()
        return round((ttm_div / current_price) * 100, 2)
    except Exception:
        return 0

def calculate_volatility(history):
    """변동성 계산 (연환산)"""
    if history is None or len(history) < 20:
        return None

    returns = history['Close'].pct_change().dropna()
    volatility = returns.std() * (252 ** 0.5) * 100
    return round(volatility, 2)

def calculate_max_drawdown(history):
    """최대 낙폭 계산"""
    if history is None or len(history) < 20:
        return None

    cumulative = (1 + history['Close'].pct_change()).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative - running_max) / running_max * 100
    return round(drawdown.min(), 2)

def fetch_us_etf(ticker):
    """미국 ETF 데이터 수집"""
    try:
        print(f"  수집 중: {ticker}...", end=' ')

        etf = yf.Ticker(ticker)
        info = etf.info
        history = etf.history(period="10y")              # adj close (TR, 배당 재투자)
        history_raw = etf.history(period="10y", auto_adjust=False)  # raw close (순수 주가)

        if len(history) == 0:
            print("SKIP 데이터 없음")
            return None

        current_price = history['Close'].iloc[-1]
        prev_close = history['Close'].iloc[-2] if len(history) > 1 else current_price
        price_change = current_price - prev_close
        price_change_pct = (price_change / prev_close * 100) if prev_close != 0 else 0

        # 수익률 계산 (달력 날짜 기준)
        returns, cagr = calculate_returns(history)
        price_returns, _ = calculate_returns(history_raw)  # 순수 주가 수익률

        # 리스크 지표
        volatility = calculate_volatility(history)
        max_dd = calculate_max_drawdown(history)

        # 배당 수익률 (TTM 직접 계산)
        dividend_yield = calculate_dividend_yield(etf, current_price)

        data = {
            'ticker': ticker,
            'name': info.get('longName', ticker),
            'price': round(current_price, 2),
            'priceChange': round(price_change, 2),
            'priceChangePct': round(price_change_pct, 2),
            'currency': 'USD',
            'expenseRatio': EXPENSE_RATIOS.get(ticker),
            'aum': info.get('totalAssets'),
            'dividendYield': dividend_yield,
            'returns': returns,
            'priceReturns': price_returns,
            'cagr': cagr,
            'volatility': volatility,
            'maxDrawdown': max_dd,
            'volume': int(history['Volume'].iloc[-1]) if len(history) > 0 else 0,
            'lastUpdate': datetime.now().isoformat()
        }

        print("OK")
        return data

    except Exception as e:
        print(f"ERR: {str(e)[:50]}")
        return None

def fetch_kr_etf_basic(code):
    """한국 ETF 기본 데이터 (yfinance 사용)"""
    try:
        print(f"  수집 중: {code}...", end=' ')

        # 한국 ETF는 .KS 붙여서 조회
        ticker = f"{code}.KS"
        etf = yf.Ticker(ticker)
        history = etf.history(period="10y")              # adj close (TR, 배당 재투자)
        history_raw = etf.history(period="10y", auto_adjust=False)  # raw close (순수 주가)

        if len(history) == 0:
            print("SKIP 데이터 없음")
            return None

        info = etf.info
        current_price = history['Close'].iloc[-1]
        prev_close = history['Close'].iloc[-2] if len(history) > 1 else current_price
        price_change = current_price - prev_close
        price_change_pct = (price_change / prev_close * 100) if prev_close != 0 else 0

        # 수익률 계산 (달력 날짜 기준)
        returns, cagr = calculate_returns(history)
        price_returns, _ = calculate_returns(history_raw)  # 순수 주가 수익률

        # 리스크 지표
        volatility = calculate_volatility(history)
        max_dd = calculate_max_drawdown(history)

        # NAVER 금융에서 공식 한글 이름 조회 (KRX 교차검증)
        kr_name = fetch_kr_etf_name(code) or info.get('longName', f'ETF_{code}')

        # 배당 수익률 (TTM 직접 계산)
        dividend_yield = calculate_dividend_yield(etf, current_price)

        data = {
            'ticker': code,
            'name': kr_name,
            'price': round(current_price, 0),
            'priceChange': round(price_change, 0),
            'priceChangePct': round(price_change_pct, 2),
            'currency': 'KRW',
            'expenseRatio': EXPENSE_RATIOS.get(code),
            'dividendYield': dividend_yield,
            'returns': returns,
            'priceReturns': price_returns,
            'cagr': cagr,
            'volatility': volatility,
            'maxDrawdown': max_dd,
            'volume': int(history['Volume'].iloc[-1]) if len(history) > 0 else 0,
            'lastUpdate': datetime.now().isoformat()
        }

        print("OK")
        return data

    except Exception as e:
        print(f"ERR: {str(e)[:50]}")
        return None

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("ETF 데이터 수집 시작")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    us_total = sum(len(v['tickers']) for v in US_ETFS.values())
    kr_total = sum(len(v['codes']) for v in KR_ETFS.values())
    print(f"대상: 미국 {us_total}개 + 한국 {kr_total}개 = 총 {us_total + kr_total}개 (+ KR지수추종 5개)")
    print("=" * 60)

    database = {
        'categories': {},
        'metadata': {}
    }

    total_success = 0
    total_failed = 0

    # 미국 ETF 수집
    print("\n[미국 ETF 수집]")
    for category, info in US_ETFS.items():
        print(f"\n[카테고리: 미국_{category}]")
        etfs_data = []

        for ticker in info['tickers']:
            data = fetch_us_etf(ticker)
            if data:
                etfs_data.append(data)
                total_success += 1
            else:
                total_failed += 1
            time.sleep(0.3)  # API 제한 방지

        database['categories'][f'미국_{category}'] = {
            'description': info['description'],
            'country': 'US',
            'etfs': etfs_data
        }

    # 한국 ETF 수집
    print("\n[한국 ETF 수집]")
    for category, info in KR_ETFS.items():
        print(f"\n[카테고리: 한국_{category}]")
        etfs_data = []

        for code in info['codes']:
            data = fetch_kr_etf_basic(code)
            if data:
                etfs_data.append(data)
                total_success += 1
            else:
                total_failed += 1
            time.sleep(0.3)

        database['categories'][f'한국_{category}'] = {
            'description': info['description'],
            'country': 'KR',
            'etfs': etfs_data
        }

    # 한국 상장 S&P500/나스닥 추종 ETF → 별도 한국 카테고리로 분리
    # 360750=TIGER 미국S&P500, 379800=KODEX 미국S&P500, 360200=ACE 미국S&P500
    # 448290=TIGER 미국S&P500(H), 449180=KODEX 미국S&P500(H)
    print("\n[KR 지수 추종 ETF → 한국 별도 카테고리]")
    kr_sp500_etfs = []
    for code in ['360750', '379800', '360200', '448290', '449180']:
        print(f"  한국_미국S&P500: {code}")
        data = fetch_kr_etf_basic(code)
        if data:
            kr_sp500_etfs.append(data)
            total_success += 1
        else:
            total_failed += 1
        time.sleep(0.3)
    database['categories']['한국_미국S&P500'] = {
        'description': '한국 거래소에 상장된 미국 S&P500 지수 추종 ETF (TIGER·KODEX·ACE 등)',
        'country': 'KR',
        'etfs': kr_sp500_etfs
    }

    # 133690=TIGER 미국나스닥100, 379810=KODEX 미국나스닥100, 367380=ACE 미국나스닥100
    kr_nasdaq_etfs = []
    for code in ['133690', '379810', '367380']:
        print(f"  한국_미국나스닥: {code}")
        data = fetch_kr_etf_basic(code)
        if data:
            kr_nasdaq_etfs.append(data)
            total_success += 1
        else:
            total_failed += 1
        time.sleep(0.3)
    database['categories']['한국_미국나스닥'] = {
        'description': '한국 거래소에 상장된 미국 나스닥100 지수 추종 ETF (TIGER·KODEX·ACE 등)',
        'country': 'KR',
        'etfs': kr_nasdaq_etfs
    }

    # 주요 지수 수집
    print("\n[주요 지수 수집]")
    indices_data = {}
    for idx_id, info in INDICES.items():
        data = fetch_index(idx_id, info)
        if data:
            indices_data[idx_id] = data
        time.sleep(0.3)
    database['indices'] = indices_data

    # 메타데이터 추가
    database['metadata'] = {
        'lastUpdate': datetime.now().isoformat(),
        'totalETFs': total_success,
        'failedETFs': total_failed,
        'categories': len(database['categories']),
        'version': '2.0'
    }

    # JSON 파일로 저장
    output_file = '../frontend/public/data/etf_database.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("데이터 수집 완료!")
    print(f"성공: {total_success}개 | 실패: {total_failed}개")
    print(f"저장 위치: {output_file}")
    print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
