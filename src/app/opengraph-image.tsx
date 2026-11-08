import { ImageResponse } from 'next/og';

export const alt = 'Анимо — каталог аниме, трекер серий и календарь релизов';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0c0a14',
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.25), transparent 70%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.2), transparent 60%)',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
            }}
          >
            ✨
          </div>
          <span
            style={{
              fontSize: '52px',
              fontWeight: '900',
              letterSpacing: '-1px',
              background: 'linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            АНИМО
          </span>
        </div>

        <h1
          style={{
            fontSize: '44px',
            fontWeight: '800',
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: '960px',
            margin: '0 0 20px 0',
          }}
        >
          Каталог аниме, трекер серий и календарь релизов
        </h1>

        <p
          style={{
            fontSize: '22px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '780px',
            margin: '0 0 40px 0',
            lineHeight: 1.5,
          }}
        >
          38 000+ тайтлов, точное расписание онгоингов, официальные источники без пиратства и рекламы.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            🔥 500+ онгоингов
          </div>
          <div
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            🛡️ Без 18+ контента
          </div>
          <div
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#f472b6',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            ⚡ Личный трекер серий
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
