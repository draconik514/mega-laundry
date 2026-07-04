import React, { useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'

const FeedbackModal = ({ orderCode, customerName, onClose }) => {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Pilih rating dulu')
      return
    }
    setLoading(true)
    try {
      await api.post('/feedback', { order_code: orderCode, customer_name: customerName, rating, message })
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim feedback')
    } finally {
      setLoading(false)
    }
  }

  const ratingLabels = { 1: 'Sangat Buruk', 2: 'Buruk', 3: 'Cukup', 4: 'Bagus', 5: 'Sangat Bagus!' }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h3>
            <p className="text-gray-500 text-sm mb-6">Feedback Anda sangat berarti bagi kami untuk terus berkembang.</p>
            <button onClick={onClose} className="btn-primary px-8 py-2.5">Tutup</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Beri Penilaian</h3>
                <p className="text-xs text-gray-400 mt-0.5">Bagaimana pengalaman laundry Anda?</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Stars */}
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      {star <= (hovered || rating)
                        ? <StarIcon className="w-10 h-10 text-yellow-400" />
                        : <StarOutline className="w-10 h-10 text-gray-300" />
                      }
                    </button>
                  ))}
                </div>
                <p className="text-sm font-semibold text-gray-600 h-5">
                  {ratingLabels[hovered || rating] || ''}
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="label">Pesan (opsional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input resize-none"
                  rows="3"
                  placeholder="Ceritakan pengalaman Anda..."
                />
              </div>

              <button type="submit" disabled={loading || rating === 0} className="btn-primary w-full py-3">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : 'Kirim Feedback'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default FeedbackModal
