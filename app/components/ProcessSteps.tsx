'use client'
import { motion } from 'framer-motion'

const ProcessSteps = () => {
  const steps = [
    {
      title: "Build Your Community",
      description: "Fund manager raise USDCx from user via superfluid streams. The Manager invest in whitelist assets in any way they wish."
    },
    {
      title: "Stream USDC",
      description: "Stream USDCx via Superfluid Protocol"
    },
    {
      title: "Trade Behind your Community",
      description: "Trade and earn for you and community."
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <h2 className="text-[40px] font-medium text-center mb-12">
        Start a Hedge Fund
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-8 bg-fluid-white-6 
                     border border-fluid-white-10 rounded-2xl hover:bg-fluid-white-10 
                     transition-colors"
          >
            <span className="w-12 h-12 rounded-full bg-fluid-primary/10 flex items-center 
                          justify-center text-fluid-primary text-xl font-medium mb-6">
              {index + 1}
            </span>
            <h3 className="text-xl font-medium mb-4">{step.title}</h3>
            <p className="text-fluid-white-70">{step.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default ProcessSteps 