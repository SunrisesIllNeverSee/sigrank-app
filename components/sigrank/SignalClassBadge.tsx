import React from 'react'
import { colors, fonts, radius } from './tokens'
import type { SignalClass } from './types'

interface Props {
  signalClass: SignalClass
  size?: 'sm' | 'md'
  showFull?: boolean
}

const ABBREV: Record<SignalClass, string> = {
  TRANSMITTER: 'Trans',
  'ARCH+': 'Arch+',
  ARCH: 'Arch',
  POWER: 'Power',
  BASE: 'Base',
  SEEKER: 'Seeker',
  REFINER: 'Refiner',
  BEARER: 'Bearer',
  IGNITER: 'Igniter',
}

export function SignalClassBadge({ signalClass, size = 'md', showFull = false }: Props) {
  const color = colors.class[signalClass] ?? colors.text.muted
  const label = showFull ? signalClass : ABBREV[signalClass]

  const style: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: fonts.mono,
    fontSize: size === 'sm' ? '10px' : '11px',
    fontWeight: 600,
    color,
    background: `${color}18`,
    border: `1px solid ${color}40`,
    borderRadius: radius.xs,
    padding: size === 'sm' ? '1px 5px' : '2px 7px',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap' as const,
  }

  return <span style={style}>{label}</span>
}
