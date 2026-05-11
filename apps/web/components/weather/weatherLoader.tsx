'use client';

import { useEffect, useState } from 'react';

const loadingMessages = [
  'Gathering cloud data...',
  'Reading the skies...',
  'Checking wind patterns...',
  'Forecasting your weather...',
];

export default function WeatherLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="weather-loader">
      <div className="sky">
        {/* Rain drops */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className={`raindrop raindrop-${i % 6}`}
            style={{ left: `${5 + i * 5.2}%` }}
          />
        ))}

        {/* Background cloud */}
        <div className="cloud cloud-bg cloud-1">
          <div className="cloud-body" />
          <div className="cloud-bump cloud-bump-1" />
          <div className="cloud-bump cloud-bump-2" />
        </div>

        {/* Main loader cloud */}
        <div className="cloud cloud-main">
          <div className="cloud-body" />
          <div className="cloud-bump cloud-bump-1" />
          <div className="cloud-bump cloud-bump-2" />
          <div className="cloud-bump cloud-bump-3" />
          <div className="shimmer" />
        </div>

        {/* Small accent cloud */}
        <div className="cloud cloud-sm cloud-2">
          <div className="cloud-body" />
          <div className="cloud-bump cloud-bump-1" />
          <div className="cloud-bump cloud-bump-2" />
        </div>

        {/* Pulse ring */}
        <div className="pulse-ring" />
        <div className="pulse-ring pulse-ring-2" />
      </div>

      {/* Loading dots */}
      <div className="dots">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </div>

      <p className="loader-text">{loadingMessages[messageIndex]}</p>

      <style jsx>{`
        .weather-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(180deg, #0f4c81 0%, #1a6db5 45%, #2d8fd4 100%);
          font-family: 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
          z-index: 9999;
        }

        /* Sky atmosphere */
        .sky {
          position: relative;
          width: 240px;
          height: 140px;
          margin-bottom: 24px;
        }

        /* CLOUDS */
        .cloud {
          position: absolute;
          animation: floatCloud linear infinite;
        }

        .cloud-body {
          position: absolute;
          background: #ffffff;
          border-radius: 50px;
        }

        .cloud-bump {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
        }

        /* Main cloud */
        .cloud-main {
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          height: 52px;
          animation: bobMain 3s ease-in-out infinite;
          filter: drop-shadow(0 8px 16px rgba(0, 60, 120, 0.4));
          z-index: 2;
        }

        .cloud-main .cloud-body {
          bottom: 0;
          left: 10px;
          width: 120px;
          height: 36px;
        }

        .cloud-main .cloud-bump-1 {
          width: 52px;
          height: 52px;
          bottom: 20px;
          left: 20px;
        }

        .cloud-main .cloud-bump-2 {
          width: 64px;
          height: 64px;
          bottom: 18px;
          left: 50px;
        }

        .cloud-main .cloud-bump-3 {
          width: 40px;
          height: 40px;
          bottom: 20px;
          left: 90px;
        }

        /* Shimmer on main cloud */
        .shimmer {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 70%
          );
          animation: shimmerPass 2.6s ease-in-out infinite;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes shimmerPass {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(160%);
            opacity: 0;
          }
        }

        /* Background / secondary clouds */
        .cloud-bg {
          z-index: 1;
        }

        .cloud-1 {
          top: 8px;
          left: -10px;
          width: 90px;
          height: 32px;
          opacity: 0.55;
          animation: floatLeft 8s ease-in-out infinite;
        }

        .cloud-1 .cloud-body {
          bottom: 0;
          left: 6px;
          width: 78px;
          height: 22px;
        }

        .cloud-1 .cloud-bump-1 {
          width: 34px;
          height: 34px;
          bottom: 12px;
          left: 10px;
        }

        .cloud-1 .cloud-bump-2 {
          width: 42px;
          height: 42px;
          bottom: 10px;
          left: 36px;
        }

        .cloud-sm {
          z-index: 3;
        }

        .cloud-2 {
          top: 18px;
          right: -8px;
          width: 80px;
          height: 28px;
          opacity: 0.65;
          animation: floatRight 6s ease-in-out infinite;
        }

        .cloud-2 .cloud-body {
          bottom: 0;
          left: 4px;
          width: 70px;
          height: 20px;
        }

        .cloud-2 .cloud-bump-1 {
          width: 30px;
          height: 30px;
          bottom: 10px;
          left: 8px;
        }

        .cloud-2 .cloud-bump-2 {
          width: 38px;
          height: 38px;
          bottom: 8px;
          left: 30px;
        }

        @keyframes bobMain {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(-8px);
          }
        }

        @keyframes floatLeft {
          0%,
          100% {
            transform: translateX(0px) translateY(0px);
          }
          40% {
            transform: translateX(10px) translateY(-5px);
          }
          70% {
            transform: translateX(5px) translateY(3px);
          }
        }

        @keyframes floatRight {
          0%,
          100% {
            transform: translateX(0px) translateY(0px);
          }
          35% {
            transform: translateX(-8px) translateY(-4px);
          }
          65% {
            transform: translateX(-4px) translateY(4px);
          }
        }

        /* RAIN */
        .raindrop {
          position: absolute;
          top: 108px;
          width: 2px;
          height: 10px;
          background: linear-gradient(180deg, rgba(180, 220, 255, 0.9), rgba(100, 180, 255, 0.3));
          border-radius: 2px;
          animation: fall 1.2s linear infinite;
        }

        .raindrop-0 {
          animation-delay: 0s;
          animation-duration: 1.1s;
        }
        .raindrop-1 {
          animation-delay: -0.2s;
          animation-duration: 1.3s;
        }
        .raindrop-2 {
          animation-delay: -0.4s;
          animation-duration: 1s;
        }
        .raindrop-3 {
          animation-delay: -0.6s;
          animation-duration: 1.4s;
        }
        .raindrop-4 {
          animation-delay: -0.8s;
          animation-duration: 1.2s;
        }
        .raindrop-5 {
          animation-delay: -1s;
          animation-duration: 1.05s;
        }

        @keyframes fall {
          0% {
            transform: translateY(0px);
            opacity: 0.8;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(28px);
            opacity: 0;
          }
        }

        /* PULSE RINGS */
        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90px;
          height: 90px;
          border: 2px solid rgba(180, 220, 255, 0.3);
          border-radius: 50%;
          animation: pulse 2.4s ease-out infinite;
          pointer-events: none;
        }

        .pulse-ring-2 {
          animation-delay: 1.2s;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.7);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        /* DOTS */
        .dots {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .dot {
          display: block;
          width: 8px;
          height: 8px;
          background: rgba(180, 220, 255, 0.85);
          border-radius: 50%;
          animation: dotBounce 1.2s ease-in-out infinite;
        }

        .dot-1 {
          animation-delay: 0s;
        }
        .dot-2 {
          animation-delay: 0.2s;
        }
        .dot-3 {
          animation-delay: 0.4s;
        }

        @keyframes dotBounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-7px);
            opacity: 1;
          }
        }

        /* TEXT */
        .loader-text {
          color: rgba(210, 235, 255, 0.9);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          margin: 0;
          text-align: center;
          animation: fadeText 2s ease-in-out;
          min-height: 20px;
        }

        @keyframes fadeText {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
