'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { id: 'funds', label: 'Funds', type: 'scroll' },
    { id: 'leaderboard', label: 'Leaderboard', type: 'link', href: '/leaderboard' },
    { id: 'wallet-prediction', label: 'Wallet Prediction', type: 'link', href: '/wallet-prediction' }
  ]

  const handleItemClick = (item: typeof menuItems[0]) => {
    setIsOpen(false)
    
    if (item.type === 'link') {
      router.push(item.href!)
      return
    }

    // Scroll behavior for other items
    setTimeout(() => {
      const element = document.getElementById(item.id)
      if (element) {
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-fluid-white-10 
                 bg-fluid-white-6 text-fluid-white transition-all duration-200 hover:bg-fluid-white-10"
        aria-label="Toggle menu"
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 18 18" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          className="transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
        >
          {isOpen ? (
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" />
          ) : (
            <path d="M2.25 4.5h13.5M2.25 9h13.5M2.25 13.5h13.5" />
          )}
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-16 bg-fluid-bg/95 backdrop-blur-[20px]"
          >
            <nav className="flex flex-col border-y border-fluid-white-10">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="px-5 py-4 text-[15px] text-fluid-white-70 transition-all duration-200 
                           hover:bg-fluid-white-6 hover:text-fluid-white text-center"
                >
                  {item.label}
                </button>
              ))}
              <div className="p-5">
                <Link
                  href="/connect"
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-fluid-white-10 
                           bg-fluid-white-6 px-4 text-[14px] font-medium text-fluid-white 
                           transition-all duration-200 hover:bg-fluid-white-10"
                >
                  Connect
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileMenu