import { useState } from "react";
import { FAQ_ITEMS } from "../data/staticContent";
import "./ExtraPages.css";

export default function FAQ() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Frequently Asked Questions</h1>
        <p>Answers to common questions about notes, tests, and payments.</p>
      </div>

      {FAQ_ITEMS.map((item) => (
        <div key={item.id} className="xp-faq-item">
          <button
            className="xp-faq-question"
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
          >
            {item.question}
            <span>{openId === item.id ? "−" : "+"}</span>
          </button>
          {openId === item.id && (
            <div className="xp-faq-answer">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}