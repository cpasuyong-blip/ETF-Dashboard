import './globals.css'

export const metadata = {
  title: 'ETF Performance Hub',
  description: '미국과 한국 주요 ETF의 실시간 성과 분석과 투자 인사이트',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
