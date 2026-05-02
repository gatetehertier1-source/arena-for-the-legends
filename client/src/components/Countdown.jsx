import { useState, useEffect } from 'react';

export default function Countdown({ targetDate, label = 'Tournament starts in' }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  }

  useEffect(() => {
    if (timeLeft.done) return;
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.done) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <span className="badge badge-live" style={{ fontSize: 13, padding: '6px 14px' }}>
          ● Tournament Live
        </span>
      </div>
    );
  }

  const segments = [
    { val: timeLeft.d, unit: 'Days' },
    { val: timeLeft.h, unit: 'Hrs' },
    { val: timeLeft.m, unit: 'Min' },
    { val: timeLeft.s, unit: 'Sec' },
  ];

  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-cond)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: 'var(--cyan)',
        marginBottom: 10,
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {segments.map(({ val, unit }, i) => (
          <div key={unit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-head)',
                fontSize: 30,
                fontWeight: 700,
                color: 'var(--cyan)',
                background: 'rgba(0,229,255,0.07)',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: 'var(--radius)',
                padding: '6px 14px',
                minWidth: 58,
              }}>
                {String(val).padStart(2, '0')}
              </div>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginTop: 4,
              }}>
                {unit}
              </div>
            </div>
            {i < 3 && (
              <div style={{
                fontFamily: 'var(--font-head)',
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--muted)',
                marginBottom: 18,
              }}>:</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
