"""
일별 ETF 카테고리 분석 블로그 초안을 Gmail로 발송
날짜 기반 자동 카테고리 로테이션 (23개 카테고리 순환)
"""

import json
import os
import smtplib
from datetime import date, datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

KST = timezone(timedelta(hours=9))
DATA_FILE = os.path.join(os.path.dirname(__file__), '../frontend/public/data/etf_database.json')

# 카테고리 순환 순서
CATEGORY_ORDER = [
    '미국_S&P500', '미국_나스닥', '미국_전체시장', '미국_섹터별', '미국_테마',
    '미국_채권', '미국_리츠', '미국_원자재', '미국_국제', '미국_성장가치',
    '미국_레버리지_인버스',
    '한국_주식시장', '한국_반도체/AI', '한국_2차전지', '한국_바이오/헬스케어',
    '한국_채권', '한국_금/원자재', '한국_리츠/배당', '한국_글로벌/선진국',
    '한국_중국/아시아', '한국_인도', '한국_미국테마', '한국_기타',
]

CATEGORY_LABELS = {
    '미국_S&P500': '미국 S&P500 추종 ETF',
    '미국_나스닥': '미국 나스닥100 추종 ETF',
    '미국_전체시장': '미국 전체시장 ETF',
    '미국_섹터별': '미국 섹터별 ETF',
    '미국_테마': '미국 테마 ETF',
    '미국_채권': '미국 채권 ETF',
    '미국_리츠': '미국 리츠(부동산) ETF',
    '미국_원자재': '미국 원자재 ETF',
    '미국_국제': '미국 국제·신흥국 ETF',
    '미국_성장가치': '미국 성장·가치주 ETF',
    '미국_레버리지_인버스': '미국 레버리지·인버스 ETF',
    '한국_주식시장': '한국 주식시장 ETF',
    '한국_반도체/AI': '한국 반도체·AI ETF',
    '한국_2차전지': '한국 2차전지 ETF',
    '한국_바이오/헬스케어': '한국 바이오·헬스케어 ETF',
    '한국_채권': '한국 채권 ETF',
    '한국_금/원자재': '한국 금·원자재 ETF',
    '한국_리츠/배당': '한국 리츠·배당 ETF',
    '한국_글로벌/선진국': '한국 글로벌·선진국 ETF',
    '한국_중국/아시아': '한국 중국·아시아 ETF',
    '한국_인도': '한국 인도 ETF',
    '한국_미국테마': '한국 미국테마 ETF',
    '한국_기타': '한국 기타 ETF',
}

