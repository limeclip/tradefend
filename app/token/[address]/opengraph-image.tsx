import { ImageResponse } from 'next/og';
import {
  getPublicTokenPageData,
  PublicTokenNotFoundError,
} from '@/lib/token-cache/get-public-report';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';


type Props = {
  params: Promise<{ address: string }>;
};

function riskColor(level: string): string {
  if (level === 'LOW') return '#059669';
  if (level === 'MEDIUM') return '#d97706';
  return '#dc2626';
}

export default async function OgImage({ params }: Props) {
  const { address } = await params;

  let ticker = 'Token';
  let riskLevel = '—';
  let overall = '—';

  try {
    const { report } = await getPublicTokenPageData(address);
    ticker = report.ticker ?? report.name ?? 'Token';
    riskLevel = report.riskLevel ?? '—';
    overall = String(report.scores?.overall ?? '—');
  } catch (err) {
    if (!(err instanceof PublicTokenNotFoundError)) {
      console.error(err);
    }
    // Если произошла другая ошибка, всё равно продолжаем с дефолтными значениями
  }

  const accent = riskColor(riskLevel);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#ffffff',
          color: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Верхняя часть: логотип и название токена */}
        <div
          style={{
            display: 'flex', // <--- ДОБАВЛЯЕМ ОБЯЗАТЕЛЬНЫЙ DISPLAY: FLEX
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>Tradefend</div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em' }}>{ticker}</div>
          <div style={{ fontSize: 28, color: '#525252' }}>Risk report</div>
        </div>

        {/* Нижняя часть: скоре и лейбл риска */}
        <div
          style={{
            display: 'flex', // <--- ДОБАВЛЯЕМ DISPLAY: FLEX
            alignItems: 'flex-end',
            gap: 48,
          }}
        >
          <div
            style={{
              display: 'flex', // <--- ДОБАВЛЯЕМ DISPLAY: FLEX
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 22, color: '#737373' }}>Overall score</div>
            <div style={{ fontSize: 96, fontWeight: 700, color: accent, lineHeight: 1 }}>
              {overall}
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: accent,
              padding: '16px 32px',
              borderRadius: 999,
              border: `3px solid ${accent}`,
              display: 'flex', // <--- ДОБАВЛЯЕМ DISPLAY: FLEX
            }}
          >
            {riskLevel} risk
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}