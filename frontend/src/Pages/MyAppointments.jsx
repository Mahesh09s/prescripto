import React, { useEffect, useState, useCallback, useContext } from 'react'
import { assets } from '../assets/assets'
import api from '../utils/api'
import { AppContext } from '../Context/AppContext'

/* ── Status badge helper ───────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    booked:    'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

/* ── Patient appointments view ─────────────────────────────────────────────── */
const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/appointments/my')
      if (data.success) {
        setAppointments(data.appointments)
      } else {
        setError(data.message || 'Failed to load appointments.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch appointments.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const cancelAppointment = async (id) => {
    setCancellingId(id)
    try {
      const { data } = await api.put(`/appointments/cancel/${id}`)
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a))
        )
      } else {
        setError(data.message || 'Could not cancel appointment.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error while cancelling.')
    } finally {
      setCancellingId(null)
      setConfirmId(null)
    }
  }

  if (loading) return <p className="text-center text-gray-500 py-10">Loading appointments…</p>
  if (error) return (
    <div className="text-center py-6">
      <p className="text-red-500">{error}</p>
      <button onClick={fetchAppointments} className="mt-3 text-primary underline">Try again</button>
    </div>
  )
  if (appointments.length === 0) return <p className="text-center text-gray-500 py-10">You have no appointments booked yet.</p>

  return (
    <div className="flex flex-col gap-4">
      {appointments.map((appt) => {
        const doc = appt.doctor || {}
        const docImage = doc.image && doc.image !== 'default.jpg' ? doc.image : assets.profile_pic
        const isCancelling = cancellingId === appt._id

        return (
          <div
            key={appt._id}
            className="border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-start gap-4">
              <img
                src={docImage}
                alt={doc.name || 'Doctor'}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div>
                <p className="font-bold text-gray-800">{doc.name || 'Unknown Doctor'}</p>
                <p className="text-sm text-gray-500">{doc.speciality || ''}</p>
                <p className="text-gray-700 text-sm mt-1">Fee: ₹{appt.fees}</p>
                {appt.reason && <p className="text-sm text-gray-500 mt-1">Reason: {appt.reason}</p>}
                <p className="mt-2 text-sm">📅 {appt.date} &nbsp;|&nbsp; 🕐 {appt.slot}</p>
                <div className="mt-1"><StatusBadge status={appt.status} /></div>
              </div>
            </div>

            {appt.status === 'booked' && (
              <div className="flex-shrink-0">
                {confirmId === appt._id ? (
                  <div className="flex flex-col items-center gap-2">
                    <p className="font-bold text-red-600 text-sm">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        id={`confirm-cancel-${appt._id}`}
                        onClick={() => cancelAppointment(appt._id)}
                        disabled={isCancelling}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
                      >
                        {isCancelling ? '…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    id={`cancel-btn-${appt._id}`}
                    onClick={() => setConfirmId(appt._id)}
                    className="bg-red-50 border border-red-400 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-full text-sm transition-all"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Doctor appointments view ──────────────────────────────────────────────── */
const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [completing, setCompleting] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/appointments/doctor')
      if (data.success) {
        setAppointments(data.appointments)
      } else {
        setError(data.message || 'Failed to load appointments.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch appointments.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const markComplete = async (id) => {
    setCompleting(id)
    try {
      const { data } = await api.put(`/appointments/complete/${id}`)
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: 'completed' } : a))
        )
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete appointment.')
    } finally {
      setCompleting(null)
    }
  }

  const cancelAppointment = async (id) => {
    setCancelling(id)
    try {
      const { data } = await api.put(`/appointments/cancel/${id}`)
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a))
        )
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel appointment.')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <p className="text-center text-gray-500 py-10">Loading appointments…</p>
  if (error)   return (
    <div className="text-center py-6">
      <p className="text-red-500">{error}</p>
      <button onClick={fetchAppointments} className="mt-3 text-primary underline">Try again</button>
    </div>
  )
  if (appointments.length === 0) return <p className="text-center text-gray-500 py-10">No appointments yet.</p>

  return (
    <div className="flex flex-col gap-4">
      {appointments.map((appt) => {
        const patient = appt.patient || {}
        const patImage = patient.image && patient.image !== 'default.jpg'
          ? patient.image
          : assets.profile_pic

        return (
          <div
            key={appt._id}
            className="border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-start gap-4">
              <img
                src={patImage}
                alt={patient.name || 'Patient'}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div>
                <p className="font-bold text-gray-800">{patient.name || 'Unknown Patient'}</p>
                <p className="text-sm text-gray-500">{patient.phone || patient.email || ''}</p>
                {appt.reason && <p className="text-sm text-gray-500 mt-1">Reason: {appt.reason}</p>}
                <p className="mt-2 text-sm">📅 {appt.date} &nbsp;|&nbsp; 🕐 {appt.slot}</p>
                <p className="text-sm text-gray-600">Fee: ₹{appt.fees}</p>
                <div className="mt-1"><StatusBadge status={appt.status} /></div>
              </div>
            </div>

            {appt.status === 'booked' && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => markComplete(appt._id)}
                  disabled={completing === appt._id}
                  className="bg-green-50 border border-green-500 text-green-700 hover:bg-green-600 hover:text-white px-4 py-2 rounded-full text-sm transition-all disabled:opacity-60"
                >
                  {completing === appt._id ? '…' : '✓ Complete'}
                </button>
                <button
                  onClick={() => cancelAppointment(appt._id)}
                  disabled={cancelling === appt._id}
                  className="bg-red-50 border border-red-400 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-full text-sm transition-all disabled:opacity-60"
                >
                  {cancelling === appt._id ? '…' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Root component ────────────────────────────────────────────────────────── */
const MyAppointments = () => {
  const { userRole } = useContext(AppContext)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">
        {userRole === 'doctor' ? 'Patient Appointments' : 'My Appointments'}
      </h2>
      {userRole === 'doctor' ? <DoctorAppointments /> : <PatientAppointments />}
    </div>
  )
}

export default MyAppointments
