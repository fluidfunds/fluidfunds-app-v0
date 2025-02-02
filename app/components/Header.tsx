'use client'
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { Logo } from "./icons/Logo";

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
            <button 
              onClick={() => scrollToSection('features')}
              className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('funds')}
              className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
            >
              Funds
            </button>
            <button 
              onClick={() => scrollToSection('benefits')}
              className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
            >
              Benefits
            </button>
            <button 
              onClick={() => scrollToSection('community')}
              className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
            >
              Community
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-[15px] text-fluid-white-70 hover:text-fluid-white transition-colors duration-200"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/connect"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-lg border border-fluid-white-10 
                       bg-fluid-white-6 px-4 text-[14px] font-medium text-fluid-white 
                       transition-all duration-200 hover:bg-fluid-white-10"
            >
              Connect
            </Link>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 