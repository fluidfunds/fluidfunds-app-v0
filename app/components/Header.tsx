'use client'
import Link from "next/link"
import MobileMenu from "./MobileMenu"
import { Logo } from "./icons/Logo"
import { CustomConnectButton } from './CustomConnectButton'

const navigation = [
  { name: 'Funds', href: '#funds' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'Wallet Prediction', href: '/wallet-prediction' }
]

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-fluid-bg/90 backdrop-blur-[20px]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-fluid-primary">
              <Logo className="w-6 h-6" />
            </div>
            <span className="text-lg font-medium text-fluid-primary">
              FluidFunds
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              item.href.startsWith('#') ? (
                <button 
                  key={item.name}
                  onClick={() => scrollToSection(item.href.slice(1))}
                  className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
                >
                  {item.name}
                </button>
              ) : (
                <Link 
                  key={item.name}
                  href={item.href}
                  className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <CustomConnectButton />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;