CATEGORY_INTRO = {
    '미국_S&P500': '미국 S&P500 지수를 추종하는 ETF들을 비교합니다. S&P500은 미국 대형주 500개로 구성된 지수로, 미국 주식시장의 대표 벤치마크입니다. SPY·IVV·VOO 등 저비용 대형 ETF들이 여기에 속합니다.',
    '미국_나스닥': '미국 나스닥100 지수를 추종하는 ETF들을 비교합니다. 나스닥100은 기술주 중심의 성장 지수로, Apple·Microsoft·NVIDIA 등 AI·반도체·빅테크 기업이 주를 이룹니다.',
    '미국_전체시장': '미국 전체 주식시장을 커버하는 ETF들을 비교합니다. S&P500보다 더 넓은 중소형주까지 포함하여 미국 시장 전반을 추적합니다.',
    '미국_섹터별': '미국 주요 섹터별 ETF들을 비교합니다. 기술·헬스케어·금융·에너지·소비재 등 섹터별 순환 흐름을 파악하는 데 유용합니다.',
    '미국_테마': '혁신 기술과 미래 산업 테마에 투자하는 ETF들을 비교합니다. AI·클라우드·바이오테크·사이버보안·우주항공 등 성장 테마를 중심으로 분석합니다.',
    '미국_채권': '미국 채권 ETF들을 비교합니다. 단기채·장기채·TIPS·회사채 등 듀레이션과 신용등급별로 금리 환경에 따른 성과를 분석합니다.',
    '미국_리츠': '미국 부동산투자신탁(REITs) ETF들을 비교합니다. 배당 수익과 부동산 시장 동향을 함께 확인할 수 있습니다.',
    '미국_원자재': '금·원유·은·농산물 등 원자재 ETF들을 비교합니다. 인플레이션 헤지와 실물 자산 투자 수단으로 활용됩니다.',
    '미국_국제': '미국 외 글로벌 시장에 투자하는 ETF들을 비교합니다. 선진국·신흥국·지역별 투자를 통한 분산 효과를 확인합니다.',
    '미국_성장가치': '미국 성장주·가치주 스타일별 ETF들을 비교합니다. 시장 사이클에 따른 스타일 로테이션을 파악하는 데 유용합니다.',
    '미국_레버리지_인버스': '레버리지·인버스 ETF들을 비교합니다. 단기 트레이딩에 특화되어 있으며 높은 변동성을 가집니다. 장기 보유에는 적합하지 않습니다.',
    '한국_주식시장': '한국 증시의 대표 지수를 추종하는 ETF들을 비교합니다. KOSPI200·KOSDAQ150 주요 지수 ETF의 성과를 분석합니다.',
    '한국_반도체/AI': '한국 반도체·AI 관련 ETF들을 비교합니다. 삼성전자·SK하이닉스 중심의 반도체 밸류체인과 AI 관련 종목군을 추적합니다.',
    '한국_2차전지': '한국 2차전지·배터리 관련 ETF들을 비교합니다. 전기차 전환 트렌드에 따른 국내 배터리 산업의 성과를 분석합니다.',
    '한국_바이오/헬스케어': '한국 바이오·헬스케어 ETF들을 비교합니다. 제약·바이오테크·의료기기 등 헬스케어 섹터를 커버합니다.',
    '한국_채권': '한국 채권 ETF들을 비교합니다. 국고채·회사채·단기채 등 다양한 만기와 신용등급의 채권 ETF를 분석합니다.',
    '한국_금/원자재': '한국에서 금·원자재에 투자하는 ETF들을 비교합니다. 원화 기반으로 실물 자산에 손쉽게 투자할 수 있습니다.',
    '한국_리츠/배당': '한국 리츠·고배당 ETF들을 비교합니다. 안정적인 배당 수익을 추구하는 투자자에게 적합한 상품들을 분석합니다.',
    '한국_글로벌/선진국': '한국에서 글로벌 선진국에 투자하는 ETF들을 비교합니다. 미국·유럽·일본 등 선진국 지수를 원화로 추적합니다.',
    '한국_중국/아시아': '한국에서 중국·아시아 신흥국에 투자하는 ETF들을 비교합니다. 차이나A주·홍콩·베트남 등 아시아 성장 시장을 추적합니다.',
    '한국_인도': '한국에서 인도 시장에 투자하는 ETF들을 비교합니다. 높은 성장 잠재력의 인도 시장에 원화로 투자할 수 있습니다.',
    '한국_미국테마': '한국에서 미국 테마주에 투자하는 ETF들을 비교합니다. 미국 빅테크·AI·반도체 등 핵심 테마를 국내 상장 ETF로 추적합니다.',
    '한국_기타': '기타 한국 상장 ETF들을 비교합니다. 특수한 전략이나 혼합 자산에 투자하는 ETF들을 분석합니다.',
}


# ─── 유틸리티 ────────────────────────────────────────────────────────────────

def load_data():
    with open(DATA_FILE, encoding='utf-8') as f:
        return json.load(f)


def get_today_category(available_cats):
    """날짜 기반으로 오늘의 카테고리 결정 (결정론적 순환)"""
    valid = [c for c in CATEGORY_ORDER if c in available_cats]
    idx = date.today().toordinal() % len(valid)
    return valid[idx], idx, len(valid)


def fmt_pct(v):
    if v is None:
        return '-'
    sign = '+' if v > 0 else ''
    return f"{sign}{v:.2f}%"


