'use client'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Logo1, Logo2, Logo3 } from './icons/CarouselLogos'

const LogoComponent = ({ index }: { index: number }) => {
  const logos = [Logo1, Logo2, Logo3]
  const LogoToRender = logos[index % logos.length]
  return <LogoToRender />
}

const HeroCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full max-w-[960px] mx-auto mt-16 overflow-hidden">
      <motion.div
        ref={containerRef}
        className="flex gap-8"
        animate={{
          x: [0, -1920],
        }}
        transition={{
          x: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[240px] h-[80px] rounded-xl bg-fluid-white-6 border border-fluid-white-10 
                     flex items-center justify-center px-8"
          >
            <div className="w-full h-6 text-fluid-white-70 hover:text-fluid-white transition-colors duration-200">
              <LogoComponent index={index} />
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default HeroCarousel 