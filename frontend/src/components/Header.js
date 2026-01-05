import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Wallet, Menu, X, User, LogOut, Search } from 'lucide-react';

const Header = () => {
  const { address, balance, isConnected, isConnecting, connect, disconnect, truncateAddress, chainId } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Explore' },
    { path: '/collections', label: 'Collections' },
  ];

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Check if on correct network (Polygon Amoy = 80002)
  const isWrongNetwork = isConnected && chainId !== 80002;

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="font-outfit font-bold text-black text-lg">N</span>
          </div>
          <span className="font-outfit font-bold text-xl text-white hidden sm:block">NovaToken</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-medium transition-colors ${
                isActivePath(link.path)
                  ? 'text-primary'
                  : 'text-white/70 hover:text-white'
              }`}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Button (Desktop) */}
          <button
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
            data-testid="search-btn"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">Search</span>
          </button>

          {/* Wallet Connection */}
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`rounded-full px-4 py-2 h-auto border-white/20 bg-white/5 hover:bg-white/10 ${
                    isWrongNetwork ? 'border-red-500/50 text-red-400' : ''
                  }`}
                  data-testid="wallet-dropdown"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  <span className="font-mono text-sm">
                    {truncateAddress(address)}
                  </span>
                  {balance && (
                    <span className="ml-2 text-white/60 text-sm">
                      {parseFloat(balance).toFixed(3)} MATIC
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0A0A0A] border-white/10">
                {isWrongNetwork && (
                  <>
                    <DropdownMenuItem className="text-red-400 focus:text-red-400">
                      Wrong Network - Switch to Polygon
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="profile-link">
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={disconnect}
                  className="text-red-400 focus:text-red-400 cursor-pointer"
                  data-testid="disconnect-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="bg-primary text-black font-bold hover:bg-primary-hover rounded-full px-6 py-2 h-auto shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] transition-all hover:scale-105 active:scale-95"
              data-testid="connect-wallet-btn"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#050505]/95 backdrop-blur-xl">
          <nav className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-medium py-2 transition-colors ${
                  isActivePath(link.path)
                    ? 'text-primary'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isConnected && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="font-medium py-2 text-white/70 hover:text-white transition-colors"
              >
                My Profile
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
