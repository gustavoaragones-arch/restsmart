interface RecoveryGaugeProps {
  score: number
}

export function RecoveryGauge({ score }: RecoveryGaugeProps) {
  return <div data-score={score}>RecoveryGauge placeholder</div>
}
