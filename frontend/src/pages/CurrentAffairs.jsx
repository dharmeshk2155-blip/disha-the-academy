import { CURRENT_AFFAIRS } from "../data/staticContent";
import "./ExtraPages.css";

export default function CurrentAffairs() {
  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Current Affairs</h1>
        <p>Daily updates relevant to competitive exam preparation.</p>
      </div>

      {CURRENT_AFFAIRS.map((item) => (
        <div key={item.id} className="xp-card">
          <h3>{item.title}</h3>
          <div className="xp-meta-row">
            <span>{item.date}</span>
          </div>
          <p>{item.summary}</p>
        </div>
      ))}
    </div>
  );
}