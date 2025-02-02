'use client'
import { motion } from 'framer-motion'
import { StreamIcon, SecurityIcon, InvestIcon } from './icons'

const Benefits = () => {
  const benefits = [
    {
      icon: <SecurityIcon />,
      title: "Secure & Transparent",
      description: "Trade with confidence using our rug-proof smart contracts and whitelisted tokens."
    },
    {
      icon: <InvestIcon />,
      title: "Professional Management",
      description: "Access vetted fund managers with proven track records and transparent strategies."
    },
    {
      icon: <StreamIcon />,
      title: "Real-Time Performance",
      description: "Monitor your investments with live tracking and detailed analytics."
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="w-full"
    >
      <h2 className="text-[40px] font-medium text-center mb-12">
        Why Choose FluidFunds?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 bg-fluid-white-6 
                     border border-fluid-white-10 rounded-2xl hover:bg-fluid-white-10 
                     transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-fluid-primary/10 flex items-center 
                          justify-center text-fluid-primary mb-6">
              {benefit.icon}
            </div>
            <h3 className="text-xl font-medium mb-3">{benefit.title}</h3>
            <p className="text-fluid-white-70">{benefit.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default Benefits 