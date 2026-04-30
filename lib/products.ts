export type PlanTier = 'standard' | 'premium'
export type PlanType = 'topik1' | 'topik2' | 'eps'

export interface Plan {
  id: string
  name: string
  price: number
  unit: string
  features: string[]
  btn_standard: string
  btn_premium: string
  href: string
  recommended: boolean
  color: string
}

export interface Product {
  type: PlanType
  label: string
  tag: string
  color: string
  standard: Plan
  premium: Plan
}

export const FREE_TRIAL = {
  title: '7일 무료체험 — 카드 등록 없이 시작',
  desc: '모든 과정 유닛 1을 무료로 체험할 수 있습니다.',
  highlight1: '카드 등록 없이 바로 시작',
  highlight2: '실제 학습 체험 후 결제',
  btn: '7일 무료 체험하기 →',
  href: '/free-trial',
}

export const PRODUCTS: Record<PlanType, Product> = {
  topik1: {
    type: 'topik1',
    label: 'TOPIK 1',
    tag: '초급 한국어',
    color: '#27d3c3',
    standard: {
      id: 'topik1-standard',
      name: 'TOPIK 1 Standard',
      price: 12.90,
      unit: '/ 월',
      features: [
        'TOPIK 1 전체 15주제 제공',
        '오늘의 학습 (5단계 학습)',
        '반복학습 프로그램',
        'AI 확장 : 주제당 3회',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=topik1-standard',
      recommended: true,
      color: '#27d3c3',
    },
    premium: {
      id: 'topik1-premium',
      name: 'TOPIK 1 Premium',
      price: 19.90,
      unit: '/ 월',
      features: [
        'Standard 혜택 전체 제공',
        '반복 학습 프로그램',
        'AI 확장 : 주제당 5회',
        '모의고사 1회 + 약점 분석',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=topik1-premium',
      recommended: false,
      color: '#27d3c3',
    },
  },
  topik2: {
    type: 'topik2',
    label: 'TOPIK 2',
    tag: '중·고급 한국어',
    color: '#122c4f',
    standard: {
      id: 'topik2-standard',
      name: 'TOPIK 2 Standard',
      price: 14.90,
      unit: '/ 월',
      features: [
        'TOPIK 2 전체 20주제 제공',
        '오늘의 학습 (5단계 학습)',
        '반복학습 프로그램',
        'AI 확장 : 주제당 3회',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=topik2-standard',
      recommended: true,
      color: '#122c4f',
    },
    premium: {
      id: 'topik2-premium',
      name: 'TOPIK 2 Premium',
      price: 21.90,
      unit: '/ 월',
      features: [
        'Standard 혜택 전체 제공',
        '반복 학습 프로그램',
        'AI 확장 : 주제당 5회',
        '모의고사 1회 + 약점 분석',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=topik2-premium',
      recommended: false,
      color: '#122c4f',
    },
  },
  eps: {
    type: 'eps',
    label: 'EPS-TOPIK',
    tag: '취업 한국어',
    color: '#ff7d5a',
    standard: {
      id: 'eps-standard',
      name: 'EPS-TOPIK Standard',
      price: 13.90,
      unit: '/ 월',
      features: [
        'EPS-TOPIK 전체 20주제 제공',
        '오늘의 학습 (5단계 학습)',
        '반복학습 프로그램',
        'AI 확장 : 주제당 3회',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=eps-standard',
      recommended: true,
      color: '#ff7d5a',
    },
    premium: {
      id: 'eps-premium',
      name: 'EPS-TOPIK Premium',
      price: 20.90,
      unit: '/ 월',
      features: [
        'Standard 혜택 전체 제공',
        '반복 학습 프로그램',
        'AI 확장 : 주제당 5회',
        '모의고사 1회 + 약점 분석',
      ],
      btn_standard: 'Standard 시작하기 →',
      btn_premium: 'Premium으로 시작하기 →',
      href: '/free-trial?plan=eps-premium',
      recommended: false,
      color: '#ff7d5a',
    },
  },
}

export const PRODUCT_LIST: PlanType[] = ['topik1', 'topik2', 'eps']

export const LANGUAGES = {
  topik1: ['VN 베트남어', 'EN 영어', 'CN 중국어'],
  topik2: ['VN 베트남어', 'EN 영어', 'CN 중국어'],
  eps: ['VN 베트남어', 'ID 인도네시아어', 'TH 태국어'],
}
