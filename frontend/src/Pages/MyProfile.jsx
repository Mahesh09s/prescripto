import React, { useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../Context/AppContext'
import api from '../utils/api'

const MyProfile = () => {
  const { userProfile, userRole, setUserProfile } = useContext(AppContext)

  const isDoctor = userRole === 'doctor'

  const defaultProfile = isDoctor
    ? { name: '', image: '', email: '', speciality: '', degree: '', experience: '', about: '', fees: '', available: true, address: {} }
    : { name: '', image: '', email: '', phone: '', address: { line1: '', line2: '' }, gender: 'Other', dob: '' }

  const [userData, setUserData] = useState(userProfile || defaultProfile)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const profileImage =
    userData.image && userData.image !== 'default.jpg'
      ? userData.image
      : assets.profile_pic

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      let payload
      let endpoint

      if (isDoctor) {
        endpoint = '/doctors/profile'
        payload = {
          name: userData.name,
          phone: userData.phone,
          about: userData.about,
          available: userData.available,
          fees: userData.fees,
          address: userData.address,
          experience: userData.experience,
          degree: userData.degree,
          speciality: userData.speciality,
        }
      } else {
        endpoint = '/patients/profile'
        payload = {
          name: userData.name,
          phone: userData.phone,
          gender: userData.gender,
          dob: userData.dob,
          address: userData.address,
        }
      }

      const { data } = await api.put(endpoint, payload)

      if (data.success) {
        setUserProfile(data.patient || data.doctor)
        setUserData(data.patient || data.doctor)
        setSaveMsg('✅ Profile saved!')
      } else {
        setSaveMsg('❌ Could not save: ' + data.message)
      }
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Server error'))
    } finally {
      setSaving(false)
      setIsEdit(false)
    }
  }

  return (
    <div className="max-w-lg flex flex-col gap-2 text-sm">
      <img
        className="w-36 rounded object-cover"
        src={profileImage}
        alt="Profile"
      />

      {isEdit ? (
        <input
          className="bg-gray-50 text-3xl font-medium max-w-60 mt-4 border-b outline-none"
          type="text"
          value={userData.name || ''}
          onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Your name"
        />
      ) : (
        <p className="font-medium text-3xl text-neutral-800 mt-4">{userData.name}</p>
      )}

      <hr className="bg-zinc-400 h-[1px] border-none" />

      {/* ── Contact Information ── */}
      <div>
        <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
        <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
          <p className="font-medium">Email:</p>
          <p className="text-blue-500">{userData.email}</p>

          {!isDoctor && (
            <>
              <p className="font-medium">Phone:</p>
              {isEdit ? (
                <input
                  className="bg-gray-100 max-w-52 border-b outline-none"
                  type="tel"
                  value={userData.phone || ''}
                  onChange={(e) => setUserData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <p className="text-blue-400">{userData.phone}</p>
              )}

              <p className="font-medium">Address:</p>
              {isEdit ? (
                <div>
                  <input
                    className="bg-gray-50 border-b w-full outline-none"
                    type="text"
                    value={userData.address?.line1 || ''}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line1: e.target.value },
                      }))
                    }
                    placeholder="Address line 1"
                  />
                  <input
                    className="bg-gray-50 border-b w-full mt-1 outline-none"
                    type="text"
                    value={userData.address?.line2 || ''}
                    onChange={(e) =>
                      setUserData((prev) => ({
                        ...prev,
                        address: { ...prev.address, line2: e.target.value },
                      }))
                    }
                    placeholder="Address line 2"
                  />
                </div>
              ) : (
                <p className="text-gray-500">
                  {userData.address?.line1}
                  {userData.address?.line2 && <><br />{userData.address.line2}</>}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Doctor-specific fields ── */}
      {isDoctor && (
        <div>
          <p className="text-neutral-500 underline mt-3">PROFESSIONAL INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Speciality:</p>
            <p className="text-gray-600">{userData.speciality}</p>

            <p className="font-medium">Degree:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-52 border-b outline-none"
                type="text"
                value={userData.degree || ''}
                onChange={(e) => setUserData((prev) => ({ ...prev, degree: e.target.value }))}
              />
            ) : (
              <p className="text-gray-600">{userData.degree}</p>
            )}

            <p className="font-medium">Experience:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-52 border-b outline-none"
                type="text"
                value={userData.experience || ''}
                onChange={(e) => setUserData((prev) => ({ ...prev, experience: e.target.value }))}
                placeholder="e.g. 5 Years"
              />
            ) : (
              <p className="text-gray-600">{userData.experience}</p>
            )}

            <p className="font-medium">Fees (₹):</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-36 border-b outline-none"
                type="number"
                min="0"
                value={userData.fees || ''}
                onChange={(e) => setUserData((prev) => ({ ...prev, fees: Number(e.target.value) }))}
              />
            ) : (
              <p className="text-gray-600">₹{userData.fees}</p>
            )}

            <p className="font-medium">About:</p>
            {isEdit ? (
              <textarea
                className="bg-gray-50 border rounded p-1 text-sm resize-none h-20 outline-none"
                value={userData.about || ''}
                onChange={(e) => setUserData((prev) => ({ ...prev, about: e.target.value }))}
              />
            ) : (
              <p className="text-gray-500 text-sm">{userData.about}</p>
            )}

            <p className="font-medium">Available:</p>
            {isEdit ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!userData.available}
                  onChange={(e) => setUserData((prev) => ({ ...prev, available: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span>{userData.available ? 'Yes' : 'No'}</span>
              </label>
            ) : (
              <p className={userData.available ? 'text-green-600' : 'text-red-500'}>
                {userData.available ? 'Yes' : 'No'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Patient-specific fields ── */}
      {!isDoctor && (
        <div>
          <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Gender:</p>
            {isEdit ? (
              <select
                className="max-w-32 bg-gray-100 border rounded px-1 outline-none"
                value={userData.gender || 'Other'}
                onChange={(e) => setUserData((prev) => ({ ...prev, gender: e.target.value }))}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-gray-400">{userData.gender}</p>
            )}

            <p className="font-medium">Birthday:</p>
            {isEdit ? (
              <input
                className="max-w-36 bg-gray-100 border rounded px-1 outline-none"
                type="date"
                value={userData.dob ? userData.dob.toString().slice(0, 10) : ''}
                onChange={(e) => setUserData((prev) => ({ ...prev, dob: e.target.value }))}
              />
            ) : (
              <p className="text-gray-400">
                {userData.dob ? userData.dob.toString().slice(0, 10) : '—'}
              </p>
            )}
          </div>
        </div>
      )}

      {saveMsg && <p className="text-sm mt-2">{saveMsg}</p>}

      <div className="mt-10">
        {isEdit ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="border border-primary text-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Information'}
            </button>
            <button
              onClick={() => { setIsEdit(false); setSaveMsg('') }}
              className="border border-gray-400 text-gray-600 px-6 py-2 rounded-full hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEdit(true)}
            className="border border-black px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

export default MyProfile
