"""
주간 ETF 분석 리포트를 Gmail로 발송하는 스크립트
GitHub Actions에서 매주 월요일 한국시간 오전 8시에 실행
"""

import json
import os
import smtplib
from datetime import datetime, timezone, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

KST = timezone(timedelta(hours=9))
DATA_FILE = os.path.join(os.path.dirname(__file__), '../frontend/public/data/etf_database.json')


def load_data():
    with open(DATA_FILE, encoding='utf-8') as f:
        return json.load(f)


def flatten_etfs(data):
    """모든 카테고리의 ETF를 하나의 리스트로 반환"""
    etfs = []
    for cat_key, cat in data['categories'].items():
        for etf in cat.get('etfs', []):
            etfs.append({**etf, 'category': cat_key, 'country': cat.get('country', '')})
    return etfs


def fmt_pct(v):
    if v is None:
        return 'N/A'
    sign = '+' if v > 0 else ''
    return f"{sign}{v:.2f}%"


def color(v):
    if v is None:
        return '#888'
    return '#ef4444' if v < 0 else '#22c55e'


def etf_row(etf, period='1W'):
    ret = etf.get('returns', {}).get(period)
    ticker = etf['ticker']
    name = etf['name'][:30] + ('…' if len(etf['name']) > 30 else '')
    price = etf.get('price', 0)
    currency = etf.get('currency', 'USD')
    price_str = f"{'₩' if currency == 'KRW' else '$'}{price:,.0f}" if currency == 'KRW' else f"${price:,.2f}"
    ret_str = fmt_pct(ret)
    c = color(ret)
    return f"""
    <tr style="border-bottom:1px solid #2a2a2a;">
      <td style="padding:8px 12px;font-weight:600;color:#e2e8f0;">{ticker}</td>
      <td style="padding:8px 12px;color:#94a3b8;font-size:13px;">{name}</td>
      <td style="padding:8px 12px;text-align:right;color:#e2e8f0;">{price_str}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:700;color:{c};">{ret_str}</td>
    </tr>"""


def build_table(title, etf_list, period='1W', emoji=''):
    rows = ''.join(etf_row(e, period) for e in etf_list)
    return f"""
  <div style="margin-bottom:32px;">
    <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 12px;border-left:3px solid #3b82f6;padding-left:10px;">
      {emoji} {title}
    </h2>
    <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#2a2a2a;">
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px;">티커</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px;">이름</th>
          <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px;">현재가</th>
          <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px;">수익률({period})</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>"""


def category_label(cat_key):
    labels = {
        '미국_S&P500': '미국 S&P500', '미국_나스닥': '미국 나스닥', '미국_전체시장': '미국 전체시장',
        '미국_섹터별': '미국 섹터', '미국_테마': '미국 테마', '미국_채권': '미국 채권',
        '미국_리츠': '미국 리츠', '미국_원자재': '미국 원자재', '미국_국제': '미국 국제',
        '미국_성장가치': '미국 성장/가치', '미국_레버리지_인버스': '미국 레버리지/인버스',
        '한국_주식시장': '한국 주식시장', '한국_반도체/AI': '한국 반도체/AI',
        '한국_2차전지': '한국 2차전지', '한국_바이오/헬스케어': '한국 바이오/헬스케어',
        '한국_채권': '한국 채권', '한국_금/원자재': '한국 금/원자재',
        '한국_리츠/배당': '한국 리츠/배당', '한국_글로벌/선진국': '한국 글로벌/선진국',
        '한국_중국/아시아': '한국 중국/아시아', '한국_인도': '한국 인도',
        '한국_미국테마': '한국 미국테마', '한국_기타': '한국 기타',
    }
    return labels.get(cat_key, cat_key)


def build_category_summary(data):
    """카테고리별 평균 수익률 요약"""
    rows = []
    for cat_key, cat in data['categories'].items():
        etfs = cat.get('etfs', [])
        rets = [e.get('returns', {}).get('1W') for e in etfs if e.get('returns', {}).get('1W') is not None]
        if not rets:
            continue
        avg = sum(rets) / len(rets)
        label = category_label(cat_key)
        c = color(avg)
        rows.append((avg, label, len(etfs), c))

    rows.sort(key=lambda x: x[0], reverse=True)
    tr_html = ''
    for avg, label, count, c in rows:
        tr_html += f"""
        <tr style="border-bottom:1px solid #2a2a2a;">
          <td style="padding:7px 12px;color:#e2e8f0;font-size:13px;">{label}</td>
          <td style="padding:7px 12px;text-align:center;color:#94a3b8;font-size:13px;">{count}개</td>
          <td style="padding:7px 12px;text-align:right;font-weight:700;color:{c};font-size:13px;">{fmt_pct(avg)}</td>
        </tr>"""

    return f"""
  <div style="margin-bottom:32px;">
    <h2 style="color:#e2e8f0;font-size:16px;margin:0 0 12px;border-left:3px solid #8b5cf6;padding-left:10px;">
      📊 카테고리별 주간 평균 수익률
    </h2>
    <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#2a2a2a;">
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:12px;">카테고리</th>
          <th style="padding:8px 12px;text-align:center;color:#64748b;font-size:12px;">ETF 수</th>
          <th style="padding:8px 12px;text-align:right;color:#64748b;font-size:12px;">평균 수익률(1W)</th>
        </tr>
      </thead>
      <tbody>{tr_html}</tbody>
    </table>
  </div>"""


def build_html(data):
    etfs = flatten_etfs(data)
    now = datetime.now(KST)
    date_str = now.strftime('%Y년 %m월 %d일')
    total = len(etfs)

    # 주간 수익률 기준 정렬
    with_ret = [e for e in etfs if e.get('returns', {}).get('1W') is not None]
    sorted_asc = sorted(with_ret, key=lambda e: e['returns']['1W'])
    sorted_desc = sorted(with_ret, key=lambda e: e['returns']['1W'], reverse=True)

    top10 = sorted_desc[:10]
    bottom10 = sorted_asc[:10]

    # 1개월 수익률 TOP 10
    with_1m = [e for e in etfs if e.get('returns', {}).get('1M') is not None]
    top10_1m = sorted(with_1m, key=lambda e: e['returns']['1M'], reverse=True)[:10]

    # 전체 평균 수익률
    all_rets = [e['returns']['1W'] for e in with_ret]
    avg_all = sum(all_rets) / len(all_rets) if all_rets else 0
    positive = sum(1 for r in all_rets if r > 0)
    negative = sum(1 for r in all_rets if r < 0)

    avg_color = color(avg_all)

    category_summary = build_category_summary(data)
    top_table = build_table('주간 상승 TOP 10', top10, '1W', '🚀')
    bottom_table = build_table('주간 하락 TOP 10', bottom10, '1W', '📉')
    month_table = build_table('월간 수익률 TOP 10', top10_1m, '1M', '📅')

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>ETF 주간 리포트</title></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:24px 16px;">

    <!-- 헤더 -->
    <div style="text-align:center;margin-bottom:32px;padding:24px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;">
      <div style="font-size:28px;margin-bottom:8px;">📈</div>
      <h1 style="color:#e2e8f0;font-size:22px;margin:0 0 8px;">ETF 주간 분석 리포트</h1>
      <p style="color:#64748b;margin:0;font-size:14px;">{date_str} 기준</p>
    </div>

    <!-- 요약 통계 -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px;">
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
        <div style="color:#64748b;font-size:12px;margin-bottom:4px;">추적 ETF</div>
        <div style="color:#e2e8f0;font-size:22px;font-weight:700;">{total}개</div>
      </div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
        <div style="color:#64748b;font-size:12px;margin-bottom:4px;">전체 평균(1W)</div>
        <div style="color:{avg_color};font-size:22px;font-weight:700;">{fmt_pct(avg_all)}</div>
      </div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;border:1px solid #2a2a2a;">
        <div style="color:#64748b;font-size:12px;margin-bottom:4px;">상승/하락</div>
        <div style="font-size:18px;font-weight:700;">
          <span style="color:#22c55e;">{positive}</span>
          <span style="color:#64748b;"> / </span>
          <span style="color:#ef4444;">{negative}</span>
        </div>
      </div>
    </div>

    {category_summary}
    {top_table}
    {bottom_table}
    {month_table}

    <!-- 푸터 -->
    <div style="text-align:center;padding:16px;color:#374151;font-size:12px;border-top:1px solid #1f2937;margin-top:16px;">
      <a href="https://etf-hub.vercel.app" style="color:#3b82f6;text-decoration:none;">etf-hub.vercel.app</a>에서 더 자세한 분석을 확인하세요.
      <br>이 메일은 GitHub Actions에 의해 자동으로 발송됩니다.
    </div>

  </div>
</body>
</html>"""
    return html


def send_email(html_content, subject, to_addr, from_addr, app_password):
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_addr
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(from_addr, app_password)
        server.sendmail(from_addr, to_addr, msg.as_string())
    print(f"이메일 발송 완료: {to_addr}")


def main():
    gmail_user = os.environ.get('GMAIL_USER')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
    notify_email = os.environ.get('NOTIFY_EMAIL')

    if not all([gmail_user, gmail_password, notify_email]):
        print("환경 변수 누락: GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAIL 필요")
        return

    data = load_data()
    html = build_html(data)
    now = datetime.now(KST)
    subject = f"📈 ETF 주간 리포트 | {now.strftime('%Y.%m.%d')}"

    send_email(html, subject, notify_email, gmail_user, gmail_password)


if __name__ == '__main__':
    main()
