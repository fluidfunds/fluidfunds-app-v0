'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQItemProps {
  question: string
  answer: string
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-fluid-white-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium">{question}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-fluid-white-70">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FAQ = () => {
  const faqs = [
    {
      question: "How its Works?",
      answer: "Fund managers create investment pools where users can stream USDC continuously using Superfluid protocol. Managers then invest these funds in whitelisted, high market cap tokens."
    },
    {
      question: "Why FluidFunds?",
      answer: "FluidFunds provides a secure, transparent platform with rug-proof contracts and whitelisted tokens, ensuring your investments are protected while enabling professional fund management."
    },
    {
      question: "What chains are available?",
      answer: "Currently, we support major EVM chains including Ethereum, Polygon, and Optimism. More chains will be added based on community demand."
    },
    {
      question: "Can i reestream my earnings?",
      answer: "Yes, you can automatically reinvest your earnings by setting up a new stream with your returns, compounding your investment over time."
    },
    {
      question: "Can i withdraw my earnings in any moment?",
      answer: "Yes, you have the flexibility to withdraw your earnings at any time, subject to the smart contract's predefined rules for secure withdrawals."
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
      className="w-full max-w-3xl mx-auto"
    >
      <h2 className="text-[40px] font-medium text-center mb-12">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-fluid-white-10">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </motion.div>
  )
}

export default FAQ 