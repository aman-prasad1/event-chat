import { useState, useEffect, useRef } from "react";
import "./TopLoader.css";

/**
 * NProgress-style top loading bar.
 * On mount: jumps to ~30%, then trickles toward 90%.
 * Has a glowing peg at the leading edge.
 */
const TopLoader = () => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Kick off with an initial jump
    requestAnimationFrame(() => setProgress(30));

    // Trickle — slows down as it gets higher
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(intervalRef.current);
          return prev;
        }
        const inc =
          prev < 50
            ? 4 + Math.random() * 6
            : prev < 80
              ? 1.5 + Math.random() * 3
              : 0.3 + Math.random() * 0.7;
        return Math.min(prev + inc, 90);
      });
    }, 450);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="top-loader" id="top-loader">
      <div
        className="top-loader__bar"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 0.4s ease",
        }}
      >
        <div className="top-loader__peg" />
      </div>
    </div>
  );
};

export default TopLoader;
