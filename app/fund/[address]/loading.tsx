import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen bg-fluid-bg pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-32 h-8 bg-fluid-white/[0.02] rounded-lg mb-8"
        />
        
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-16 bg-fluid-white/[0.02] rounded-xl mb-12"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="aspect-video bg-fluid-white/[0.02] rounded-xl"
            />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-[400px] bg-fluid-white/[0.02] rounded-xl"
            />
          </div>
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                className="h-[300px] bg-fluid-white/[0.02] rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}