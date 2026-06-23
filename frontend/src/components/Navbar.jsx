import React from 'react'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-4 lg:px-6">
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <div className="hidden lg:block">
          <p className="text-sm text-gray-400">Selamat datang kembali 👋</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative">
            <BellIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
