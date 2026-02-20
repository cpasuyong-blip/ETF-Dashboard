"""
KR ETF 카테고리 재편 패치 스크립트
- 한국_해외투자 → 한국_S&P500 (360750, 379800) + 한국_나스닥 (381170, 133490)
- 133690 → 한국_기타로 이동
- 133490 (TIGER 미국나스닥100) 신규 수집
"""

import yfinance as yf
import json
import requests
import time
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

JSON_PATH = 'c:/Users/cpasu/Documents/ETF-Dashboard/frontend/public/data/etf_database.json'


def get_kr_etf_name(code):
    """NAVER 금융 API로 한국 ETF 이름 조회"""
    try:
        url = f"https://finance.naver.com/item/main.naver?code={code}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code == 200:
            import re
            match = re.search(r'<title>([^<]+)</title>', resp.text)
            if match:
                title = match.group(1).split(':')[0].strip()
                return title
    except Exception as e:
        print(f"  Name fetch error: {e}")
    return None


def calculate_returns(history):
    """기간별 수익률 계산"""
    if len(history) < 2:
        return {}
    closes = history['Close']
    current = float(closes.iloc[-1])
    periods = [
        ('1W', relativedelta(weeks=1)),
        ('1M', relativedelta(months=1)),
        ('3M', relativedelta(months=3)),
        ('6M', relativedelta(months=6)),
        ('1Y', relativedelta(years=1)),
    ]
    returns = {}
    for label, delta in periods:
        target_date = closes.index[-1] - delta
        past = closes[closes.index <= target_date]
        if len(past) > 0:
            past_price = float(past.iloc[-1])
            returns[label] = round((current - past_price) / past_price * 100, 2)
    return returns


def collect_kr_etf(code):
    """단일 한국 ETF 데이터 수집"""
    ticker_str = f"{code}.KS"
    try:
        ticker = yf.Ticker(ticker_str)
        history = ticker.history(period="2y")

        if len(history) < 5:
            print(f"  {code} SKIP - 데이터 부족")
            return None

        current_price = float(history['Close'].iloc[-1])
        current_date = history.index[-1].strftime('%Y-%m-%d')
        returns = calculate_returns(history)

        name = get_kr_etf_name(code)
        if not name:
            info = ticker.info
            name = info.get('longName') or info.get('shortName') or code

        print(f"  {code} ({name}) -> {current_price:,.0f} KRW, 1W={returns.get('1W', 'N/A')}%")
        return {
            'ticker': code,
            'name': name,
            'price': current_price,
            'currency': 'KRW',
            'date': current_date,
            'returns': returns,
        }
    except Exception as e:
        print(f"  {code} ERR: {e}")
        return None


def main():
    print("=== KR ETF 카테고리 재편 패치 ===")

    # JSON 로드
    with open(JSON_PATH, encoding='utf-8') as f:
        data = json.load(f)

    cats = data['categories']

    # 1. 133490 수집
    print("\n[1] 133490 (TIGER 미국나스닥100) 데이터 수집...")
    etf_133490 = collect_kr_etf('133490')
    time.sleep(0.5)

    # 2. 한국_해외투자에서 ETF 꺼내기
    print("\n[2] 한국_해외투자 분해...")
    haeoetfs = cats.get('한국_해외투자', {}).get('etfs', [])
    haeo_map = {e['ticker']: e for e in haeoetfs}
    print(f"  현재 해외투자 ETF: {[e['ticker'] for e in haeoetfs]}")

    # S&P500 추종 KR ETFs
    kr_sp500_tickers = ['360750', '379800']
    # 나스닥 추종 KR ETFs
    kr_nasdaq_tickers = ['381170', '133490']
    # 기타로 이동
    kr_other_tickers = ['133690']

    kr_sp500_etfs = [haeo_map[t] for t in kr_sp500_tickers if t in haeo_map]
    kr_nasdaq_etfs = [haeo_map[t] for t in kr_nasdaq_tickers if t in haeo_map]

    # 133490 추가 (haeo_map에 없음)
    if etf_133490:
        kr_nasdaq_etfs.append(etf_133490)
        print(f"  133490 추가 완료")
    else:
        print("  133490 수집 실패 - 더미 데이터 없이 진행")

    # 133690 → 기타
    for t in kr_other_tickers:
        if t in haeo_map:
            cats['한국_기타']['etfs'].append(haeo_map[t])
            print(f"  {t} → 한국_기타 이동")

    # 3. 새 카테고리 생성
    print("\n[3] 새 카테고리 생성...")
    cats['한국_S&P500'] = {
        'country': 'KR',
        'description': '미국 S&P500 지수를 추종하는 한국 상장 ETF',
        'etfs': kr_sp500_etfs,
    }
    cats['한국_나스닥'] = {
        'country': 'KR',
        'description': '미국 나스닥100 지수를 추종하는 한국 상장 ETF',
        'etfs': kr_nasdaq_etfs,
    }
    print(f"  한국_S&P500: {[e['ticker'] for e in kr_sp500_etfs]}")
    print(f"  한국_나스닥: {[e['ticker'] for e in kr_nasdaq_etfs]}")

    # 4. 한국_해외투자 삭제
    del cats['한국_해외투자']
    print("\n[4] 한국_해외투자 카테고리 삭제")

    # 5. 메타데이터 업데이트
    data['metadata']['lastUpdate'] = datetime.now().isoformat()
    total = sum(len(c['etfs']) for c in cats.values())
    data['metadata']['totalETFs'] = total
    print(f"\n[5] 총 ETF 수: {total}")

    # 6. 저장
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n저장 완료: {JSON_PATH}")

    # 최종 카테고리 목록
    print("\n=== 최종 카테고리 ===")
    for k, v in cats.items():
        print(f"  {k}: {len(v['etfs'])}개")


if __name__ == '__main__':
    main()
