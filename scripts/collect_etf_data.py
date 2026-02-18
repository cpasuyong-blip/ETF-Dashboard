"""
ETF 데이터 수집 스크립트
46개 ETF (미국 31개 + 한국 15개)
"""

import yfinance as yf
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import time

# ETF 리스트 정의
US_ETFS = {
    'S&P500': {
        'tickers': ['SPY', 'VOO', 'IVV', 'SPLG'],
        'description': '미국 대형주 500개 기업을 추종하는 ETF'
    },
    '나스닥': {
        'tickers': ['QQQ', 'QQQM', 'QQQE', 'QQQJ', 'ONEQ', 'TQQQ', 'PSQ', 'ARKW'],
        'description': '기술주 중심의 나스닥 지수 추종 ETF'
    },
    '채권': {
        'tickers': ['AGG', 'TLT', 'SHY'],
        'description': '국채, 회사채 등 채권에 투자하는 ETF'
    },
    '기술주': {
        'tickers': ['XLK', 'VGT', 'SOXX', 'SMH', 'ARKK', 'IGV'],
        'description': '기술 섹터 및 반도체 중심 투자 ETF'
    },
    '배당': {
        'tickers': ['VYM', 'SCHD', 'HDV', 'DVY', 'VIG', 'DGRO',
                   'DGRW', 'JEPI', 'JEPQ', 'SPYD', 'NOBL', 'SDY'],
        'description': '고배당 및 배당 성장주에 투자하는 ETF'
    },
    '금/원자재': {
        'tickers': ['GLD', 'SLV', 'USO'],
        'description': '금, 은, 원유 등 원자재에 투자하는 ETF'
    },
    '우주/항공': {
        'tickers': ['ARKX', 'UFO', 'ROKT'],
        'description': '우주 탐사 및 항공우주 산업에 투자하는 ETF'
    }
}

KR_ETFS = {
    'KOSPI': {
        'codes': ['069500', '102110', '278530'],
        'description': '코스피 200 지수를 추종하는 ETF'
    },
    'KOSDAQ': {
        'codes': ['229200', '091180'],
        'description': '코스닥 150 지수를 추종하는 ETF'
    },
    '산업별': {
        'codes': ['091160', '381180', '305540', '371460',
                 '308620', '458730', '091220', '334690',
                 '360750', '133690'],
        'description': '반도체, 2차전지, 배당 등 산업별 테마 ETF'
    }
}

import requests as _requests

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
        history = etf.history(period="10y")
        
        if len(history) == 0:
            print("❌ 데이터 없음")
            return None
        
        current_price = history['Close'].iloc[-1]
        prev_close = history['Close'].iloc[-2] if len(history) > 1 else current_price
        price_change = current_price - prev_close
        price_change_pct = (price_change / prev_close * 100) if prev_close != 0 else 0
        
        # 수익률 계산 (달력 날짜 기준)
        returns, cagr = calculate_returns(history)

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
            'expenseRatio': round(info.get('expenseRatio', 0) * 100, 3) if info.get('expenseRatio') else 0,
            'aum': info.get('totalAssets'),
            'dividendYield': dividend_yield,
            'returns': returns,
            'cagr': cagr,
            'volatility': volatility,
            'maxDrawdown': max_dd,
            'volume': int(history['Volume'].iloc[-1]) if len(history) > 0 else 0,
            'lastUpdate': datetime.now().isoformat()
        }
        
        print("✅")
        return data
        
    except Exception as e:
        print(f"❌ 오류: {str(e)[:50]}")
        return None

def fetch_kr_etf_basic(code):
    """한국 ETF 기본 데이터 (yfinance 사용)"""
    try:
        print(f"  수집 중: {code}...", end=' ')
        
        # 한국 ETF는 .KS 붙여서 조회
        ticker = f"{code}.KS"
        etf = yf.Ticker(ticker)
        history = etf.history(period="10y")
        
        if len(history) == 0:
            print("❌ 데이터 없음")
            return None
        
        info = etf.info
        current_price = history['Close'].iloc[-1]
        prev_close = history['Close'].iloc[-2] if len(history) > 1 else current_price
        price_change = current_price - prev_close
        price_change_pct = (price_change / prev_close * 100) if prev_close != 0 else 0
        
        # 수익률 계산 (달력 날짜 기준)
        returns, cagr = calculate_returns(history)

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
            'dividendYield': dividend_yield,
            'returns': returns,
            'cagr': cagr,
            'volatility': volatility,
            'maxDrawdown': max_dd,
            'volume': int(history['Volume'].iloc[-1]) if len(history) > 0 else 0,
            'lastUpdate': datetime.now().isoformat()
        }
        
        print("✅")
        return data
        
    except Exception as e:
        print(f"❌ 오류: {str(e)[:50]}")
        return None

def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("ETF 데이터 수집 시작")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
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
        print(f"\n📊 카테고리: 미국_{category}")
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
        print(f"\n📊 카테고리: 한국_{category}")
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
    
    # 메타데이터 추가
    database['metadata'] = {
        'lastUpdate': datetime.now().isoformat(),
        'totalETFs': total_success,
        'failedETFs': total_failed,
        'categories': len(database['categories']),
        'version': '1.0'
    }
    
    # JSON 파일로 저장
    output_file = '../frontend/public/data/etf_database.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print("✅ 데이터 수집 완료!")
    print(f"성공: {total_success}개 | 실패: {total_failed}개")
    print(f"저장 위치: {output_file}")
    print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
