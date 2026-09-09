const paths = {
  play: <path d="M8 5v14l11-7z" />,
  clipboard: (
    <path d="M9 2h6a1 1 0 011 1v1h2a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h2V3a1 1 0 011-1zm0 2v1h6V4H9zM8 11h8v2H8v-2zm0 4h5v2H8v-2z" />
  ),
  help: (
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.9 15h-1.8v-1.8h1.8V17zm1.86-6.9c-.45.63-.88 1-1.14 1.5-.2.38-.28.63-.28 1.4h-1.7c0-.9.1-1.42.4-1.95.3-.53.75-.9 1.15-1.35.4-.4.65-.75.65-1.3 0-.75-.6-1.2-1.4-1.2-.85 0-1.5.5-1.5 1.5H8.4c0-1.85 1.4-3 3.4-3 1.9 0 3.3 1.1 3.3 2.8 0 .9-.4 1.5-1.34 2.5z" />
  ),
  file: (
    <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM8 13h8v2H8v-2zm0 4h5v2H8v-2z" />
  ),
  history: (
    <path d="M13 3a9 9 0 100 18 9 9 0 000-18zm0 2a7 7 0 110 14 7 7 0 010-14zM5.3 6.3L3.9 4.9 2 6.8l1.4 1.4a9.1 9.1 0 011.9-1.9zM12 7v6l5 3-.8 1.6-5.7-3.4V7H12z" />
  ),
  newspaper: (
    <path d="M4 4h13a2 2 0 012 2v13a1 1 0 01-1 1H6a2 2 0 01-2-2V4zm2 3v2h9V7H6zm0 4v2h9v-2H6zm0 4v2h6v-2H6z" />
  ),
};

export default function QuickIcon({ name, color, size = 26 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}