'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Since steps is defined inside the component, let's move it outside
// to prevent unnecessary re-renders
const STEPS = [
  {
    title: 'Create Fund',
    description: 'Fund manager creates and configures a new fund with whitelisted assets',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={active ? 'rgb(37,202,172)' : 'white'}
        strokeWidth="1.5"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: 'Stream USDCx',
    description: 'Users deposit funds via Superfluid streaming protocol',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? 'rgb(37,202,172)' : 'white'}
        strokeWidth="1.5"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Trade Assets',
    description: 'Fund manager trades whitelisted assets to generate returns',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? 'rgb(37,202,172)' : 'white'}
        strokeWidth="1.5"
      >
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
  },
  {
    title: 'Stream Earnings',
    description: 'Profits are automatically streamed back to users via Superfluid',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? 'rgb(37,202,172)' : 'white'}
        strokeWidth="1.5"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
] as const;

const ProcessSteps = () => {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [windowWidth, setWindowWidth] = useState(0);

  // Use the constant steps array
  const steps = STEPS;

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-play through steps
  useEffect(() => {
    if (!isAutoPlaying || !mounted) return;
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, mounted, steps.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Return null or loading state before client-side hydration
  if (!mounted) {
    return (
      <div className="w-full px-4">
        <h2 className="mb-6 text-center text-[40px] font-medium">How It Works</h2>
        <div className="flex h-[600px] items-center justify-center">
          {/* Optional loading state */}
        </div>
      </div>
    );
  }

  // Update the path coordinates to be responsive
  const getResponsiveCoordinates = (width: number) => {
    const isMobile = width < 768;
    const isSmallMobile = width < 380; // For iPhone SE and similar

    const centerX = 400;
    const radius = isMobile ? (isSmallMobile ? 100 : 130) : 150;
    const verticalSpacing = isMobile ? (isSmallMobile ? 80 : 120) : 150;

    return {
      start: { x: centerX, y: 250 },
      points: [
        { x: centerX - radius, y: 250 },
        { x: centerX, y: 250 - verticalSpacing },
        { x: centerX + radius, y: 250 },
        { x: centerX, y: 250 + verticalSpacing },
      ],
    };
  };

  // Get responsive coordinates
  const pathCoordinates = getResponsiveCoordinates(windowWidth);

  // Create the path string for the circuit
  const createCircuitPath = () => {
    const { points } = pathCoordinates;
    return `
      M ${points[0].x} ${points[0].y}
      C ${points[0].x + 100} ${points[0].y},
        ${points[1].x - 100} ${points[1].y},
        ${points[1].x} ${points[1].y}
      C ${points[1].x + 100} ${points[1].y},
        ${points[2].x - 100} ${points[2].y},
        ${points[2].x} ${points[2].y}
      C ${points[2].x - 100} ${points[2].y},
        ${points[3].x + 100} ${points[3].y},
        ${points[3].x} ${points[3].y}
      C ${points[3].x - 100} ${points[3].y},
        ${points[0].x + 100} ${points[0].y},
        ${points[0].x} ${points[0].y}
    `;
  };

  // Add this helper function to calculate position along the path
  const getPointAlongPath = (progress: number) => {
    const path = createCircuitPath();
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', path);
    const length = svgPath.getTotalLength();
    const point = svgPath.getPointAtLength(length * progress);
    return { x: point.x, y: point.y };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-hidden px-2 sm:px-4"
    >
      <h2 className="mb-4 text-center text-[28px] font-medium sm:mb-6 sm:text-[32px] md:text-[40px]">
        How It Works
      </h2>

      {/* Step Description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mb-6 w-full max-w-[400px] px-2 text-center sm:mb-8 sm:px-4 md:mb-12"
        >
          <motion.h3
            className="mb-2 text-lg font-medium text-fluid-primary sm:text-xl md:mb-3 md:text-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {steps[activeStep].title}
          </motion.h3>
          <motion.p
            className="mx-auto text-center text-sm text-fluid-white-70 sm:text-base md:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            {steps[activeStep].description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Interactive Flow Diagram */}
      <div className="group relative mx-auto h-[350px] w-full max-w-[800px] sm:h-[400px] md:h-[500px]">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-fluid-primary/5 to-transparent" />

        <svg className="h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="rgb(37,202,172)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="rgb(37,202,172)" stopOpacity="0" />
            </radialGradient>

            {/* Add animated streaming particles */}
            <motion.circle id="streamParticle" r="3" fill="rgb(37,202,172)" />

            {/* Add animated gradient for the flow line */}
            <linearGradient id="streamingGradient" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(37,202,172,0.1)" />
              <stop offset="50%" stopColor="rgb(37,202,172)" />
              <stop offset="100%" stopColor="rgba(37,202,172,0.1)" />
              <animate attributeName="x1" values="0%;100%" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="x2" values="100%;200%" dur="1.5s" repeatCount="indefinite" />
            </linearGradient>

            {/* Add flowing gradient effect */}
            <linearGradient id="flowingGradient" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(37,202,172,0)">
                <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="rgba(37,202,172,0.3)">
                <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="rgba(37,202,172,0)">
                <animate attributeName="offset" values="1;3" dur="2s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          {/* Circuit Background Path */}
          <path
            d={createCircuitPath()}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            fill="none"
          />

          {/* Animated Progress */}
          <motion.path
            d={createCircuitPath()}
            stroke="url(#flowingGradient)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: (activeStep + 1) / steps.length,
              opacity: 1,
            }}
            transition={{
              pathLength: {
                duration: 0.8,
                ease: 'easeInOut',
              },
              opacity: {
                duration: 0.3,
              },
            }}
          />

          {/* Streaming Particles */}
          {mounted &&
            [...Array(12)].map((_, i) => {
              const progress = i / 12;
              const initialPoint = getPointAlongPath(progress);

              return (
                <motion.circle
                  key={i}
                  cx={initialPoint.x}
                  cy={initialPoint.y}
                  r="2"
                  fill="rgb(37,202,172)"
                  filter="url(#glow)"
                  animate={{
                    pathOffset: [progress, 1],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    pathOffset: {
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    opacity: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                  }}
                  style={{
                    offsetPath: `path("${createCircuitPath()}")`,
                    offsetRotate: '0deg',
                  }}
                />
              );
            })}

          {/* Step Nodes */}
          {steps.map((step, index) => {
            const point = pathCoordinates.points[index];
            const isActive = activeStep === index;
            const isPast = index < activeStep;

            return (
              <g
                key={index}
                className="cursor-pointer"
                onClick={() => {
                  setActiveStep(index);
                  setIsAutoPlaying(false);
                }}
              >
                {/* Node Background Glow */}
                {isActive && (
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={50}
                    fill="url(#glow)"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0.3 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                )}

                {/* Main Node */}
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r={windowWidth < 380 ? 30 : windowWidth < 768 ? 35 : 40}
                  fill={
                    isActive
                      ? 'rgba(37,202,172,0.15)'
                      : isPast
                        ? 'rgba(37,202,172,0.1)'
                        : 'rgba(255,255,255,0.05)'
                  }
                  stroke={
                    isActive
                      ? 'rgb(37,202,172)'
                      : isPast
                        ? 'rgba(37,202,172,0.5)'
                        : 'rgba(255,255,255,0.2)'
                  }
                  strokeWidth="2"
                  whileHover={{ scale: 1.05 }}
                />

                {/* Icon */}
                <foreignObject
                  x={point.x - (windowWidth < 380 ? 15 : 20)}
                  y={point.y - (windowWidth < 380 ? 15 : 20)}
                  width={windowWidth < 380 ? 30 : 40}
                  height={windowWidth < 380 ? 30 : 40}
                >
                  <div className="flex scale-75 items-center justify-center sm:scale-90 md:scale-100">
                    {step.icon(isActive || isPast)}
                  </div>
                </foreignObject>

                {/* Step Label */}
                <motion.text
                  x={point.x}
                  y={point.y + (windowWidth < 380 ? 40 : windowWidth < 768 ? 45 : 60)}
                  textAnchor="middle"
                  fill={isActive ? 'rgb(37,202,172)' : 'white'}
                  className="text-[9px] font-medium sm:text-[10px] md:text-sm"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                >
                  {step.title}
                </motion.text>

                {/* Step Number */}
                <motion.text
                  x={point.x}
                  y={point.y - (windowWidth < 380 ? 30 : windowWidth < 768 ? 35 : 50)}
                  textAnchor="middle"
                  fill={isActive ? 'rgb(37,202,172)' : 'white'}
                  className="text-[8px] font-medium sm:text-[10px] md:text-xs"
                >
                  Step {index + 1}
                </motion.text>
              </g>
            );
          })}

          {/* Add subtle connecting lines between active nodes */}
          {steps.map((_, index) => {
            if (index === activeStep || (index === steps.length - 1 && activeStep === 0)) {
              const currentPoint = pathCoordinates.points[index];
              const nextPoint = pathCoordinates.points[(index + 1) % steps.length];

              return (
                <motion.line
                  key={`connection-${index}`}
                  x1={currentPoint.x}
                  y1={currentPoint.y}
                  x2={nextPoint.x}
                  y2={nextPoint.y}
                  stroke="rgba(37,202,172,0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              );
            }
            return null;
          })}
        </svg>

        {/* Make play/pause button responsive */}
        <motion.button
          className="absolute bottom-1 right-1 rounded-full bg-fluid-white-6 p-1 transition-colors hover:bg-fluid-white-10 sm:bottom-2 sm:right-2 sm:p-1.5 md:bottom-4 md:right-4 md:p-2"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAutoPlaying ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="sm:h-5 sm:w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="sm:h-5 sm:w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProcessSteps;
