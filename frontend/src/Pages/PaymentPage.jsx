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

  if (!appointment) {
    return <p>No appointment data found.</p>
  }

  const handleProceed = () => {
    if (!method) {
      alert('Please select a payment method')
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

    // Save appointment to localStorage on successful payment
    const existing = JSON.parse(localStorage.getItem('appointments')) || []
    localStorage.setItem('appointments', JSON.stringify([...existing, appointment]))

    // After success, navigate to My Appointments after delay
    setTimeout(() => {
      navigate('/my-appointments')
    }, 1500)
  }

  const handleUpiPayment = () => {
    if (!upiId) {
      alert('Please enter your UPI ID')
      return
    }

    // Simulate payment success with 70% chance
    if (Math.random() > 0.3) {
      handlePaymentSuccess()
    } else {
      setPaymentStatus('Payment Failed ❌')
    }
    setShowUpiInput(false)
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Pay for Appointment</h2>

      <img src={appointment.image} alt={appointment.name} className="w-24 h-24 rounded-full mb-4 mx-auto" />
      <p className="text-center font-semibold">{appointment.name}</p>
      <p className="text-center mb-2">{appointment.date} | {appointment.time}</p>
      <p className="text-lg font-bold text-red-600 mb-4">Amount to Pay: ₹{appointment.fees}</p>

      <div className="space-y-2">
        <label className="block">
          <input
            type="radio"
            value="razorpay"
            checked={method === 'razorpay'}
            onChange={e => setMethod(e.target.value)}
          />{' '}
          Pay via Razorpay (UPI)
        </label>
        <label className="block">
          <input
            type="radio"
            value="stripe"
            checked={method === 'stripe'}
            onChange={e => setMethod(e.target.value)}
          />{' '}
          Pay via Stripe
        </label>
        <label className="block">
          <input
            type="radio"
            value="paypal"
            checked={method === 'paypal'}
            onChange={e => setMethod(e.target.value)}
          />{' '}
          Pay via PayPal
        </label>
      </div>

      {!showUpiInput && (
        <button
          onClick={handleProceed}
          className="px-4 py-2 mt-4 bg-green-600 text-white rounded w-full"
        >
          Proceed to Pay
        </button>
      )}

      {showUpiInput && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="Enter your UPI ID"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={handleUpiPayment}
            className="px-4 py-2 mt-3 bg-blue-600 text-white rounded w-full"
          >
            Pay Now
          </button>
        </div>
      )}

      {paymentStatus && (
        <p className={`mt-4 font-bold text-center ${paymentStatus.includes('Successful') ? 'text-green-600' : 'text-red-600'}`}>
          {paymentStatus}
        </p>
      )}
    </div>
  )
}

export default PaymentPage
