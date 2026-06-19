import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PaymentPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const appointment = state?.appointment

  const [method, setMethod] = useState('')
  const [showUpiInput, setShowUpiInput] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [error, setError] = useState('')

  if (!appointment) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No appointment data found.</p>
      </div>
    )
  }

  const handleProceed = () => {
    setError('')
    if (!method) {
      setError('Please select a payment method.')
      return
    }
    if (method === 'razorpay') {
      setShowUpiInput(true)
    } else {
      handlePaymentSuccess()
    }
  }

  const handlePaymentSuccess = () => {
    setPaymentStatus('Payment Successful ✅')
    const existing = JSON.parse(localStorage.getItem('appointments')) || []
    localStorage.setItem('appointments', JSON.stringify([...existing, appointment]))
    setTimeout(() => navigate('/my-appointments'), 1500)
  }

  const handleUpiPayment = () => {
    setError('')
    if (!upiId.trim()) {
      setError('Please enter your UPI ID.')
      return
    }
    // Simulate payment (70% success)
    if (Math.random() > 0.3) {
      handlePaymentSuccess()
    } else {
      setPaymentStatus('Payment Failed ❌ — Please try again.')
    }
    setShowUpiInput(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Pay for Appointment</h2>

      <img
        src={appointment.image}
        alt={appointment.name}
        className="w-24 h-24 rounded-full mb-4 mx-auto object-cover"
      />
      <p className="text-center font-semibold">{appointment.name}</p>
      <p className="text-center text-gray-500 mb-2">{appointment.date} | {appointment.time}</p>
      <p className="text-lg font-bold text-primary mb-4 text-center">Amount: ₹{appointment.fees}</p>

      <div className="space-y-3 mb-4">
        {['razorpay', 'stripe', 'paypal'].map((m) => (
          <label key={m} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              id={`pay-${m}`}
              value={m}
              checked={method === m}
              onChange={(e) => { setMethod(e.target.value); setError('') }}
            />
            <span className="capitalize">Pay via {m.charAt(0).toUpperCase() + m.slice(1)}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {!showUpiInput && (
        <button
          id="proceed-pay-btn"
          onClick={handleProceed}
          className="px-4 py-2 bg-primary text-white rounded-full w-full hover:opacity-90 transition-opacity"
        >
          Proceed to Pay
        </button>
      )}

      {showUpiInput && (
        <div className="mt-4">
          <input
            id="upi-input"
            type="text"
            placeholder="Enter your UPI ID (e.g. name@bank)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />
          <button
            id="pay-now-btn"
            onClick={handleUpiPayment}
            className="px-4 py-2 bg-green-600 text-white rounded-full w-full"
          >
            Pay Now
          </button>
        </div>
      )}

      {paymentStatus && (
        <p
          className={`mt-4 font-bold text-center ${
            paymentStatus.includes('Successful') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {paymentStatus}
        </p>
      )}
    </div>
  )
}

export default PaymentPage
