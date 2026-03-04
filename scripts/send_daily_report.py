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
from email.mime.base import MIMEBase
from email import encoders

KST = timezone(timedelta(hours=9))
DATA_FILE = os.path.join(os.path.dirname(__file__), '../frontend/public/data/etf_database.json')

# ─── 로테이션 기산일 ────────────────────────────────────────────────────────────
# 이 날짜가 CATEGORY_ORDER[0] (미국_S&P500) 기준일이 됩니다.
# 원하는 날짜로 변경하면 그 날부터 S&P500 → 나스닥 → ... 순으로 재시작됩니다.
ROTATION_START_DATE = date(2026, 3, 4)  # ← 여기서 기산일 변경
# ───────────────────────────────────────────────────────────────────────────────

# 카테고리 순환 순서
CATEGORY_ORDER = [
    '미국_S&P500', '미국_나스닥', '미국_전체시장', '미국_섹터', '미국_테마',
    '미국_채권', '미국_리츠', '미국_금/원자재', '미국_국제', '미국_성장/가치',
    '미국_배당', '미국_커버드콜', '미국_일드맥스', '미국_레버리지/인버스',
    '한국_미국S&P500', '한국_미국나스닥',
    '한국_주식시장', '한국_반도체/AI', '한국_2차전지', '한국_바이오/헬스케어',
    '한국_채권', '한국_금/원자재', '한국_리츠/배당', '한국_글로벌/선진국',
    '한국_중국/아시아', '한국_인도', '한국_미국테마', '한국_기타',
]