def fmt_price(etf):
    p = etf.get('price', 0) or 0
    cur = etf.get('currency', 'USD')
    if cur == 'KRW':
        return f"₩{p:,.0f}"
    return f"${p:,.2f}"


def ret_color(v):
    if v is None:
        return '#888888'
    return '#d32f2f' if v < 0 else '#388e3c'


def fmt_aum(aum, is_kr):
    if not aum:
        return '-'
    if is_kr:
        return f"{aum/1e12:.1f}조원" if aum >= 1e12 else f"{aum/1e8:.0f}억원"
    return f"${aum/1e9:.1f}B" if aum >= 1e9 else f"${aum/1e6:.0f}M"


# ─── 분석 텍스트 생성 ──────────────────────────────────────────────────────────

def generate_analysis(cat_key, etfs):
    label = CATEGORY_LABELS.get(cat_key, cat_key)
    w1 = [(e, e.get('returns', {}).get('1W')) for e in etfs]
    w1 = [(e, r) for e, r in w1 if r is not None]
    y1 = [(e, e.get('returns', {}).get('1Y')) for e in etfs]
    y1 = [(e, r) for e, r in y1 if r is not None]

    if not w1:
        return f"현재 {label}의 데이터를 집계 중입니다."

    avg_1w = sum(r for _, r in w1) / len(w1)
    best = max(w1, key=lambda x: x[1])
    worst = min(w1, key=lambda x: x[1])
    positive = sum(1 for _, r in w1 if r > 0)
    negative = sum(1 for _, r in w1 if r < 0)

    trend = "상승세" if avg_1w > 0 else "하락세"
    trend_str = fmt_pct(avg_1w)

    lines = []
    lines.append(
        f"이번 주 {label}는 평균 <strong>{trend_str}</strong>를 기록하며 전반적으로 {trend}를 보였습니다. "
        f"총 {len(w1)}개 ETF 중 <strong style='color:#388e3c;'>{positive}개 상승</strong>, "
        f"<strong style='color:#d32f2f;'>{negative}개 하락</strong>했습니다."
    )

    lines.append(
        f"가장 높은 성과를 보인 ETF는 <strong>{best[0]['ticker']}</strong> "
        f"({best[0]['name'][:28]}{'…' if len(best[0]['name']) > 28 else ''})로 "
        f"주간 <strong style='color:#388e3c;'>{fmt_pct(best[1])}</strong>의 수익률을 기록했습니다."
    )

    if worst[1] is not None and worst[1] < 0:
        lines.append(
            f"반면 <strong>{worst[0]['ticker']}</strong>는 "
            f"<strong style='color:#d32f2f;'>{fmt_pct(worst[1])}</strong>로 "
            f"가장 큰 조정을 받았습니다."
        )

    if y1:
        avg_1y = sum(r for _, r in y1) / len(y1)
        if avg_1w > 0 and avg_1y > 0:
            lines.append(
                f"단기(1주)와 장기(1년) 모두 양호한 성과를 보이며, "
                f"연간 평균 수익률은 <strong>{fmt_pct(avg_1y)}</strong>를 기록하고 있습니다."
            )
        elif avg_1w < 0 and avg_1y > 0:
            lines.append(
                f"최근 단기 조정이 있지만, 연간 기준으로는 "
                f"여전히 <strong>{fmt_pct(avg_1y)}</strong>의 성과를 유지하고 있습니다."
            )
        elif avg_1w > 0 and avg_1y < 0:
            lines.append(
                f"최근 반등을 보이고 있으나, 연간 기준으로는 "
                f"아직 <strong style='color:#d32f2f;'>{fmt_pct(avg_1y)}</strong> 수준으로 "
                f"회복 여부를 지켜볼 필요가 있습니다."
            )
        else:
            lines.append(
                f"단기·장기 모두 부진하며, 연간 수익률은 "
                f"<strong style='color:#d32f2f;'>{fmt_pct(avg_1y)}</strong>입니다."
            )

    # 경비율 최저 ETF 안내
    er_etfs = [e for e in etfs if e.get('expenseRatio')]
    if er_etfs:
        cheapest = min(er_etfs, key=lambda e: e['expenseRatio'])
        lines.append(
            f"비용 측면에서는 <strong>{cheapest['ticker']}</strong>이 "
            f"연 {cheapest['expenseRatio']*100:.3f}%의 낮은 총보수로 가장 효율적인 선택입니다."
        )

    return ' '.join(f"<p style='margin:0 0 10px;'>{l}</p>" for l in lines)


