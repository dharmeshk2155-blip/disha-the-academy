import { Link } from "react-router-dom";
import { quickLinks } from "../data/quickLinks";
import QuickIcon from "./QuickIcon";
import "./QuickLinks.css";

export default function QuickLinks() {
  return (
    <div className="quicklinks-card">
      {quickLinks.map((item) => (
        <Link key={item.id} to={item.to} className="quicklinks-item">
          <div
            className="quicklinks-icon-wrap"
            style={{ backgroundColor: item.bg }}
          >
            <QuickIcon name={item.icon} color={item.color} />
            {item.badge && (
              <span
                className="quicklinks-badge"
                style={{ backgroundColor: item.badgeColor }}
              >
                {item.badge}
              </span>
            )}
          </div>
          <span className="quicklinks-label">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}