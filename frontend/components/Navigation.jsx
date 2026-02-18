'use client'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '대시보드' },
    { href: '/backtest', label: '수익률 데이터' },
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      background: 'rgba(15, 15, 30, 0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ fontWeight: '800', color: '#fff', fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        <span style={{ color: '#8b5cf6' }}>ETF</span> Hub
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {links.map(({ href, label }) => {
          const active = pathname === href
          return (
            <a
              key={href}
              href={href}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '10px',
                color: active ? '#fff' : '#94a3b8',
                fontWeight: active ? '700' : '500',
                textDecoration: 'none',
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                background: active ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#94a3b8' }}
            >
              {label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
