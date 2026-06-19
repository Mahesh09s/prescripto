import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../Context/AppContext'
import { assets } from '../assets/assets'

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors, doctorsLoading } = useContext(AppContext)

  if (doctorsLoading) {
    return (
      <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
        <h2 className="text-3xl font-medium">Top Doctors to Book</h2>
        <p className="text-gray-500 text-sm">Loading doctors…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h2 className="text-3xl font-medium">Top Doctors to Book</h2>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors.
      </p>
      <div className="w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0">
        {doctors.slice(0, 10).map((item) => {
          const imgSrc =
            item.image && item.image !== 'default.jpg' ? item.image : assets.profile_pic
          return (
            <div
              key={item._id}
              onClick={() => { navigate(`/appointment/${item._id}`); window.scrollTo(0, 0) }}
              className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
            >
              <img className="bg-blue-50 w-full" src={imgSrc} alt={item.name} />
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
        })}
      </div>
      <button
        onClick={() => { navigate('/doctors'); window.scrollTo(0, 0) }}
        className="bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10 hover:bg-blue-100 transition-colors"
      >
        More
      </button>
    </div>
  )
}

export default TopDoctors