CATEGORY_LABELS = {
    '미국_S&P500': '미국 S&P500 추종 ETF',
    '미국_나스닥': '미국 나스닥100 추종 ETF',
    '미국_전체시장': '미국 전체시장 ETF',
    '미국_섹터': '미국 섹터별 ETF',
    '미국_테마': '미국 테마 ETF',
    '미국_채권': '미국 채권 ETF',
    '미국_리츠': '미국 리츠(부동산) ETF',
    '미국_금/원자재': '미국 금·원자재 ETF',
    '미국_국제': '미국 국제·신흥국 ETF',
    '미국_성장/가치': '미국 성장·가치주 ETF',
    '미국_배당': '미국 배당 ETF',
    '미국_커버드콜': '미국 커버드콜 ETF',
    '미국_일드맥스': '미국 YieldMax ETF',
    '미국_레버리지/인버스': '미국 레버리지·인버스 ETF',
    '한국_미국S&P500': '한국 상장 미국 S&P500 ETF',
    '한국_미국나스닥': '한국 상장 미국 나스닥100 ETF',
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
    '미국_S&P500': (
        'S&P500은 미국 시가총액 상위 500개 대형주로 구성된 지수로, 미국 주식시장의 약 80%를 커버하는 대표 벤치마크입니다. '
        '1957년 도입 이후 배당 포함 연평균 약 10%의 수익률을 기록하며 가장 검증된 투자 지수로 자리잡았습니다. '
        'SPY·IVV·VOO 등은 연 0.03~0.09% 수준의 초저비용으로 이 지수를 추적합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 경제의 장기적 성장을 믿으며 복잡한 종목 선택 없이 시장 전체의 성과를 누리고 싶은 장기 투자자. '
        '10년 이상의 투자 기간을 가진 적립식·연금 투자자, '
        '또는 "액티브 운용보다 인덱스 투자가 장기적으로 우월하다"는 철학을 가진 투자자에게 이상적입니다.'
    ),
    '미국_나스닥': (
        '나스닥100은 나스닥 거래소 상장 비금융 대형주 100개로 구성되며, Apple·Microsoft·NVIDIA·Amazon·Meta 등 '
        '글로벌 빅테크와 AI 핵심 기업이 포트폴리오의 절반 이상을 차지합니다. '
        'S&P500 대비 기술주 비중이 높아 AI·클라우드·반도체 성장 사이클에 민감하게 반응합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 빅테크와 AI·기술 혁신 기업의 고성장에 집중 투자하고 싶은 공격적 성향의 투자자. '
        'S&P500보다 변동성이 높고 섹터 집중 리스크가 있으므로, 단기 변동성을 충분히 감내할 수 있는 중장기 투자자에게 권장됩니다.'
    ),
    '미국_전체시장': (
        '미국 전체시장 ETF는 S&P500 대형주에 더해 중형주·소형주까지 포함하여 미국 주식시장 전체를 하나의 ETF로 추적합니다. '
        'VTI·ITOT 등이 대표적이며 약 4,000개 이상의 종목을 편입해 완전한 시장 분산 효과를 제공합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 주식시장 전체에 최대한 분산 투자하고 싶은 투자자. '
        'S&P500과 성과가 거의 유사하지만 중소형주 성장 기회도 함께 누릴 수 있어, '
        '보다 완전한 시장 포트폴리오를 원하는 패시브 장기 투자자에게 이상적입니다.'
    ),
    '미국_섹터': (
        '미국 섹터별 ETF는 기술·헬스케어·금융·에너지·소비재·유틸리티 등 특정 산업에 집중 투자하는 상품입니다. '
        'XLK(기술)·XLV(헬스케어)·XLF(금융)·XLE(에너지) 등 SPDR 섹터 시리즈가 가장 널리 알려져 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 특정 산업의 성장에 집중 투자하거나, '
        '경기 사이클에 맞춰 섹터 로테이션 전략을 구사하고 싶은 투자자. '
        '전체 시장보다 높은 변동성을 감수하는 대신 특정 섹터의 초과 수익을 추구하는 전술적 투자자에게 유용합니다.'
    ),
    '미국_테마': (
        '테마 ETF는 AI·클라우드·바이오테크·사이버보안·우주항공·클린에너지 등 미래 혁신 산업에 집중 투자합니다. '
        'ARK 시리즈·HACK·ICLN 등이 대표적이며, 전통 지수보다 높은 성장 잠재력을 추구하지만 변동성도 그만큼 큽니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미래 혁신 기술과 신산업의 폭발적 성장에 베팅하고 싶은 공격적 성향의 투자자. '
        '고성장 가능성과 함께 높은 변동성·섹터 집중 리스크를 수반하므로, '
        '포트폴리오의 위성 투자로 일부만 배분하는 방식이 권장됩니다.'
    ),
    '미국_채권': (
        '미국 채권 ETF는 국채·회사채·물가연동채(TIPS) 등 다양한 만기와 신용등급의 채권에 분산 투자합니다. '
        'TLT(장기 국채)·BND(전채권)·AGG(종합채권)·HYG(하이일드) 등이 주요 상품입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 안정적인 이자 소득을 추구하거나 주식 포트폴리오의 변동성을 완충하고 싶은 보수적 투자자. '
        '금리 인하기에는 장기채 ETF가 강세를 보이고, 금리 인상기에는 단기채·TIPS가 방어력을 발휘합니다. '
        '은퇴가 가까운 투자자나 자산 배분 포트폴리오 구성 시 핵심 안전자산 역할을 합니다.'
    ),
    '미국_리츠': (
        '미국 리츠(REITs) ETF는 사무용 빌딩·물류센터·데이터센터·헬스케어 시설 등 다양한 부동산 자산에 간접 투자합니다. '
        'VNQ·IYR·SCHH 등이 대표적이며, 법적으로 과세 소득의 90% 이상을 배당으로 지급해야 합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 부동산에 간접 투자하며 안정적인 배당 소득을 원하는 투자자. '
        '주식·채권과 낮은 상관관계를 가져 포트폴리오 다각화에 유용하며, '
        '특히 인플레이션 환경에서 실물 자산의 가치 보존 효과도 기대할 수 있습니다.'
    ),
    '미국_금/원자재': (
        '원자재 ETF는 금·은·원유·천연가스·농산물 등 실물 자산에 투자합니다. '
        'GLD(금)·SLV(은)·USO(원유)·DBC(종합 원자재) 등이 대표적입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 인플레이션 헤지를 목적으로 실물 자산을 포트폴리오에 편입하고 싶은 투자자. '
        '주식·채권과 낮은 상관관계로 분산 효과가 있으며, 지정학적 불확실성이나 달러 약세 시기에 특히 방어력을 발휘합니다. '
        '전체 포트폴리오의 5~15% 수준의 위성 투자로 활용하는 것이 일반적입니다.'
    ),
    '미국_국제': (
        '국제 ETF는 미국 외 글로벌 선진국·신흥국·지역별 시장에 투자합니다. '
        'EFA(선진국)·EEM(신흥국)·VEA·IEFA 등이 대표적이며, 미국 시장과의 분산 효과를 제공합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 단일 시장 집중을 피하고 글로벌 주식 시장 전반으로 분산 투자하고 싶은 투자자. '
        '미국 달러 강세·약세 사이클, 신흥국 성장 모멘텀, 유럽·일본 경기 회복 등 다양한 글로벌 테마를 포착할 수 있습니다. '
        '통화 위험(환율 리스크)을 감수해야 하지만 장기적으로 지역 분산의 복리 효과를 기대할 수 있습니다.'
    ),
    '미국_성장/가치': (
        '성장주·가치주 스타일 ETF는 시장을 성장(Growth)과 가치(Value)로 나눠 투자합니다. '
        'VUG·IVW(성장)·VTV·IVE(가치) 등이 대표적이며, 경기 사이클과 금리 환경에 따라 성과가 엇갈립니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 시장 사이클에 맞춰 성장주와 가치주 사이에서 전략적으로 비중을 조절하고 싶은 투자자. '
        '일반적으로 금리 인상기·경기 회복기에는 가치주가, 금리 인하기·기술 성장기에는 성장주가 강세를 보입니다.'
    ),
    '미국_배당': (
        '미국 배당 ETF는 고배당주·배당 성장주에 집중 투자해 꾸준한 현금 흐름을 창출합니다. '
        'VYM·SCHD(고배당)·VIG·DGRO(배당 성장) 등이 대표적이며, 배당 수익률과 성장성의 균형을 추구합니다. '
        'SCHD는 배당 성장+재무 건전성 기준으로 선별된 100개 기업에 투자해 한국 투자자에게도 큰 인기를 끌고 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 주가 상승 외에 정기적인 배당 소득을 원하는 투자자, '
        '또는 은퇴 후 현금 흐름 창출을 위한 배당 포트폴리오를 구축하고 싶은 장기 투자자. '
        '시장 하락기에도 배당 수익이 완충 역할을 해 변동성이 낮고 심리적 안정감을 제공합니다.'
    ),
    '미국_커버드콜': (
        '커버드콜 ETF는 주식 포지션을 보유하면서 콜옵션을 매도해 옵션 프리미엄 수익을 정기 배당으로 지급합니다. '
        'JEPI·JEPQ(JP모건)·XYLD·QYLD(Global X) 등이 대표적이며, 연 7~12% 수준의 높은 배당수익률을 제공합니다. '
        '다만 강한 상승장에서는 주가 차익이 제한되는 트레이드오프가 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 높은 월배당 현금 흐름을 원하지만 순수 성장주의 변동성은 피하고 싶은 투자자. '
        '횡보장·완만한 상승장에서 가장 유리하며, 급등장보다는 안정적 소득 창출에 초점을 둔 은퇴 소득형 투자자에게 적합합니다.'
    ),
    '미국_일드맥스': (
        'YieldMax ETF는 Tesla·NVIDIA·Amazon 등 개별 대형주를 기초자산으로 합성 커버드콜 전략을 구사합니다. '
        '연 50~100%에 달하는 초고배당 월분배를 제공하지만, 기초 주식의 상승분은 제한되고 하락 위험은 그대로 노출됩니다. '
        'TSLY(테슬라)·NVDY(엔비디아)·YMAG(매그니피센트7)·YMAX(분산형) 등이 주요 상품입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 단기 고배당 현금 흐름이 절실히 필요한 투자자. '
        '원금 감소(NAV 하락) 가능성이 매우 높고 장기 보유 시 총 수익이 기초 주식보다 크게 열위할 수 있습니다. '
        '장기 자산 증식보다는 단기 소득 창출 목적으로만 일부 배분하는 전술적 접근이 필요합니다.'
    ),
    '미국_레버리지/인버스': (
        '레버리지·인버스 ETF는 기초 지수의 2~3배 수익률(레버리지) 또는 역방향 수익률(인버스)을 일별로 추적합니다. '
        'TQQQ(나스닥 3배)·SOXL(반도체 3배)·SQQQ(나스닥 -3배) 등이 대표적입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 단기 트레이딩이나 헤지 목적으로 레버리지를 활용하는 경험 있는 투자자에게만 적합합니다. '
        '일별 복리 효과(Volatility Decay)로 인해 장기 보유 시 기대 수익률이 크게 훼손될 수 있으며, '
        '하락장에서 급격한 손실 위험이 존재합니다. 장기 투자 목적으로는 절대 사용하지 않아야 합니다.'
    ),
    '한국_미국S&P500': (
        '한국 거래소(KRX)에 상장된 미국 S&P500 지수 추종 ETF들을 비교합니다. '
        'TIGER 미국S&P500·KODEX 미국S&P500·ACE 미국S&P500 등 국내 운용사 상품으로, '
        '별도 해외 계좌나 환전 없이 원화로 미국 대형주 500개에 분산 투자할 수 있습니다. '
        '환헷지(H) 버전은 환율 변동 영향을 제거하고, 환노출 버전은 달러 상승 시 추가 수익을 기대할 수 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 주식시장의 장기 성장에 투자하고 싶지만 국내 주식 계좌에서 편리하게 거래하고 싶은 한국 투자자. '
        '특히 ISA·연금저축 계좌에서 세제 혜택을 받으며 미국 지수 투자를 원하는 투자자에게 최적의 선택입니다.'
    ),
    '한국_미국나스닥': (
        '한국 거래소(KRX)에 상장된 미국 나스닥100 지수 추종 ETF들을 비교합니다. '
        'TIGER 미국나스닥100·KODEX 미국나스닥100·ACE 미국나스닥100 등이 대표 상품으로, '
        '원화로 Apple·Microsoft·NVIDIA 등 나스닥 빅테크에 투자할 수 있습니다. '
        'ISA·연금저축·IRP 계좌를 통해 세제 혜택도 받을 수 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> AI·빅테크 성장에 투자하고 싶지만 국내 계좌에서 편리하게 거래하고 싶은 한국 투자자. '
        '환헷지 여부에 따라 환율 리스크를 선택적으로 조절할 수 있어 투자 목적에 맞는 상품 선택이 중요합니다.'
    ),
    '한국_주식시장': (
        '한국 증시를 대표하는 지수를 추종하는 ETF들을 비교합니다. '
        'KODEX 200·TIGER 200 등이 대표 상품으로, 삼성전자·SK하이닉스·현대차·LG에너지솔루션 등 국내 대형주에 분산 투자합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 한국 주식시장 전반의 성장에 투자하거나, 국내 시장에서 저비용 인덱스 투자를 원하는 투자자. '
        '글로벌 대비 밸류에이션이 낮아(코리아 디스카운트) 저평가 매력이 있으나, '
        '북한 리스크·수출 의존도·대기업 집중 등 한국 특유의 리스크도 함께 고려해야 합니다.'
    ),
    '한국_반도체/AI': (
        '한국 반도체·AI 관련 종목에 집중 투자하는 ETF들을 비교합니다. '
        '삼성전자·SK하이닉스를 중심으로 반도체 소재·장비·팹리스까지 밸류체인 전반을 편입합니다. '
        'AI 인프라 수요 증가에 따른 HBM(고대역폭 메모리) 수요 급증이 핵심 성장 동력입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 반도체·AI 산업의 구조적 성장에 집중 투자하고 싶은 투자자. '
        '글로벌 AI 인프라 확장 사이클의 수혜를 직접적으로 받을 수 있지만, '
        '업황 사이클과 글로벌 수요에 따른 변동성이 크므로 장기적 관점이 필요합니다.'
    ),
    '한국_2차전지': (
        '전기차 배터리와 관련된 소재·셀·모듈·장비 기업에 집중 투자하는 ETF들을 비교합니다. '
        'LG에너지솔루션·삼성SDI·SK이노베이션·에코프로비엠·POSCO홀딩스 등이 주요 편입 종목입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 전기차 전환과 에너지 저장 시스템 확대라는 메가 트렌드에 투자하고 싶은 투자자. '
        '전기차 보급 속도, 배터리 가격 하락, 글로벌 경쟁 심화 등에 따라 변동성이 크며, '
        '2023~2024년의 급격한 조정 이후 밸류에이션 매력이 부각되고 있는 구간입니다.'
    ),
    '한국_바이오/헬스케어': (
        '한국 제약·바이오테크·의료기기 기업에 투자하는 ETF들을 비교합니다. '
        '삼성바이오로직스·셀트리온·한미약품·유한양행 등 대형 바이오 기업부터 임상 단계의 신약 개발사까지 편입합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 고령화 사회와 글로벌 헬스케어 수요 증가에 따른 바이오·제약 산업의 성장에 투자하고 싶은 투자자. '
        '신약 임상 결과·FDA 승인 여부에 따라 주가가 급등락하므로, '
        'ETF를 통한 분산 투자로 특정 종목 집중 리스크를 완화하는 것이 중요합니다.'
    ),
    '한국_채권': (
        '한국 국고채·회사채·단기채 등에 투자하는 ETF들을 비교합니다. '
        'KODEX 국고채10년·TIGER 단기통안채·KODEX 회사채 등이 대표 상품으로, '
        '만기와 신용등급에 따라 다양한 선택지를 제공합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 원금 보존과 안정적인 이자 소득을 원하거나 주식 포트폴리오의 변동성을 줄이고 싶은 보수적 투자자. '
        '한국 기준금리 방향에 따라 채권 ETF 가격이 민감하게 반응하며, '
        '금리 인하 사이클 진입 시 장기채 ETF가 유리한 성과를 낼 수 있습니다.'
    ),
    '한국_금/원자재': (
        '한국 거래소를 통해 금·원유·구리 등 실물 원자재에 투자하는 ETF들을 비교합니다. '
        'KODEX 골드선물·TIGER 금은선물 등이 대표적이며, 원화 기반으로 실물 자산에 편리하게 투자할 수 있습니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 인플레이션 헤지와 포트폴리오 다각화를 목적으로 실물 자산을 편입하고 싶은 투자자. '
        '달러 약세·지정학적 불안·공급망 이슈 시 강세를 보이는 특성이 있으며, '
        '주식·채권과의 낮은 상관관계로 포트폴리오 안정성을 높이는 데 기여합니다.'
    ),
    '한국_리츠/배당': (
        '한국 리츠·고배당 ETF는 부동산투자신탁(REITs)과 배당 성향이 높은 국내외 종목에 투자합니다. '
        'TIGER 부동산인프라고배당·KODEX 배당성장·ARIRANG 고배당주 등이 대표 상품입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 주기적인 배당 수익으로 현금 흐름을 만들거나, 은퇴 후 안정적인 인컴(Income)을 추구하는 투자자. '
        '배당 수익률이 예·적금 금리보다 높은 경우가 많아 중장기 배당 재투자 전략에도 유용하며, '
        'ISA·연금저축 계좌와 결합 시 배당 소득에 대한 세제 혜택을 받을 수 있습니다.'
    ),
    '한국_글로벌/선진국': (
        '한국에서 글로벌 선진국 주식 시장에 투자하는 ETF들을 비교합니다. '
        'TIGER 선진국MSCI World·KODEX MSCI선진국 등이 대표적이며, 미국·유럽·일본 등 선진 경제권에 원화로 분산 투자합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 미국 단일 시장 편중을 피하고 글로벌 선진국으로 지역 분산을 원하는 한국 투자자. '
        '미국 시장이 과열되거나 달러 약세가 예상될 때 유럽·일본 등 선진국 시장으로의 분산이 유효한 전략이 됩니다. '
        '환율 리스크가 수반되므로 환헷지 여부를 확인하는 것이 중요합니다.'
    ),
    '한국_중국/아시아': (
        '한국에서 중국·홍콩·베트남 등 아시아 신흥국 시장에 투자하는 ETF들을 비교합니다. '
        'TIGER 차이나CSI300·KODEX 차이나항셍테크·KODEX 베트남VN30 등이 대표적입니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 중국 경기 회복, 아시아 신흥국의 고성장에 투자하고 싶은 공격적 성향의 투자자. '
        '중국의 경우 규제 리스크·지정학적 긴장이 핵심 변수이며, '
        '베트남 등 신흥국은 높은 성장 잠재력과 함께 유동성·정치적 리스크를 감수해야 합니다.'
    ),
    '한국_인도': (
        '한국에서 인도 주식 시장에 투자하는 ETF들을 비교합니다. '
        'TIGER 인도니프티50·KODEX 인도Nifty50·ACE 인도시장대표 등이 대표적이며, '
        '세계 최대 인구 대국이자 가장 빠르게 성장하는 신흥국 경제에 투자합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 인구 배당효과와 디지털화·제조업 성장이라는 인도 특유의 성장 스토리를 믿는 투자자. '
        '중장기적으로 가장 매력적인 신흥국 투자처 중 하나로 평가받지만, '
        '루피화 환율 리스크와 밸류에이션 부담(신흥국 대비 프리미엄)을 고려해야 합니다.'
    ),
    '한국_미국테마': (
        '한국 거래소에 상장된 미국 테마 ETF들을 비교합니다. '
        'TIGER 미국테크TOP10·KODEX 미국AI테크TOP10·ACE 미국빅테크TOP7Plus 등이 대표적으로, '
        '미국 빅테크·AI·반도체·우주항공 등 혁신 테마에 원화로 집중 투자합니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 나스닥100보다 더 좁고 특화된 미국 혁신 테마에 집중 투자하고 싶은 공격적 성향의 한국 투자자. '
        '소수 종목(10개 내외)에 집중되어 분산도가 낮고 변동성이 높지만, '
        '강세장에서 시장 대비 큰 폭의 초과 수익을 기대할 수 있습니다.'
    ),
    '한국_기타': (
        '위의 분류에 속하지 않는 다양한 전략과 자산군을 추구하는 한국 상장 ETF들을 분석합니다. '
        '멀티에셋·혼합자산·절대수익 추구형·대안투자 등 특수 목적의 상품들이 포함됩니다.<br><br>'
        '<strong>이런 투자자에게 적합합니다:</strong> 전통적인 주식·채권 배분을 넘어 다양한 대안 전략으로 포트폴리오를 다각화하고 싶은 투자자. '
        '상품마다 투자 전략과 위험 프로파일이 크게 다르므로, 투자 전 각 ETF의 운용 방식과 비용을 꼼꼼히 확인하는 것이 중요합니다.'
    ),
}


