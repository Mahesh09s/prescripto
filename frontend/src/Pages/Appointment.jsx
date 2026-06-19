import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../Context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../Components/RelatedDoctors'
import api from '../utils/api'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { doctors, currencySymbol } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState(null)
  const [docLoading, setDocLoading] = useState(true)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingMsg, setBookingMsg] = useState({ text: '', type: '' })

  // ── Resolve doctor: check context array first, then fetch from API ────────
  useEffect(() => {
    const fromContext = doctors.find((d) => d._id === docId)
    if (fromContext) {
      setDocInfo(fromContext)
      setDocLoading(false)
      return
    }

    // Not in static/context list → fetch from API (MongoDB-registered doctor)
    const fetchDoctor = async () => {
      setDocLoading(true)
      try {
        const { data } = await api.get(`/doctors/${docId}`)
        if (data.success && data.doctor) {
          setDocInfo(data.doctor)
        } else {
          setDocInfo(null)
        }
      } catch (err) {
        console.error('Could not fetch doctor:', err.message)
        setDocInfo(null)
      } finally {
        setDocLoading(false)
      }
    }
    fetchDoctor()
  }, [docId, doctors])

  // ── Build 30-minute time slots for the next 7 days ───────────────────────
  useEffect(() => {
    if (!docInfo) return
    const slots = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      const endTime = new Date(currentDate)
      endTime.setHours(21, 0, 0, 0)

      if (i === 0) {
        // Today: start from the next full hour (or 10:00 at minimum)
        const now = new Date()
        const h = now.getHours()
        const m = now.getMinutes()
        // If we're past the :00 mark, advance to the next hour
        const startHour = h < 10 ? 10 : m > 0 ? h + 1 : h
        currentDate.setHours(startHour, 0, 0, 0)
      } else {
        currentDate.setHours(10, 0, 0, 0)
      }

      const timeSlots = []
      const tempTime = new Date(currentDate)
      while (tempTime < endTime) {
        timeSlots.push({
          datetime: new Date(tempTime),
          time: tempTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        tempTime.setMinutes(tempTime.getMinutes() + 30)
      }
      slots.push(timeSlots)
    }
    setDocSlots(slots)
    setSlotTime('')
  }, [docInfo])

  // ── Compute YYYY-MM-DD for selected day ───────────────────────────────────
  const getSelectedDate = () => {
    if (!docSlots[slotIndex]?.[0]) return ''
    const d = docSlots[slotIndex][0].datetime
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const dd   = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // ── Book appointment ──────────────────────────────────────────────────────
  const bookAppointment = async () => {
    setBookingMsg({ text: '', type: '' })

    if (!slotTime) {
      setBookingMsg({ text: 'Please select a time slot.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const date = getSelectedDate()
      const { data } = await api.post('/appointments/book', {
        doctorId: docId,
        date,
        slot: slotTime,
        reason,
      })

      if (data.success) {
        setBookingMsg({ text: '✅ Appointment booked successfully!', type: 'success' })
        setSlotTime('')
        setReason('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => navigate('/my-appointments'), 1800)
      } else {
        setBookingMsg({ text: data.message || 'Booking failed.', type: 'error' })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error. Please try again.'
      setBookingMsg({ text: '❌ ' + msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (docLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Loading doctor information…</p>
      </div>
    )
  }

  if (!docInfo) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Doctor not found.</p>
        <button
          onClick={() => navigate('/doctors')}
          className="mt-4 text-primary underline"
        >
          Browse all doctors
        </button>
      </div>
    )
  }

  // Resolve image: use API image URL or fall back to profile placeholder
  const docImage = docInfo.image && docInfo.image !== 'default.jpg'
    ? docInfo.image
    : assets.profile_pic

  return (
    <div>
      {/* Doctor Info Card */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-purple-50 w-full sm:max-w-72 rounded-lg object-cover"
            src={docImage}
            alt={docInfo.name}
          />
        </div>
        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="Verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>
              {docInfo.degree} - {docInfo.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience}
            </button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="Info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:{' '}
            <span className="text-gray-600">
              {currencySymbol}
              {docInfo.fees}
            </span>
          </p>
        </div>
      </div>

      {/* Slot Selection */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>

        {/* Day Selector */}
        <div className="flex gap-3 items-center w-full overflow-x-auto mt-4">
          {docSlots.map((daySlots, index) => (
            <div
              key={index}
              onClick={() => { setSlotIndex(index); setSlotTime('') }}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                slotIndex === index
                  ? 'bg-primary text-white'
                  : 'border border-gray-200'
              }`}
            >
              <p>{daySlots[0] && daysOfWeek[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time Slot Selector */}
        <div className="flex items-center gap-3 w-full overflow-x-auto mt-4">
          {docSlots[slotIndex]?.map((slot, i) => (
            <div
              key={i}
              onClick={() => setSlotTime(slot.time)}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                slot.time === slotTime
                  ? 'bg-primary text-white'
                  : 'text-gray-400 border border-gray-300'
              }`}
            >
              {slot.time.toLowerCase()}
            </div>
          ))}
        </div>

        {/* Reason / Notes */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Reason for Visit (optional)</h3>
          <textarea
            id="appointment-reason"
            placeholder="Briefly describe your symptoms or reason for the visit…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border p-2 rounded mb-2 text-sm font-normal resize-none h-24"
          />
        </div>

        {/* Booking Status Message */}
        {bookingMsg.text && (
          <p
            className={`mt-3 font-medium text-sm ${
              bookingMsg.type === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {bookingMsg.text}
          </p>
        )}

        <button
          id="book-appointment-btn"
          onClick={bookAppointment}
          disabled={loading}
          className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 disabled:opacity-60"
        >
          {loading ? 'Booking…' : 'Book an appointment'}
        </button>
      </div>

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment
