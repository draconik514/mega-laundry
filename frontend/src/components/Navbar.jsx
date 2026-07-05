import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bars3Icon, BellIcon, ClockIcon, ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const statusLabel = (status) => {
    const map = {
      pending_pickup: 'Menunggu Pickup', washing: 'Dicuci',
      drying: 'Dikeringkan', ironing: 'Disetrika',
      ready_for_delivery: 'Siap Diambil', picked_up: 'Dijemput',
    }
    return map[status] || status
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      const orders = res.data || []
      setNotifications(orders.map(o => ({
        id: o.id,
        code: o.code,
        type: o.is_late ? 'late' : 'new',
        message: o.is_late ? `Order ${o.code} terlambat!` : `Order ${o.code} — ${o.customer_name}`,
        sub: o.is_late ? `${o.customer_name} — ${o.service_name}` : `Status: ${statusLabel(o.status)}`,
        time: o.created_at,
      })))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // refresh tiap 1 menit
    return () => clearInterval(interval)
  }, [])

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (code) => {
    setOpen(false)
    navigate(`/orders/${code}`)
  }

  const unread = notifications.length

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

        {/* Bell */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors relative"
          >
            <BellIcon className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">Notifikasi</p>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                  <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => handleClick(n.code)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === 'late' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {n.type === 'late'
                          ? <ClockIcon className="w-4 h-4 text-red-500" />
                          : <ShoppingBagIcon className="w-4 h-4 text-blue-500" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${n.type === 'late' ? 'text-red-600' : 'text-gray-800'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{n.sub}</p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(n.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={() => { setOpen(false); navigate('/orders') }}
                    className="text-xs text-blue-600 font-semibold hover:underline w-full text-center"
                  >
                    Lihat semua pesanan →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