# ─── 유틸리티 ────────────────────────────────────────────────────────────────

def load_data():
    with open(DATA_FILE, encoding='utf-8') as f:
        return json.load(f)


def get_today_category(available_cats):
    """날짜 기반으로 오늘의 카테고리 결정 (ROTATION_START_DATE 기준 순환)"""
    valid = [c for c in CATEGORY_ORDER if c in available_cats]
    days_elapsed = (date.today() - ROTATION_START_DATE).days
    idx = days_elapsed % len(valid)
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


def display_name(etf, is_kr):
    """한국 ETF는 종목명, 미국 ETF는 티커 반환"""
    if is_kr:
        return etf.get('name', etf['ticker'])
    return etf['ticker']


# 기간별 수익률 차트 설정
CHART_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b',
]
PERIODS     = ['1M', '3M', '6M', '1Y', '3Y', '5Y']
PERIOD_LABELS_KO = ['1개월', '3개월', '6개월', '1년', '3년', '5년']


# ─── 분석 텍스트 생성 ──────────────────────────────────────────────────────────

def generate_analysis(cat_key, etfs, is_kr=False):
    label = CATEGORY_LABELS.get(cat_key, cat_key)
    w1 = [(e, e.get('returns', {}).get('1W')) for e in etfs]
    w1 = [(e, r) for e, r in w1 if r is not None]
    y1 = [(e, e.get('returns', {}).get('1Y')) for e in etfs]
    y1 = [(e, r) for e, r in y1 if r is not None]

    if not w1:
        return f"<p style='margin:0'>현재 {label}의 데이터를 집계 중입니다.</p>"

    avg_1w = sum(r for _, r in w1) / len(w1)
    best = max(w1, key=lambda x: x[1])
    worst = min(w1, key=lambda x: x[1])
    positive = sum(1 for _, r in w1 if r > 0)
    negative = sum(1 for _, r in w1 if r < 0)

    trend = "상승세" if avg_1w > 0 else "하락세"
    best_name = display_name(best[0], is_kr)
    worst_name = display_name(worst[0], is_kr)

    lines = []
    lines.append(
        f"이번 주 {label}는 평균 <strong>{fmt_pct(avg_1w)}</strong>를 기록하며 전반적으로 {trend}를 보였습니다. "
        f"총 {len(w1)}개 ETF 중 <strong style='color:#388e3c;'>{positive}개 상승</strong>, "
        f"<strong style='color:#d32f2f;'>{negative}개 하락</strong>했습니다."
    )
    lines.append(
        f"가장 높은 성과를 보인 ETF는 <strong>{best_name}</strong>으로 "
        f"주간 <strong style='color:#388e3c;'>{fmt_pct(best[1])}</strong>의 수익률을 기록했습니다."
    )
    if worst[1] is not None and worst[1] < 0:
        lines.append(
            f"반면 <strong>{worst_name}</strong>는 "
            f"<strong style='color:#d32f2f;'>{fmt_pct(worst[1])}</strong>로 가장 큰 조정을 받았습니다."
        )

    if y1:
        avg_1y = sum(r for _, r in y1) / len(y1)
        best_y1 = max(y1, key=lambda x: x[1])
        best_y1_name = display_name(best_y1[0], is_kr)
        if avg_1w > 0 and avg_1y > 0:
            lines.append(
                f"단기·장기 모두 양호한 흐름으로, 연간 평균 수익률은 <strong>{fmt_pct(avg_1y)}</strong>이며 "
                f"1년 기준 최고 성과는 <strong>{best_y1_name}</strong> ({fmt_pct(best_y1[1])})입니다."
            )
        elif avg_1w < 0 and avg_1y > 0:
            lines.append(
                f"최근 단기 조정이 있지만 연간 기준으로는 <strong>{fmt_pct(avg_1y)}</strong>를 유지하고 있습니다. "
                f"1년 기준 최고 성과는 <strong>{best_y1_name}</strong> ({fmt_pct(best_y1[1])})입니다."
            )
        elif avg_1w > 0 and avg_1y < 0:
            lines.append(
                f"최근 반등을 보이고 있으나 연간 기준으로는 "
                f"<strong style='color:#d32f2f;'>{fmt_pct(avg_1y)}</strong> 수준으로 회복 여부를 주시해야 합니다."
            )
        else:
            lines.append(
                f"단기·장기 모두 부진한 구간으로, 연간 평균 수익률은 "
                f"<strong style='color:#d32f2f;'>{fmt_pct(avg_1y)}</strong>입니다."
            )

    return ' '.join(f"<p style='margin:0 0 10px;'>{l}</p>" for l in lines)


# ─── HTML 생성 ────────────────────────────────────────────────────────────────

def td(content, align='right', extra=''):
    return f'<td style="padding:7px 10px;text-align:{align};font-size:13px;{extra}">{content}</td>'


def ret_td(v):
    color = ret_color(v)
    return td(fmt_pct(v), extra=f'font-weight:600;color:{color};')


def build_svg_chart(etfs, is_kr):
    """기간별 수익률 SVG 선형 차트 (1M ~ 5Y, 이메일·티스토리 호환)"""
    valid = []
    for etf in etfs:
        r = etf.get('returns', {})
        pts = [r.get(p) for p in PERIODS]
        if any(v is not None for v in pts):
            valid.append((etf, pts))
    if not valid:
        return ''

    W, H = 580, 260
    PL, PR, PT, PB = 54, 16, 16, 36
    cw, ch = W - PL - PR, H - PT - PB
    n = len(PERIODS)

    all_vals = [v for _, pts in valid for v in pts if v is not None]
    if not all_vals:
        return ''
    raw_min, raw_max = min(all_vals), max(all_vals)
    span = raw_max - raw_min or 10
    y_min, y_max = raw_min - span * 0.10, raw_max + span * 0.10

    def xp(i): return PL + (i / (n - 1)) * cw
    def yp(v): return PT + ch * (1 - (v - y_min) / (y_max - y_min))

    # 배경 + 격자
    grid = f'<rect x="{PL}" y="{PT}" width="{cw}" height="{ch}" fill="#f9fafb" rx="4"/>'
    for s in range(6):
        yv = y_min + (y_max - y_min) * s / 5
        y = yp(yv)
        is_zero = abs(yv) < (y_max - y_min) * 0.06
        stroke, sw = ('#9ca3af' if is_zero else '#e5e7eb'), ('1.5' if is_zero else '1')
        grid += f'<line x1="{PL}" y1="{y:.1f}" x2="{W-PR}" y2="{y:.1f}" stroke="{stroke}" stroke-width="{sw}"/>'
        sign = '+' if yv > 0 else ''
        grid += f'<text x="{PL-4}" y="{y+4:.1f}" text-anchor="end" font-size="10" fill="#94a3b8">{sign}{yv:.0f}%</text>'

    xaxis = ''
    for i, lab in enumerate(PERIOD_LABELS_KO):
        x = xp(i)
        xaxis += f'<line x1="{x:.1f}" y1="{PT}" x2="{x:.1f}" y2="{PT+ch}" stroke="#f0f0f0" stroke-width="1"/>'
        xaxis += f'<text x="{x:.1f}" y="{H-4}" text-anchor="middle" font-size="10" fill="#94a3b8">{lab}</text>'

    lines_svg = ''
    for idx, (etf, pts) in enumerate(valid[:10]):
        color = CHART_COLORS[idx % len(CHART_COLORS)]
        path_d, dots = '', ''
        last_x = last_y = last_v = None
        for i, v in enumerate(pts):
            if v is None:
                continue
            x, y = xp(i), yp(v)
            path_d += f'{"M" if not path_d else " L"}{x:.1f},{y:.1f}'
            dots += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.5" fill="{color}" stroke="white" stroke-width="1.5"/>'
            last_x, last_y, last_v = x, y, v
        if path_d:
            lines_svg += f'<path d="{path_d}" stroke="{color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            lines_svg += dots
        if last_v is not None:
            fc = '#16a34a' if last_v >= 0 else '#dc2626'
            sign = '+' if last_v > 0 else ''
            lines_svg += f'<text x="{last_x+5:.1f}" y="{last_y+4:.1f}" font-size="9" fill="{fc}" font-weight="600">{sign}{last_v:.1f}%</text>'

    # 범례
    COLS = 3
    legend = ''
    for idx, (etf, _) in enumerate(valid[:10]):
        color = CHART_COLORS[idx % len(CHART_COLORS)]
        dname = display_name(etf, is_kr)
        short = dname[:24] + '…' if len(dname) > 24 else dname
        lx = PL + (idx % COLS) * ((W - PL) // COLS)
        ly = H + 14 + (idx // COLS) * 18
        legend += f'<rect x="{lx}" y="{ly-7}" width="16" height="3" fill="{color}" rx="1.5"/>'
        legend += f'<text x="{lx+20}" y="{ly}" font-size="10" fill="#374151">{short}</text>'

    legend_rows = (len(valid) + COLS - 1) // COLS
    total_h = H + 14 + legend_rows * 18 + 6

    return f"""
<h2 style="font-size:18px;color:#222;margin:28px 0 12px;border-left:4px solid #6366f1;padding-left:12px;">📈 기간별 수익률 추이</h2>
<div style="overflow-x:auto;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {total_h}" style="width:100%;max-width:{W}px;display:block;">
  {grid}{xaxis}{lines_svg}{legend}
</svg>
</div>"""


def build_period_table(etfs, is_kr):
    """1M~5Y 수익률 + 변동성 + MDD 종합 비교표"""
    # 1Y 수익률 기준 정렬
    sorted_e = sorted(etfs, key=lambda e: (e.get('returns', {}).get('1Y') or -9999), reverse=True)
    rows = ''
    for etf in sorted_e:
        r = etf.get('returns', {})
        c = etf.get('cagr', {})
        vol = etf.get('volatility')
        mdd = etf.get('maxDrawdown')
        aum = etf.get('aum')
        dy  = etf.get('dividendYield')
        dname = display_name(etf, is_kr)
        short = dname[:26] + '…' if len(dname) > 26 else dname
        r1y = r.get('1Y')
        bg = '#fff8f8' if (r1y or 0) < 0 else ('#f0fdf4' if (r1y or 0) > 0 else '#fafafa')

        rows += (
            f'<tr style="border-bottom:1px solid #f0f0f0;background:{bg};">'
            + f'<td style="padding:7px 8px;font-size:12px;font-weight:600;color:#1a1a1a;white-space:nowrap;">{short}</td>'
            + ret_td(r.get('1M'))
            + ret_td(r.get('3M'))
            + ret_td(r.get('6M'))
            + ret_td(r.get('1Y'))
            + ret_td(c.get('3Y'))
            + ret_td(c.get('5Y'))
            + td(f'{vol:.1f}%' if vol else '-', extra='color:#64748b;font-size:12px;')
            + td(f'<span style="color:#dc2626;font-size:12px;">{mdd:.1f}%</span>' if mdd else '-')
            + td(fmt_aum(aum, is_kr), extra='color:#475569;font-size:12px;')
            + td(f'<span style="color:#16a34a;font-size:12px;">{dy:.2f}%</span>' if dy else '-')
            + '</tr>'
        )

    return f"""
<h2 style="font-size:18px;color:#222;margin:28px 0 12px;border-left:4px solid #f59e0b;padding-left:12px;">📋 수익률 데이터 시트</h2>
<div style="overflow-x:auto;">
<table style="width:100%;border-collapse:collapse;font-family:sans-serif;min-width:640px;">
  <thead><tr style="background:#f3f4f6;border-bottom:2px solid #e5e7eb;">
    <th style="padding:8px;text-align:left;font-size:11px;color:#666;font-weight:600;min-width:120px;">ETF명</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">1개월</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">3개월</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">6개월</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">1년</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">3년 CAGR</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">5년 CAGR</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">변동성</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">최대낙폭</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">AUM</th>
    <th style="padding:8px;text-align:right;font-size:11px;color:#666;font-weight:600;">배당률</th>
  </tr></thead>
  <tbody>{rows}</tbody>
</table>
</div>
<p style="font-size:11px;color:#aaa;margin:4px 0 0;">* 수익률·CAGR: 배당 포함 총수익률 기준 | 변동성: 연환산 표준편차 | 최대낙폭: 최고점 대비 최대 손실</p>"""


def get_period_return(etf, period):
    """3Y·5Y는 cagr에서, 나머지는 returns에서 수익률 반환"""
    if period in ('3Y', '5Y'):
        return etf.get('cagr', {}).get(period)
    return etf.get('returns', {}).get(period)


def build_etf_cards(etfs, is_kr, period='1Y', period_label='1년'):
    """기간별 ETF 카드 (해당 기간 수익률 상위 3개, 같은 카드 양식)"""
    with_p = [e for e in etfs if get_period_return(e, period) is not None]
    if not with_p:
        return ''
    sorted_e = sorted(with_p, key=lambda e: get_period_return(e, period), reverse=True)
    show_e = sorted_e[:3]
    cols = len(show_e)

    def make_card(etf):
        r = etf.get('returns', {})
        dname = display_name(etf, is_kr)
        ticker = etf['ticker']
        rp = get_period_return(etf, period)
        r1w = r.get('1W')
        dy = etf.get('dividendYield')
        vol = etf.get('volatility')
        mdd = etf.get('maxDrawdown')

        rp_c = '#388e3c' if (rp or 0) >= 0 else '#d32f2f'
        rp_str = fmt_pct(rp)

        if is_kr:
            top_line = dname[:16] + '…' if len(dname) > 16 else dname
            sub_line = ticker
        else:
            top_line = ticker
            ename = etf.get('name', '')
            sub_line = (ename[:22] + '…') if len(ename) > 22 else ename

        rows_inner = (
            f'<tr style="border-bottom:1px solid #f1f5f9;">'
            f'<td style="padding:7px 0;font-size:12px;color:#64748b;">주간 수익률</td>'
            f'<td style="font-size:13px;font-weight:600;color:{ret_color(r1w)};text-align:right;">{fmt_pct(r1w)}</td>'
            f'</tr>'
            f'<tr style="border-bottom:1px solid #f1f5f9;">'
            f'<td style="padding:7px 0;font-size:12px;color:#64748b;">배당수익률</td>'
            f'<td style="font-size:13px;font-weight:600;color:#16a34a;text-align:right;">{f"{dy:.2f}%" if dy else "-"}</td>'
            f'</tr>'
            f'<tr style="border-bottom:1px solid #f1f5f9;">'
            f'<td style="padding:7px 0;font-size:12px;color:#64748b;">변동성 (연환산)</td>'
            f'<td style="font-size:13px;font-weight:600;color:#7c3aed;text-align:right;">{f"{vol:.1f}%" if vol else "-"}</td>'
            f'</tr>'
            f'<tr>'
            f'<td style="padding:7px 0;font-size:12px;color:#64748b;">최대 낙폭 (MDD)</td>'
            f'<td style="font-size:13px;font-weight:600;color:#dc2626;text-align:right;">{f"{mdd:.1f}%" if mdd else "-"}</td>'
            f'</tr>'
        )
        return (
            f'<td style="padding:6px;vertical-align:top;width:{100 // cols}%;">'
            f'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">'
            f'<div style="background:#0f172a;padding:12px 14px;">'
            f'<div style="color:#f1f5f9;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;">{top_line}</div>'
            f'<div style="color:#64748b;font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;">{sub_line}</div>'
            f'</div>'
            f'<div style="background:{rp_c};padding:10px 14px;text-align:center;">'
            f'<div style="color:rgba(255,255,255,0.75);font-size:10px;margin-bottom:3px;">{period_label} 수익률</div>'
            f'<div style="color:#fff;font-size:22px;font-weight:700;">{rp_str}</div>'
            f'</div>'
            f'<div style="padding:0 12px;">'
            f'<table style="width:100%;border-collapse:collapse;">{rows_inner}</table>'
            f'</div>'
            f'</div>'
            f'</td>'
        )

    row_tds = ''.join(make_card(e) for e in show_e)
    for _ in range(3 - cols):
        row_tds += '<td style="padding:6px;"></td>'

    return (
        f'<h3 style="font-size:15px;color:#374151;margin:20px 0 8px;padding-left:10px;'
        f'border-left:3px solid #6366f1;">{period_label} 수익률 TOP 3</h3>'
        f'<table style="width:100%;border-collapse:collapse;table-layout:fixed;">'
        f'<tr>{row_tds}</tr></table>'
    )


def build_1y_insights(etfs, is_kr):
    """1Y 수익률 기반 인사이트 불릿 리스트"""
    with_1y = [(e, e.get('returns', {}).get('1Y')) for e in etfs if e.get('returns', {}).get('1Y') is not None]
    if len(with_1y) < 2:
        return ''

    sorted_1y = sorted(with_1y, key=lambda x: x[1], reverse=True)
    best_e, best_r = sorted_1y[0]
    worst_e, worst_r = sorted_1y[-1]
    avg_r = sum(r for _, r in sorted_1y) / len(sorted_1y)

    with_dy = [(e, e.get('dividendYield')) for e in etfs if e.get('dividendYield')]
    with_vol = [(e, e.get('volatility')) for e in etfs if e.get('volatility')]

    items = [
        f"<strong>{display_name(best_e, is_kr)}</strong>이(가) 1년 <strong style='color:#16a34a;'>{fmt_pct(best_r)}</strong>으로 카테고리 내 최고 수익률을 기록했습니다."
    ]
    if worst_r < 0:
        items.append(
            f"<strong>{display_name(worst_e, is_kr)}</strong>은(는) <strong style='color:#dc2626;'>{fmt_pct(worst_r)}</strong>로 가장 부진했습니다."
        )
    else:
        items.append(
            f"최하위 <strong>{display_name(worst_e, is_kr)}</strong>도 <strong style='color:#16a34a;'>{fmt_pct(worst_r)}</strong>를 기록해 카테고리 전반이 양호한 흐름을 보였습니다."
        )
    items.append(
        f"카테고리 평균 1년 수익률은 <strong style='color:{ret_color(avg_r)};'>{fmt_pct(avg_r)}</strong>입니다."
    )
    if with_dy:
        dy_e, dy_r = max(with_dy, key=lambda x: x[1])
        items.append(
            f"배당 측면에서는 <strong>{display_name(dy_e, is_kr)}</strong>가 연 <strong style='color:#16a34a;'>{dy_r:.2f}%</strong>로 가장 높은 배당수익률을 제공합니다."
        )
    if with_vol:
        vol_e, vol_r = min(with_vol, key=lambda x: x[1])
        items.append(
            f"변동성이 가장 낮은 ETF는 <strong>{display_name(vol_e, is_kr)}</strong>(연환산 {vol_r:.1f}%)로, 안정성을 중시한다면 참고할 만합니다."
        )

    bullets = ''.join(
        f'<li style="padding:5px 0;font-size:14px;color:#374151;line-height:1.7;">{item}</li>'
        for item in items
    )
    return (
        f'<h2 style="font-size:18px;color:#222;margin:28px 0 12px;border-left:4px solid #0ea5e9;padding-left:12px;">'
        f'💡 1Y 수익률 인사이트</h2>'
        f'<ul style="margin:0 0 20px;padding-left:20px;list-style-type:disc;">{bullets}</ul>'
    )


def build_period_insights(etfs, is_kr, period, period_label):
    """기간별 수익률 인사이트 (카드 아래 바로 표시)"""
    with_p = [(e, get_period_return(e, period)) for e in etfs if get_period_return(e, period) is not None]
    if len(with_p) < 2:
        return ''

    sorted_p = sorted(with_p, key=lambda x: x[1], reverse=True)
    best_e, best_r = sorted_p[0]
    worst_e, worst_r = sorted_p[-1]
    avg_r = sum(r for _, r in sorted_p) / len(sorted_p)

    items = [
        f"<strong>{display_name(best_e, is_kr)}</strong>이(가) {period_label} "
        f"<strong style='color:#16a34a;'>{fmt_pct(best_r)}</strong>으로 가장 높은 수익률을 기록했습니다."
    ]
    if worst_r < 0:
        items.append(
            f"<strong>{display_name(worst_e, is_kr)}</strong>은(는) "
            f"<strong style='color:#dc2626;'>{fmt_pct(worst_r)}</strong>로 가장 부진했습니다."
        )
    else:
        items.append(
            f"최하위 <strong>{display_name(worst_e, is_kr)}</strong>도 "
            f"<strong style='color:#16a34a;'>{fmt_pct(worst_r)}</strong>를 기록해 전반적으로 양호한 흐름을 보였습니다."
        )
    items.append(
        f"카테고리 평균 {period_label} 수익률은 "
        f"<strong style='color:{ret_color(avg_r)};'>{fmt_pct(avg_r)}</strong>입니다."
    )

    # 2위·3위도 짧게 언급
    if len(sorted_p) >= 3:
        second_e, second_r = sorted_p[1]
        third_e, third_r = sorted_p[2]
        items.append(
            f"2위 <strong>{display_name(second_e, is_kr)}</strong> {fmt_pct(second_r)}, "
            f"3위 <strong>{display_name(third_e, is_kr)}</strong> {fmt_pct(third_r)}."
        )

    bullets = ''.join(
        f'<li style="padding:4px 0;font-size:13px;color:#374151;line-height:1.7;">{item}</li>'
        for item in items
    )
    return f'<ul style="margin:6px 0 20px;padding-left:20px;list-style-type:disc;">{bullets}</ul>'


def build_etf_list_summary(etfs, is_kr):
    """오늘의 요약 아래 분석 ETF 목록 소개 문단"""
    if not etfs:
        return ''
    parts = []
    for etf in etfs:
        ticker = etf['ticker']
        if is_kr:
            dname = display_name(etf, is_kr)
            parts.append(f'<strong>{dname}</strong>')
        else:
            parts.append(f'<strong>{ticker}</strong>')
    etf_str = ',  '.join(parts)
    return (
        f'<p style="font-size:14px;color:#374151;margin:0 0 28px;line-height:1.85;'
        f'background:#f8fafc;border-radius:8px;padding:14px 16px;border:1px solid #e2e8f0;">'
        f'오늘 분석 대상 ETF ({len(etfs)}개): {etf_str}</p>'
    )


def build_blog_html(cat_key, cat_data, cycle_idx, cycle_total):
    etfs = cat_data.get('etfs', [])
    label = CATEGORY_LABELS.get(cat_key, cat_key)
    intro = CATEGORY_INTRO.get(cat_key, '')
    is_kr = cat_data.get('country') == 'KR'
    now = datetime.now(KST)
    date_str = now.strftime('%Y년 %m월 %d일')

    w1_vals = [e.get('returns', {}).get('1W') for e in etfs if e.get('returns', {}).get('1W') is not None]
    avg_1w = sum(w1_vals) / len(w1_vals) if w1_vals else None
    positive = sum(1 for r in w1_vals if r > 0)
    negative = sum(1 for r in w1_vals if r < 0)
    avg_str = fmt_pct(avg_1w) if avg_1w is not None else '-'
    avg_c = ret_color(avg_1w)

    analysis_html = generate_analysis(cat_key, etfs, is_kr)
    etf_list_html = build_etf_list_summary(etfs, is_kr)
    _card_periods = [('1M', '1개월'), ('6M', '6개월'), ('1Y', '1년'), ('3Y', '3년'), ('5Y', '5년')]
    cards_html = (
        '<h2 style="font-size:18px;color:#222;margin:28px 0 12px;border-left:4px solid #6366f1;padding-left:12px;">'
        '🃏 기간별 ETF 핵심 지표 비교</h2>'
        + ''.join(
            build_etf_cards(etfs, is_kr, p, pl) + build_period_insights(etfs, is_kr, p, pl)
            for p, pl in _card_periods
        )
    )
    period_table = build_period_table(etfs, is_kr)

    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{label} ETF 분석 ({date_str})</title>
</head>
<body style="margin:0;padding:20px;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic','Apple SD Gothic Neo',sans-serif;color:#222;line-height:1.7;">
<div style="max-width:820px;margin:0 auto;">

<!-- ===== 티스토리 HTML 편집기에 이 부분부터 붙여넣기 ===== -->

<h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 6px;line-height:1.4;">[오늘의 ETF] {label} 수익률 백테스트 하기</h1>
<p style="font-size:13px;color:#aaa;margin:0 0 24px;">📊 {date_str} · ETF-Hub</p>

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

{etf_list_html}
<h2 style="font-size:18px;color:#222;margin:32px 0 12px;border-left:4px solid #10b981;padding-left:12px;">📝 주간 분석</h2>
<div style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.85;">{analysis_html}</div>

{cards_html}

{period_table}

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

def send_email(html_content, subject, to_addrs, from_addr, app_password, attach_filename='etf_blog.html'):
    """to_addrs: 문자열(단일) 또는 리스트(복수) 모두 지원"""
    if isinstance(to_addrs, str):
        to_addrs = [a.strip() for a in to_addrs.split(',') if a.strip()]
    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = ', '.join(to_addrs)

    # 이메일 본문 (렌더링된 HTML)
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    # HTML 파일 첨부 (티스토리 HTML 편집기 붙여넣기용)
    att = MIMEBase('application', 'octet-stream')
    att.set_payload(html_content.encode('utf-8'))
    encoders.encode_base64(att)
    att.add_header('Content-Disposition', 'attachment', filename=attach_filename)
    msg.attach(att)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(from_addr, app_password)
        server.sendmail(from_addr, to_addrs, msg.as_string())
    print(f"이메일 발송 완료 → {', '.join(to_addrs)}")


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
    subject = f"[오늘의 ETF] {label} 수익률 백테스트 하기"
    filename = f"etf_{now.strftime('%Y%m%d')}_{cat_key.replace('/', '_')}.html"

    send_email(html, subject, notify_email, gmail_user, gmail_password, filename)
    print(f"오늘의 카테고리: {label} ({cycle_idx+1}/{cycle_total})")


if __name__ == '__main__':
    main()
