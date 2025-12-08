export default function AIAgentButton() {
  return (
    <button className="fixed bottom-8 right-8 w-[68px] h-[68px] rounded-full bg-[#0057FF] flex items-center justify-center shadow-lg hover:bg-[#0046CC] transition-colors">
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="34" cy="34" r="34" fill="#0057FF"/>
        <path d="M29.9524 39.4186L18.0001 33.9859L29.9524 28.5533L33.9961 15L37.8264 28.5533L50.0001 33.9859L37.8264 39.4186L33.9935 53L29.9524 39.4186Z" fill="white"/>
        <g style={{ mixBlendMode: 'overlay' }}>
          <path d="M34.457 8.37695L39.3222 26.3525L59.6581 33.5791L60.9101 34.0244L59.6581 34.4697L39.3222 41.6953L34.4492 59.624L33.9921 61.3057L33.538 59.623L28.6933 41.6953L8.34174 34.4697L7.08881 34.0244L8.34174 33.5791L28.6933 26.3525L33.5449 8.37695L33.9999 6.69043L34.457 8.37695Z" stroke="url(#paint0_linear)" strokeWidth="0.944444"/>
        </g>
        <defs>
          <linearGradient id="paint0_linear" x1="33.9999" y1="8.44334" x2="33.9999" y2="40.6565" gradientUnits="userSpaceOnUse">
            <stop stopColor="white"/>
            <stop offset="1" stopColor="white" stopOpacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </button>
  );
}