# ─── HTML 생성 ────────────────────────────────────────────────────────────────

def td(content, align='right', extra=''):
    return f'<td style="padding:7px 10px;text-align:{align};font-size:13px;{extra}">{content}</td>'


def ret_td(v):
    color = ret_color(v)
    return td(fmt_pct(v), extra=f'font-weight:600;color:{color};')


def build_blog_html(cat_key, cat_data, cycle_idx, cycle_total):
    etfs = cat_data.get('etfs', [])
    label = CATEGORY_LABELS.get(cat_key, cat_key)
    intro = CATEGORY_INTRO.get(cat_key, '')
    is_kr = cat_data.get('country') == 'KR'
    now = datetime.now(KST)
    date_str = now.strftime('%Y년 %m월 %d일')
    cycle_info = f"카테고리 로테이션 {cycle_idx + 1}/{cycle_total}"

    # 수익률 계산
    w1_vals = [e.get('returns', {}).get('1W') for e in etfs if e.get('returns', {}).get('1W') is not None]
    avg_1w = sum(w1_vals) / len(w1_vals) if w1_vals else None
    positive = sum(1 for r in w1_vals if r > 0)
    negative = sum(1 for r in w1_vals if r < 0)

    # 수익률 정렬 (1W 기준 내림차순)
    sorted_etfs = sorted(etfs, key=lambda e: (e.get('returns', {}).get('1W') or -9999), reverse=True)

    # ── 수익률 비교 테이블
    ret_rows = ''
    for etf in sorted_etfs:
        r = etf.get('returns', {})
        w1 = r.get('1W')
        bg = '#fff8f8' if (w1 or 0) < 0 else ('#f0fdf4' if (w1 or 0) > 0 else '#fafafa')
        name = etf['name']
        name_short = name[:30] + '…' if len(name) > 30 else name
        ret_rows += (
            f'<tr style="border-bottom:1px solid #f0f0f0;background:{bg};">'
            + td(f'<strong>{etf["ticker"]}</strong>', align='left', extra='color:#1a1a1a;')
            + td(f'<span style="color:#555;">{name_short}</span>', align='left', extra='font-size:12px;')
            + td(fmt_price(etf), extra='color:#333;')
            + ret_td(w1)
            + ret_td(r.get('1M'))
            + ret_td(r.get('3M'))
            + ret_td(r.get('6M'))
            + ret_td(r.get('1Y'))
            + '</tr>'
        )

    # ── 장기 성과 테이블
    cagr_etfs = [e for e in etfs if e.get('cagr', {}).get('3Y') or e.get('cagr', {}).get('5Y')]
    cagr_section = ''
    if cagr_etfs:
        cagr_rows = ''
        for etf in sorted(cagr_etfs, key=lambda e: e.get('cagr', {}).get('3Y') or -9999, reverse=True):
            c = etf.get('cagr', {})
            vol = etf.get('volatility')
            mdd = etf.get('maxDrawdown')
            name_short = etf['name'][:28] + '…' if len(etf['name']) > 28 else etf['name']
            cagr_rows += (
                f'<tr style="border-bottom:1px solid #f0f0f0;">'
                + td(f'<strong>{etf["ticker"]}</strong>', align='left', extra='color:#1a1a1a;')
                + td(f'<span style="color:#555;">{name_short}</span>', align='left', extra='font-size:12px;')
                + ret_td(c.get('3Y'))
                + ret_td(c.get('5Y'))
                + td(f'{vol:.1f}%' if vol else '-', extra='color:#666;')
                + td(f'<span style="color:#d32f2f;">{mdd:.1f}%</span>' if mdd else '-')
                + '</tr>'
            )
        cagr_section = f"""
<h2 style="font-size:18px;color:#222;margin:32px 0 12px;border-left:4px solid #7c3aed;padding-left:12px;">⏳ 장기 성과 비교 (연평균 복리 수익률)</h2>
<table style="width:100%;border-collapse:collapse;font-family:sans-serif;margin-bottom:6px;">
  <thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">티커</th>
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">이름</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">3Y CAGR</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">5Y CAGR</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">변동성</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">최대낙폭</th>
  </tr></thead>
  <tbody>{cagr_rows}</tbody>
</table>
<p style="font-size:11px;color:#aaa;margin:4px 0 0;">* CAGR: 복리 연평균 수익률 | 변동성: 연환산 표준편차 | 최대낙폭: 최고점 대비 최대 손실</p>"""

    # ── 투자 정보 테이블
    info_rows = ''
    for etf in sorted(etfs, key=lambda e: e.get('expenseRatio') or 999):
        er = etf.get('expenseRatio')
        aum = etf.get('aum')
        dy = etf.get('dividendYield')
        name_short = etf['name'][:28] + '…' if len(etf['name']) > 28 else etf['name']
        info_rows += (
            f'<tr style="border-bottom:1px solid #f0f0f0;">'
            + td(f'<strong>{etf["ticker"]}</strong>', align='left', extra='color:#1a1a1a;')
            + td(f'<span style="color:#555;">{name_short}</span>', align='left', extra='font-size:12px;')
            + td(f'{er*100:.3f}%' if er else '-', extra='color:#333;')
            + td(fmt_aum(aum, is_kr), extra='color:#333;')
            + td(f'<span style="color:#388e3c;">{dy:.2f}%</span>' if dy else '-')
            + '</tr>'
        )

    # ── 분석 텍스트
    analysis_html = generate_analysis(cat_key, etfs)

    # ── 요약 통계
    avg_str = fmt_pct(avg_1w) if avg_1w is not None else '-'
    avg_c = ret_color(avg_1w)

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{label} ETF 분석 ({date_str})</title>
</head>
<body style="margin:0;padding:20px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#222;line-height:1.7;">
<div style="max-width:820px;margin:0 auto;">

