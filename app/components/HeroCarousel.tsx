'use client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Logo1, Logo2, Logo3, Logo4, Logo5, Logo6 } from './icons/CarouselLogos';

const LogoComponent = ({ index }: { index: number }) => {
  const logos = [Logo1, Logo2, Logo3, Logo4, Logo5, Logo6];
  const LogoToRender = logos[index % logos.length];
  return <LogoToRender />;
};

const HeroCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="mx-auto mt-16 w-full max-w-[960px] overflow-hidden">
      <motion.div
        className="flex items-center justify-center gap-16 px-4 md:gap-24"
        animate={{
          x: [0, '-100%'],
        }}
        transition={{
          duration: 25,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        {/* First set of logos */}
        {[...Array(8)].map((_, index) => (
          <div
            key={`set1-${index}`}
            className="flex h-12 flex-shrink-0 items-center justify-center"
          >
            <LogoComponent index={index} />
          </div>
        ))}
        {/* Second set of logos (duplicate) */}
        {[...Array(8)].map((_, index) => (
          <div
            key={`set2-${index}`}
            className="flex h-12 flex-shrink-0 items-center justify-center"
          >
            <LogoComponent index={index} />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroCarousel;
