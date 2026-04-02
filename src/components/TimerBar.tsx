interface TimerBarProps {
  secondsLeft: number;
  totalSeconds: number;
}

export function TimerBar({ secondsLeft, totalSeconds }: TimerBarProps) {
  const pct = (secondsLeft / totalSeconds) * 100;
  const urgent = secondsLeft <= 10;
  const warning = secondsLeft <= 20;

  const barColor = urgent
    ? "#e17055"
    : warning
      ? "#fdcb6e"
      : "#00b894";

  return (
    <div className={`timer-bar ${urgent ? "timer-urgent" : ""}`}>
      <div className="timer-track">
        <div
          className="timer-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className={`timer-text ${urgent ? "timer-pulse" : ""}`}>
        {secondsLeft}s
      </span>
    </div>
  );
}
