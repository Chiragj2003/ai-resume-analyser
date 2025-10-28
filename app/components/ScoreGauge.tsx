import { useEffect, useRef, useState } from "react";

const ScoreGauge = ({ score = 75 }: { score: number }) => {
    const [pathLength, setPathLength] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const pathRef = useRef<SVGPathElement>(null);

    const percentage = score / 100;

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    // Animate score counting
    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * score);
            
            setAnimatedScore(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }, [score]);

    const getGradientColors = () => {
        if (score >= 80) return { start: "#10b981", end: "#34d399" }; // green
        if (score >= 60) return { start: "#3b82f6", end: "#60a5fa" }; // blue
        if (score >= 40) return { start: "#f59e0b", end: "#fbbf24" }; // amber
        return { start: "#ef4444", end: "#f87171" }; // red
    };

    const colors = getGradientColors();

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-24">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <defs>
                        <linearGradient
                            id="gaugeGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop offset="0%" stopColor={colors.start} />
                            <stop offset="100%" stopColor={colors.end} />
                        </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />

                    {/* Foreground arc with animation */}
                    <path
                        ref={pathRef}
                        d="M10,50 A40,40 0 0,1 90,50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={pathLength}
                        strokeDashoffset={pathLength * (1 - percentage)}
                        style={{
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <div className="text-3xl font-bold text-slate-900 pt-4">{animatedScore}<span className="text-xl text-slate-500">/100</span></div>
                </div>
            </div>
        </div>
    );
};

export default ScoreGauge;
