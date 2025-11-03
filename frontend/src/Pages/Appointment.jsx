import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../Context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../Components/RelatedDoctors'

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { doctors, currencySymbol } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [patientName, setPatientName] = useState('')
  const [age, setAge] = useState('')
  const [medicalIssue, setMedicalIssue] = useState('')
  const [problems, setProblems] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!doctors || doctors.length === 0) return
    const found = doctors.find(d => d._id === docId)
    setDocInfo(found || null)
  }, [docId, doctors])

  useEffect(() => {
    if (!docInfo) return
    const slots = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)
      const endTime = new Date(today)
      endTime.setDate(today.getDate() + i)
      endTime.setHours(21, 0, 0, 0)
      if (today.getDate() === currentDate.getDate()) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
      } else {
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }
      const timeSlots = []
      let tempTime = new Date(currentDate)
      while (tempTime < endTime) {
        const formattedTime = tempTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        timeSlots.push({
          datetime: new Date(tempTime),
          time: formattedTime,
        })
        tempTime.setMinutes(tempTime.getMinutes() + 30)
      }
      slots.push(timeSlots)
    }
    setDocSlots(slots)
  }, [docInfo])

  const bookAppointment = () => {
    if (!patientName || !age || !medicalIssue || !problems) {
      alert('Please fill in all patient details before booking.')
      return
    }
    if (!slotTime) {
      alert('Please select a time slot before booking.')
      return
    }

    const slotDate = docSlots[slotIndex][0].datetime.toDateString()

    const newAppointment = {
      id: Date.now(),
      name: docInfo.name,
      image: docInfo.image,
      date: slotDate,
      time: slotTime,
      fees: docInfo.fees,
      patientName,
      age,
      medicalIssue,
      problems,
    }

    console.log('Appointment booked:', newAppointment)
    alert('✅ Booking confirmed!')
    setSuccessMessage('✅ Appointment booked successfully!')

    const savedAppointments = JSON.parse(localStorage.getItem('appointments')) || []
    localStorage.setItem('appointments', JSON.stringify([...savedAppointments, newAppointment]))

    // ✅ Scroll to top after booking
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Reset form
    setPatientName('')
    setAge('')
    setMedicalIssue('')
    setProblems('')
  }

  if (!docInfo) {
    return <p className="p-6 text-center">Doctor not found.</p>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-purple-50 w-full sm:max-w-72 rounded-lg"
            src={docInfo.image}
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
            <button className="py-0.5 px-2 border text-xs rounded-full">{docInfo.experience}</button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
              About <img src={assets.info_icon} alt="Info" />
            </p>
            <p className="text-sm text-gray-500 max-w-[700px] mt-1">{docInfo.about}</p>
          </div>
          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:<span className="text-gray-600"> {currencySymbol} {docInfo.fees}</span>
          </p>
        </div>
      </div>

      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p>Booking slots</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
          {docSlots.map((daySlots, index) => (
            <div
              key={index}
              onClick={() => setSlotIndex(index)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'
              }`}
            >
              <p>{daySlots[0] && daysOfWeek[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
          {docSlots[slotIndex]?.map((slot, i) => (
            <p
              key={i}
              onClick={() => setSlotTime(slot.time)}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                slot.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'
              }`}
            >
              {slot.time.toLowerCase()}
            </p>
          ))}
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Patient Details</h3>
          <input
            type="text"
            placeholder="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
          <input
            type="text"
            placeholder="Medical Issue"
            value={medicalIssue}
            onChange={(e) => setMedicalIssue(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
          <textarea
            placeholder="Problems / Suggestions"
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            className="w-full border p-2 rounded mb-2"
          />
        </div>

        <button
          onClick={bookAppointment}
          className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6"
        >
          Book an appointment
        </button>

        {successMessage && (
          <p className="text-green-600 font-medium mt-2">{successMessage}</p>
        )}
      </div>

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment
