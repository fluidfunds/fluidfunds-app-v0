'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FundRanking {
  address: string
  name: string
  totalInvestment: number
  investors: number
  performance: number
  rank: number
}

export default function LeaderboardPage() {
  // Initialize with the first fund with real data
  const [funds] = useState<FundRanking[]>([
    {
      address: '0xcb07179bbf7930447ea0f980bf96ac12bd4bac14',
      name: 'TraderB',
      totalInvestment: 25000,
      investors: 1,
      performance: 24.5, // Updated to real performance value
      rank: 1
    }
  ])
  
  return (
    <div className="min-h-screen bg-fluid-bg pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-fluid-white-70 hover:text-fluid-white 
                     transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-fluid-white mb-4"
          >
            Fund Rankings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-fluid-white-70 max-w-2xl mx-auto"
          >
            Track the performance of all FluidFunds and discover the top performing investment opportunities
          </motion.p>
        </div>

        <div className="mt-12">
          <div className="bg-fluid-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 text-fluid-white-70 text-sm border-b border-fluid-white/10">
              <div className="col-span-2">Fund Name</div>
              <div className="text-right">Total Investment</div>
              <div className="text-right">Investors</div>
              <div className="text-right">Performance</div>
              <div className="text-right">Rank</div>
            </div>
            
            {funds.map((fund, index) => (
              <Link 
                key={fund.address}
                href={`/fund/${fund.address}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="grid grid-cols-6 gap-4 p-4 text-fluid-white hover:bg-fluid-white/[0.08] 
                           transition-colors cursor-pointer group"
                >
                  <div className="col-span-2 font-medium flex items-center gap-2">
                    {fund.name}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </div>
                  <div className="text-right">${fund.totalInvestment.toLocaleString()}</div>
                  <div className="text-right">{fund.investors}</div>
                  <div className="text-right text-green-400">+{fund.performance}%</div>
                  <div className="text-right font-medium">#{fund.rank}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-fluid-white/5 rounded-xl p-6"
          >
            <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="text-fluid-white font-medium mb-2">Top Performers</h3>
            <p className="text-fluid-white-70 text-sm">
              Discover the highest performing funds based on historical returns
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-fluid-white/5 rounded-xl p-6"
          >
            <TrendingUp className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-fluid-white font-medium mb-2">Investment Volume</h3>
            <p className="text-fluid-white-70 text-sm">
              Track total investments and fund growth over time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-fluid-white/5 rounded-xl p-6"
          >
            <Users className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-fluid-white font-medium mb-2">Investor Count</h3>
            <p className="text-fluid-white-70 text-sm">
              See which funds are attracting the most investors
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}