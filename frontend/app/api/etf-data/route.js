import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'etf_database.json')
    const raw = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'ETF 데이터를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}
