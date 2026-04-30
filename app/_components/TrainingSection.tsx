'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'
import { PTS, PATH_LEFT, PATH_RIGHT } from './philoPaths'

const DURATION = 16000

export default function TrainingSection() {
  const { t } = useTranslation()
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [inSession, setInSession] = useState(true)

  const headGlowRef = useRef<SVGCircleElement | null>(null)
  const headOuterRef = useRef<SVGCircleElement | null>(null)
  const headInnerRef = useRef<SVGCircleElement | null>(null)

  const playingRef = useRef(playing)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    let raf = 0
    let last: number | null = null
    let tNorm = 0
    const total = PTS.length - 1

    const move = (ts: number) => {
      if (last == null) last = ts
      if (playingRef.current) {
        tNorm = (tNorm + (ts - last) / DURATION) % 1
      }
      last = ts
      const idx = Math.floor(tNorm * total)
      const [x, y] = PTS[idx]
      const sessionNow = idx > total / 2
      const color = sessionNow ? '#5b8def' : '#0ba88f'
      const glow = sessionNow ? '#7ab0ff' : '#7af0d6'
      const hg = headGlowRef.current
      const ho = headOuterRef.current
      const hi = headInnerRef.current
      if (hg && ho && hi) {
        hg.setAttribute('cx', String(x))
        hg.setAttribute('cy', String(y))
        ho.setAttribute('cx', String(x))
        ho.setAttribute('cy', String(y))
        hi.setAttribute('cx', String(x))
        hi.setAttribute('cy', String(y))
        hi.setAttribute('fill', color)
        hg.setAttribute('fill', glow)
      }
      setProgress(tNorm * 100)
      setInSession(sessionNow)
      raf = requestAnimationFrame(move)
    }
    raf = requestAnimationFrame(move)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section className="training" id="process">
      <div className="training-glow" />
      <div className="training-inner">
        <div className="training-head">
          <div className="training-eyebrow">{t('training.eyebrow')}</div>
          <h2 className="training-title">하나의 주제로, 두 번 반복합니다.</h2>
          <p className="training-desc">
            같은 상황을 오늘의 학습 5단계로 익히고, 같은 주제를 확장 학습 4단계로 다시 사용해서 시험 문제와 실전 표현까지 연결합니다.
          </p>
        </div>

        <div className="process-stage">
          <div className="philo-stage">
            <div className="philo-tag philo-tag-left">
              <strong>1차 반복 · 세션</strong>
              <span>입에 붙는 단계</span>
            </div>
            <div className="philo-tag philo-tag-right">
              <strong>2차 반복 · 확장</strong>
              <span>시험에 나오는 단계</span>
            </div>

            <svg viewBox="0 0 980 460" className="proc-philo-svg" aria-hidden="true">
              <defs>
                <linearGradient id="t-blue-shadow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a1e5e" />
                  <stop offset="100%" stopColor="#102580" />
                </linearGradient>
                <linearGradient id="t-blue-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e4fc8" />
                  <stop offset="40%" stopColor="#2e62e8" />
                  <stop offset="100%" stopColor="#1a3db0" />
                </linearGradient>
                <linearGradient id="t-blue-mid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a80f0" />
                  <stop offset="100%" stopColor="#2a55d0" />
                </linearGradient>
                <linearGradient id="t-blue-hi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#88bbff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#4488dd" stopOpacity="0.2" />
                </linearGradient>

                <linearGradient id="t-mint-shadow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#054035" />
                  <stop offset="100%" stopColor="#076055" />
                </linearGradient>
                <linearGradient id="t-mint-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#08c0a0" />
                  <stop offset="40%" stopColor="#0dd8b8" />
                  <stop offset="100%" stopColor="#08a88c" />
                </linearGradient>
                <linearGradient id="t-mint-mid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#30e0c4" />
                  <stop offset="100%" stopColor="#10b898" />
                </linearGradient>
                <linearGradient id="t-mint-hi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#90f8e4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#30d0b0" stopOpacity="0.2" />
                </linearGradient>

                <linearGradient id="pg-fb" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#88bbff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#bbddff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#88bbff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="pg-fm" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#45e0c2" stopOpacity="0" />
                  <stop offset="50%" stopColor="#9df5e4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#45e0c2" stopOpacity="0" />
                </linearGradient>

                <radialGradient id="pg-core" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#7af0d6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#45e0c2" stopOpacity="0" />
                </radialGradient>

                <filter id="pg-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Outer shadows */}
              <path d={PATH_RIGHT} fill="none" stroke="url(#t-mint-shadow)" strokeWidth="42" strokeLinecap="round" opacity="0.7" />
              <path d={PATH_LEFT} fill="none" stroke="url(#t-blue-shadow)" strokeWidth="42" strokeLinecap="round" opacity="0.7" />

              {/* Mint tube */}
              <path d={PATH_RIGHT} fill="none" stroke="url(#t-mint-body)" strokeWidth="34" strokeLinecap="round" />
              <path d={PATH_RIGHT} fill="none" stroke="url(#t-mint-mid)" strokeWidth="24" strokeLinecap="round" />
              <path d={PATH_RIGHT} fill="none" stroke="url(#t-mint-hi)" strokeWidth="10" strokeLinecap="round" />

              {/* Blue tube */}
              <path d={PATH_LEFT} fill="none" stroke="url(#t-blue-body)" strokeWidth="34" strokeLinecap="round" />
              <path d={PATH_LEFT} fill="none" stroke="url(#t-blue-mid)" strokeWidth="24" strokeLinecap="round" />
              <path d={PATH_LEFT} fill="none" stroke="url(#t-blue-hi)" strokeWidth="10" strokeLinecap="round" />

              {/* Flow animation */}
              <path className="philo-flow" d={PATH_LEFT} fill="none" stroke="url(#pg-fb)" strokeWidth="8" strokeDasharray="70 300" style={{ animationDuration: '3.5s' }} />
              <path className="philo-flow" d={PATH_RIGHT} fill="none" stroke="url(#pg-fm)" strokeWidth="8" strokeDasharray="70 300" style={{ animationDuration: '2.8s' }} />

              {/* Session nodes (blue / left) */}
              <g>
                <circle cx="394.2" cy="269.4" r="30" fill="#5b8def" opacity="0.15" />
                <circle cx="394.2" cy="269.4" r="24" fill="#fff" stroke="#5b8def" strokeWidth="2.5" />
                <text x="394.2" y="268.4" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">보기</text>
                <text x="394.2" y="280.4" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">상황 노출</text>

                <circle cx="239.2" cy="298.7" r="30" fill="#5b8def" opacity="0.15" />
                <circle cx="239.2" cy="298.7" r="24" fill="#fff" stroke="#5b8def" strokeWidth="2.5" />
                <text x="239.2" y="297.7" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">빈칸</text>
                <text x="239.2" y="309.7" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">능동 인출</text>

                <circle cx="180.0" cy="222.0" r="30" fill="#5b8def" opacity="0.15" />
                <circle cx="180.0" cy="222.0" r="24" fill="#fff" stroke="#5b8def" strokeWidth="2.5" />
                <text x="180.0" y="221.0" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">말하기</text>
                <text x="180.0" y="233.0" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">문장 훈련</text>

                <circle cx="239.2" cy="145.3" r="30" fill="#5b8def" opacity="0.15" />
                <circle cx="239.2" cy="145.3" r="24" fill="#fff" stroke="#5b8def" strokeWidth="2.5" />
                <text x="239.2" y="144.3" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">단어</text>
                <text x="239.2" y="156.3" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">어휘 확인</text>

                <circle cx="394.2" cy="174.6" r="30" fill="#5b8def" opacity="0.15" />
                <circle cx="394.2" cy="174.6" r="24" fill="#fff" stroke="#5b8def" strokeWidth="2.5" />
                <text x="394.2" y="173.6" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">복습</text>
                <text x="394.2" y="185.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">반복 정리</text>
              </g>

              {/* Extension nodes (mint / right) */}
              <g>
                <circle cx="608.6" cy="279.0" r="30" fill="#45e0c2" opacity="0.15" />
                <circle cx="608.6" cy="279.0" r="24" fill="#fff" stroke="#0ba88f" strokeWidth="2.5" />
                <text x="608.6" y="278.0" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">단어</text>
                <text x="608.6" y="290.0" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">시험 어휘</text>

                <circle cx="776.4" cy="279.0" r="30" fill="#45e0c2" opacity="0.15" />
                <circle cx="776.4" cy="279.0" r="24" fill="#fff" stroke="#0ba88f" strokeWidth="2.5" />
                <text x="776.4" y="278.0" textAnchor="middle" fontSize="11.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">표현</text>
                <text x="776.4" y="290.0" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">패턴 변환</text>

                <circle cx="776.4" cy="165.0" r="30" fill="#45e0c2" opacity="0.15" />
                <circle cx="776.4" cy="165.0" r="24" fill="#fff" stroke="#0ba88f" strokeWidth="2.5" />
                <text x="776.4" y="164.0" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">테스트</text>
                <text x="776.4" y="176.0" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">시험형 풀이</text>

                <circle cx="608.6" cy="165.0" r="30" fill="#45e0c2" opacity="0.15" />
                <circle cx="608.6" cy="165.0" r="24" fill="#fff" stroke="#0ba88f" strokeWidth="2.5" />
                <text x="608.6" y="164.0" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#0f2437" letterSpacing="-0.03em">AI 확장</text>
                <text x="608.6" y="176.0" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#667085">응용 대응</text>
              </g>

              {/* Centre core */}
              <g transform="translate(490,222)">
                <circle r="56" fill="url(#pg-core)" className="philo-pulse" />
                <circle r="40" fill="#0b1e38" stroke="#45e0c2" strokeWidth="3" />
                <circle r="34" fill="none" stroke="rgba(69,224,194,0.25)" strokeWidth="1" />
                <text y="-3" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7af0d6" letterSpacing="0.05em">한 주제</text>
                <text y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.55)" letterSpacing="0.1em">ONE TOPIC</text>
              </g>

              {/* Progress head */}
              <circle ref={headGlowRef} cx="490" cy="222" r="22" fill="#7af0d6" opacity="0.45" filter="url(#pg-glow)" />
              <circle ref={headOuterRef} cx="490" cy="222" r="12" fill="#fff" />
              <circle ref={headInnerRef} cx="490" cy="222" r="6" fill="#0ba88f" />
            </svg>
          </div>

          <div className="proc-controls">
            <button
              type="button"
              className="play-btn"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? t('training.pause') : t('training.play')}
            </button>
            <div className="proc-progress">
              <div className="proc-progress-track">
                <div className="proc-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{inSession ? t('training.session_label') : t('training.ext_label')}</span>
            </div>
          </div>
        </div>

        <div className="example-strip">
          <div className="example-label">
            <span className="ex-eyebrow">{t('training.example_label')}</span>
            <strong>{t('training.example_title')}</strong>
          </div>
          <p>{t('training.example_desc')}</p>
        </div>
      </div>

      <style jsx>{`
        .training {
          background: #122c4f;
          color: #fff;
          position: relative;
          overflow: hidden;
          margin: 0;
        }
        .training-glow {
          position: absolute;
          top: -160px;
          left: -160px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(39, 211, 195, 0.22), transparent 70%);
          pointer-events: none;
        }
        .training-inner {
          padding: 80px 80px;
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .training-eyebrow {
          color: #27d3c3;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .training-title {
          font-size: clamp(28px, 3.5vw, 44px);
          font-weight: 900;
          color: white;
          line-height: 1.25;
          letter-spacing: -0.04em;
          margin: 12px 0 16px;
          font-family: Arial, "Noto Sans KR", sans-serif;
        }
        .training-desc {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.7;
          max-width: 600px;
          margin: 0 0 36px;
        }
        .process-stage {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 22px;
          padding: 36px;
          margin-top: 44px;
          backdrop-filter: blur(8px);
        }
        .philo-stage {
          position: relative;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 24px 16px 8px;
        }
        .philo-tag {
          position: absolute;
          top: 18px;
          z-index: 2;
          padding: 8px 14px;
          border-radius: 999px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          line-height: 1.15;
        }
        .philo-tag strong {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .philo-tag span {
          font-size: 10.5px;
          font-weight: 700;
          opacity: 0.85;
          white-space: nowrap;
        }
        .philo-tag-left {
          left: 22px;
          background: #0f2437;
          border: 1px solid #5b8def;
          color: #7ab0ff;
        }
        .philo-tag-right {
          right: 22px;
          background: #0ba88f;
          color: #fff;
        }
        .proc-philo-svg {
          width: 100%;
          height: auto;
          display: block;
          max-height: 480px;
        }
        .proc-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }
        .play-btn {
          padding: 10px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: background 0.15s;
          cursor: pointer;
          font-family: inherit;
        }
        .play-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }
        .proc-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .proc-progress-track {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          overflow: hidden;
        }
        .proc-progress-fill {
          height: 100%;
          background: #27d3c3;
          border-radius: 999px;
          transition: width 0.1s linear;
        }
        .proc-progress span {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 700;
          white-space: nowrap;
        }

        .example-strip {
          margin-top: 36px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 36px;
          align-items: center;
          padding: 24px 28px;
          background: rgba(39, 211, 195, 0.08);
          border: 1px solid rgba(39, 211, 195, 0.22);
          border-radius: 22px;
        }
        .example-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ex-eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          color: #27d3c3;
          text-transform: uppercase;
        }
        .example-label strong {
          font-size: 22px;
          letter-spacing: -0.04em;
          font-weight: 900;
          white-space: nowrap;
        }
        .example-strip p {
          margin: 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 15px;
          line-height: 1.55;
        }

        :global(.philo-flow) {
          animation-name: philoFlow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        :global(.philo-pulse) {
          animation: philoPulse 2.4s ease-in-out infinite;
          transform-origin: 0 0;
        }
        @keyframes philoFlow {
          to {
            stroke-dashoffset: -300;
          }
        }
        @keyframes philoPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.85;
          }
        }

        @media (max-width: 768px) {
          .training-inner {
            padding: 60px 20px;
          }
          .process-stage {
            padding: 20px;
          }
          .philo-stage {
            overflow-x: auto;
          }
          .philo-tag {
            position: static;
            display: inline-flex;
            margin-bottom: 8px;
          }
          .example-strip {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      `}</style>
    </section>
  )
}