<!-- ===== 티스토리 HTML 편집기에 이 부분부터 붙여넣기 ===== -->

<h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 6px;line-height:1.4;">{date_str} {label} ETF 수익률 비교 분석</h1>
<p style="font-size:13px;color:#aaa;margin:0 0 24px;">📊 ETF-Hub 자동 분석 · {cycle_info} · 데이터 기준: {now.strftime('%Y-%m-%d %H:%M')} KST</p>

<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:14px 18px;margin-bottom:28px;border-radius:0 8px 8px 0;">
<p style="margin:0;font-size:14px;color:#1e40af;line-height:1.7;">{intro}</p>
</div>

<h2 style="font-size:18px;color:#222;margin:0 0 14px;border-left:4px solid #0ea5e9;padding-left:12px;">📌 오늘의 요약</h2>
<table style="width:100%;border-collapse:separate;border-spacing:10px;margin-bottom:24px;">
<tr>
  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;width:33%;">
    <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">분석 ETF</div>
    <div style="font-size:24px;font-weight:700;color:#1e293b;">{len(etfs)}개</div>
  </td>
  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;width:33%;">
    <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">평균 수익률 (1주)</div>
    <div style="font-size:24px;font-weight:700;color:{avg_c};">{avg_str}</div>
  </td>
  <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;width:33%;">
    <div style="font-size:11px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">상승 / 하락</div>
    <div style="font-size:22px;font-weight:700;"><span style="color:#388e3c;">{positive}</span> <span style="color:#ccc;">/</span> <span style="color:#d32f2f;">{negative}</span></div>
  </td>
