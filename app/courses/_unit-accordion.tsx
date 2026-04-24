'use client';

import { useState } from 'react';

export type Unit = {
  number: number;
  emoji: string;
  title: string;
  badge: string;
  expressions: string[];
  result: string;
  locked?: boolean;
};

export type Phase = {
  number: number;
  title: string;
  range: string;
  units: Unit[];
};

type Props = {
  phases: Phase[];
};

const CARD_STYLE = {
  background: '#ffffff',
  borderRadius: 22,
  boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
  padding: 24,
} as const;

export function UnitAccordion({ phases }: Props) {
  const [openPhases, setOpenPhases] = useState<Set<number>>(new Set([1]));

  const toggle = (n: number) => {
    const next = new Set(openPhases);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    setOpenPhases(next);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .ua-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            @media (max-width: 1024px) { .ua-grid { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 768px) { .ua-grid { grid-template-columns: 1fr; } }
          `,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {phases.map((phase) => {
          const isOpen = openPhases.has(phase.number);
          return (
            <div key={phase.number}>
              <button
                type="button"
                onClick={() => toggle(phase.number)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  background: '#122c4f',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 22,
                  padding: '22px 26px',
                  boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#27d3c3',
                      letterSpacing: '0.6px',
                      marginBottom: 4,
                    }}
                  >
                    PHASE {phase.number}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {phase.title}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#27d3c3',
                      background: 'rgba(39,211,195,0.15)',
                      padding: '6px 12px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {phase.range}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      fontSize: 14,
                      color: '#ffffff',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ▾
                  </span>
                </div>
              </button>
              {isOpen && (
                <div className="ua-grid" style={{ marginTop: 14 }}>
                  {phase.units.map((unit) => (
                    <UnitCard key={unit.number} unit={unit} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function UnitCard({ unit }: { unit: Unit }) {
  const locked = !!unit.locked;
  return (
    <article
      style={{
        ...CARD_STYLE,
        opacity: locked ? 0.55 : 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: '#e0f7f4',
            display: 'grid',
            placeItems: 'center',
            fontSize: 22,
          }}
        >
          {unit.emoji}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
          {unit.number}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h4
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#0f172a',
            letterSpacing: '-0.2px',
            margin: 0,
          }}
        >
          {unit.title}
        </h4>
        {locked ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
              background: '#f1f5f9',
              padding: '5px 10px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            준비 중
          </span>
        ) : (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#0b8178',
              background: '#e0f7f4',
              padding: '6px 10px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            {unit.badge}
          </span>
        )}
      </div>
      {!locked && unit.expressions.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 14px',
            display: 'grid',
            gap: 6,
          }}
        >
          {unit.expressions.map((e, i) => (
            <li
              key={i}
              style={{
                fontSize: 14,
                color: '#334155',
                position: 'relative',
                paddingLeft: 18,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  color: '#27d3c3',
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              {e}
            </li>
          ))}
        </ul>
      )}
      <div
        style={{
          marginTop: 'auto',
          fontSize: 14,
          color: '#64748b',
          fontWeight: 500,
        }}
      >
        {unit.result}
      </div>
    </article>
  );
}
