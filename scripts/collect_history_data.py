"""
ETF 월별 가격 이력 수집 스크립트
시뮬레이션 페이지에서 사용할 10년치 월말 종가(배당 재투자 포함) 수집
출력: frontend/public/data/etf_history.json
"""

import yfinance as yf
import json
import os
import time
from datetime import datetime

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../frontend/public/data/etf_history.json')

# ── 전체 ETF 목록 ──────────────────────────────────────────────────────────────
US_TICKERS = [
    # S&P500
    'SPY', 'VOO', 'IVV', 'SPYM',
    # 나스닥
    'QQQ', 'QQQM', 'ONEQ', 'TQQQ',
    # 전체시장
    'VTI', 'SCHB', 'ITOT', 'VT', 'DIA', 'RSP',
    # 소형중형
    'IWM', 'IWB', 'IJH', 'IJR', 'VB', 'VO',
    # 기술주
    'XLK', 'VGT', 'SOXX', 'SMH', 'ARKK', 'IGV',
    # 섹터
    'XLF', 'XLV', 'XLE', 'XLI', 'XLP', 'XLY', 'XLU', 'XLB', 'XLC', 'XLRE',
    'IBB', 'ITA', 'KRE', 'XBI', 'XRT', 'XOP', 'XME', 'XHB', 'XSW',
    # 채권
    'AGG', 'TLT', 'SHY', 'BND', 'LQD', 'HYG', 'JNK', 'TIP', 'IEF',
    'SGOV', 'BIL', 'TBIL', 'EMB', 'VCIT', 'VCSH', 'BIV', 'MUB', 'BNDX', 'VMBS', 'FLOT',
    # 배당
    'VYM', 'SCHD', 'HDV', 'DVY', 'VIG', 'DGRO', 'DGRW', 'SPYD', 'NOBL', 'SDY', 'FDVV', 'PFFD',
    # 커버드콜
    'JEPI', 'JEPQ', 'XYLD', 'QYLD', 'RYLD', 'DIVO', 'SPYI',
    # 일드맥스
    'TSLY', 'NVDY', 'AMZY', 'MSFO', 'GOOGY', 'APLY', 'CONY', 'YMAG', 'YMAX',
    # 성장/가치
    'VUG', 'VTV', 'IWF', 'IWD', 'SCHG', 'SCHV', 'QUAL', 'USMV', 'MGK', 'MGV', 'AVUV', 'DFAC',
    # 국제
    'VXUS', 'VEA', 'VWO', 'IEFA', 'IEMG', 'EFA', 'EEM', 'MCHI',
    'EWJ', 'KWEB', 'VGK', 'EWZ', 'EWY', 'EWT', 'EWG', 'EWU', 'EWC', 'EWA', 'INDA', 'EWH', 'VPL', 'EWW',
    # 금/원자재
    'GLD', 'SLV', 'IAU', 'GLDM', 'GDX', 'DBC', 'USO', 'REMX',
    # 리츠
    'VNQ', 'IYR', 'SCHH', 'REET', 'VNQI', 'USRT',
    # 테마
    'ARKW', 'ARKX', 'UFO', 'ROKT', 'CIBR', 'BOTZ', 'ICLN', 'LIT', 'IBIT',
    'ARKF', 'ARKG', 'ARKQ', 'CLOU', 'JETS', 'DRIV', 'WCLD', 'FINX', 'FBTC',
    # 레버리지/인버스
    'PSQ', 'SQQQ', 'SPXL', 'SPXS', 'SSO', 'SDS', 'SOXL', 'SOXS', 'UPRO', 'SH',
]

KR_CODES = [
    # 주식시장
    '069500', '102110', '278530', '229200', '091180', '122630',
    '252670', '232080', '354500', '233740', '291630',
    # 반도체/AI
    '091160', '381180', '411380', '445090',
    # 2차전지
    '305540', '371460', '364980',
    # 채권
    '308620', '114820', '157450', '357870', '385560', '148070',
    # 바이오/헬스케어
    '228800', '143460', '266410',
    # 중국/아시아
    '099140', '192090',
    # 금/원자재
    '132030', '319640',
    # 글로벌/선진국
    '195970', '192720', '195980', '213630',
    # 리츠/배당
    '182480', '292190', '329200',
    # 인도
    '453590', '437080',
    # 미국테마(KR)
    '381170', '449770', '461900',
    # 기타
    '458730', '091220', '334690',
    # 미국S&P500(KR)
    '360750', '379800', '360200', '448290', '449180',
    # 미국나스닥(KR)
    '133690', '379810', '367380',
]
# ──────────────────────────────────────────────────────────────────────────────


def fetch_monthly_history(yf_ticker, display_ticker):
    """yfinance에서 10년치 월말 종가(배당 재투자 포함) 수집"""
    try:
        print(f"  {display_ticker}...", end=' ')
        ticker = yf.Ticker(yf_ticker)
        hist = ticker.history(period='10y', interval='1mo')

        if hist is None or len(hist) == 0:
            print("SKIP")
            return []

        result = []
        for dt, row in hist.iterrows():
            price = row['Close']
            if price is None or price != price:  # NaN check
                continue
            result.append({
                'date': dt.strftime('%Y-%m-%d'),
                'price': round(float(price), 4),
            })

        print(f"OK ({len(result)}개월)")
        return result

    except Exception as e:
        print(f"ERR: {str(e)[:60]}")
        return []


def main():
    print("=" * 60)
    print("ETF 월별 가격 이력 수집 시작")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"대상: 미국 {len(US_TICKERS)}개 + 한국 {len(KR_CODES)}개")
    print("=" * 60)

    history = {}
    success, failed = 0, 0

    # 미국 ETF
    print("\n[미국 ETF]")
    for ticker in US_TICKERS:
        data = fetch_monthly_history(ticker, ticker)
        if data:
            history[ticker] = data
            success += 1
        else:
            history[ticker] = []
            failed += 1
        time.sleep(0.2)

    # 한국 ETF
    print("\n[한국 ETF]")
    for code in KR_CODES:
        data = fetch_monthly_history(f'{code}.KS', code)
        if data:
            history[code] = data
            success += 1
        else:
            history[code] = []
            failed += 1
        time.sleep(0.2)

    # 저장
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"\n{'=' * 60}")
    print(f"완료: 성공 {success}개 / 실패 {failed}개")
    print(f"파일: {OUTPUT_FILE} ({size_kb:.1f} KB)")
    print(f"종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == '__main__':
    main()