</tr>
</table>

<h2 style="font-size:18px;color:#222;margin:0 0 12px;border-left:4px solid #10b981;padding-left:12px;">📝 주간 분석</h2>
<div style="font-size:15px;color:#374151;margin:0 0 28px;line-height:1.85;">{analysis_html}</div>

<h2 style="font-size:18px;color:#222;margin:0 0 12px;border-left:4px solid #f59e0b;padding-left:12px;">📈 ETF 수익률 비교 <span style="font-size:13px;font-weight:400;color:#aaa;">(주간 수익률 순)</span></h2>
<table style="width:100%;border-collapse:collapse;font-family:sans-serif;margin-bottom:6px;">
  <thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">티커</th>
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">이름</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">현재가</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">1주</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">1개월</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">3개월</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">6개월</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">1년</th>
  </tr></thead>
  <tbody>{ret_rows}</tbody>
</table>
<p style="font-size:11px;color:#aaa;margin:4px 0 0;">* 수익률은 배당 포함 총수익률 기준</p>

{cagr_section}

<h2 style="font-size:18px;color:#222;margin:32px 0 12px;border-left:4px solid #ef4444;padding-left:12px;">💼 ETF 투자 정보</h2>
<table style="width:100%;border-collapse:collapse;font-family:sans-serif;margin-bottom:6px;">
  <thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">티커</th>
    <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666;font-weight:600;">이름</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">총보수(연)</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">순자산(AUM)</th>
    <th style="padding:8px 10px;text-align:right;font-size:12px;color:#666;font-weight:600;">배당수익률</th>
  </tr></thead>
  <tbody>{info_rows}</tbody>
</table>
<p style="font-size:11px;color:#aaa;margin:4px 0 0;">* 총보수: 낮을수록 투자비용 효율적 | AUM: 운용자산 규모 | 배당: 최근 12개월 기준</p>

<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:28px 0 20px;">
<p style="margin:0;font-size:13px;color:#92400e;line-height:1.7;">⚠️ <strong>투자 유의사항</strong>: 이 분석은 정보 제공 목적이며 투자 권유가 아닙니다. 과거 수익률이 미래 성과를 보장하지 않습니다. 투자는 본인의 판단과 책임 하에 이루어져야 합니다.</p>
</div>

<p style="font-size:13px;color:#94a3b8;text-align:center;padding-top:16px;border-top:1px solid #f0f0f0;">
더 자세한 분석 및 차트: <a href="https://etf-hub.vercel.app" style="color:#3b82f6;text-decoration:none;">etf-hub.vercel.app</a>
</p>

<!-- ===== 티스토리 복붙 끝 ===== -->

</div>
</body>
</html>"""
    return html, label


# ─── 이메일 발송 ──────────────────────────────────────────────────────────────

def send_email(html_content, subject, to_addr, from_addr, app_password):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(from_addr, app_password)
        server.sendmail(from_addr, to_addr, msg.as_string())
    print(f"이메일 발송 완료 → {to_addr}")


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    gmail_user = os.environ.get('GMAIL_USER')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
    notify_email = os.environ.get('NOTIFY_EMAIL')

    if not all([gmail_user, gmail_password, notify_email]):
        print("환경 변수 누락: GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL 필요")
        return

    data = load_data()
    cat_key, cycle_idx, cycle_total = get_today_category(data['categories'])
    cat_data = data['categories'].get(cat_key)

    if not cat_data:
        print(f"카테고리 데이터 없음: {cat_key}")
        return

    html, label = build_blog_html(cat_key, cat_data, cycle_idx, cycle_total)
    now = datetime.now(KST)
    subject = f"📊 [{now.strftime('%Y.%m.%d')}] {label} ETF 수익률 비교 분석"

    send_email(html, subject, notify_email, gmail_user, gmail_password)
    print(f"오늘의 카테고리: {label} ({cycle_idx+1}/{cycle_total})")


if __name__ == '__main__':
    main()
