import { formatearPrecioCOP } from '../lib/formato'

export interface PrecioCOPProps {
  valor: number
  className?: string
}

export function PrecioCOP({ valor, className }: PrecioCOPProps) {
  return <span className={className}>{formatearPrecioCOP(valor)}</span>
}
