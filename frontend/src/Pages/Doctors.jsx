import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../Context/AppContext'

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate()
  const { doctors, doctorsLoading } = useContext(AppContext)

  const SPECIALITIES = [
    'General physician',
    'Gynecologist',
    'Dermatologist',
    'Pediatricians',
    'Neurologist',
    'Gastroenterologist',
  ]

  useEffect(() => {
    if (speciality) {
      setFilterDoc(doctors.filter((doc) => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }, [doctors, speciality])

  if (doctorsLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Loading doctors…</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-gray-600">Browse through the doctors specialist</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>

        <div className={`flex flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {SPECIALITIES.map((s) => (
            <p
              key={s}
              onClick={() =>
                speciality === s ? navigate('/doctors') : navigate(`/doctors/${s}`)
              }
              className={`w-[94vw] sm:w-auto pl-3 py-2 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                speciality === s ? 'bg-indigo-100 text-black' : ''
              }`}
            >
              {s}
            </p>
          ))}
        </div>

        <div className="w-full grid grid-cols-auto gap-y-6">
          {filterDoc.length === 0 ? (
            <p className="text-gray-500 col-span-full py-10 text-center">
              {speciality ? `No doctors found for "${speciality}".` : 'No doctors available.'}
            </p>
          ) : (
            filterDoc.map((item) => {
              const imgSrc =
                item.image && item.image !== 'default.jpg' ? item.image : null
              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/appointment/${item._id}`)}
                  className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
                >
                  {imgSrc ? (
                    <img className="bg-blue-50 w-full" src={imgSrc} alt={item.name} />
                  ) : (
                    <div className="bg-blue-50 w-full h-48 flex items-center justify-center text-gray-400 text-sm">
                      No Photo
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <p className="w-2 h-2 bg-green-500 rounded-full"></p>
                      <p>{item.available !== false ? 'Available' : 'Unavailable'}</p>
                    </div>
                    <p className="text-gray-900 text-lg font-medium">{item.name}</p>
                    <p className="text-gray-600 text-sm">{item.speciality}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Doctors
