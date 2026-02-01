export default function Waveform({ active }) {
  return (
    <div className="waveform">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`bar ${active ? "animate" : ""}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}