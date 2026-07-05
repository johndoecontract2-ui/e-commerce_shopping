export default function Stars({ value = 0, count, size = 15 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < full;
        const isHalf = i === full && half;
        return (
          <span key={i} className={`star ${filled ? "is-full" : isHalf ? "is-half" : ""}`}>
            ★
          </span>
        );
      })}
      {typeof count === "number" && <span className="stars__count">({count})</span>}
    </span>
  );
}
