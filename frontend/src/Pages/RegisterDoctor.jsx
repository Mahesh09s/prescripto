import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const SPECIALITIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
]

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  speciality: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
  },
}

const RegisterDoctor = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverMsg, setServerMsg] = useState({ text: '', type: '' })

  /* ── Field change handler ─────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setServerMsg({ text: '', type: '' })

    if (['street', 'city', 'state', 'pincode'].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  /* ── Client-side validation ───────────────────────────────────── */
  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'Name is required.'
    if (!formData.email.trim()) {
      errs.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address.'
    }
    if (!formData.password) {
      errs.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    if (!formData.speciality) errs.speciality = 'Please select a speciality.'
    if (!formData.address.city.trim()) errs.city = 'City is required.'
    if (!formData.address.state.trim()) errs.state = 'State is required.'
    return errs
  }

  /* ── Submit ───────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setServerMsg({ text: '', type: '' })
    try {
      const { data } = await api.post('/doctors/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        speciality: formData.speciality,
        address: formData.address,
      })

      if (data.success) {
        setServerMsg({ text: '✅ Registered successfully! Redirecting to login…', type: 'success' })
        setFormData(initialForm)
        setTimeout(() => navigate('/login'), 1800)
      } else {
        setServerMsg({ text: data.message || 'Registration failed.', type: 'error' })
      }
    } catch (err) {
      setServerMsg({
        text: '❌ ' + (err.response?.data?.message || 'Server error. Please try again.'),
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  /* ── Input helper ─────────────────────────────────────────────── */
  const Field = ({ id, label, name, type = 'text', placeholder, required }) => (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={
          ['street', 'city', 'state', 'pincode'].includes(name)
            ? formData.address[name]
            : formData[name]
        }
        onChange={handleChange}
        className={`border rounded w-full p-2 text-sm ${
          errors[name] ? 'border-red-400 bg-red-50' : 'border-zinc-300'
        }`}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-1 text-gray-800">Doctor Registration</h2>
      <p className="text-sm text-gray-500 mb-6">
        Create your doctor account to start accepting appointments.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Personal */}
        <Field id="reg-name" label="Full Name" name="name" placeholder="Dr. John Smith" required />
        <Field id="reg-email" label="Email" name="email" type="email" placeholder="doctor@example.com" required />
        <Field id="reg-password" label="Password" name="password" type="password" placeholder="Min 6 characters" required />
        <Field id="reg-confirm" label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter password" required />

        {/* Speciality */}
        <div className="w-full">
          <label htmlFor="reg-speciality" className="block text-sm font-medium text-gray-700 mb-1">
            Speciality <span className="text-red-500">*</span>
          </label>
          <select
            id="reg-speciality"
            name="speciality"
            value={formData.speciality}
            onChange={handleChange}
            className={`border rounded w-full p-2 text-sm ${
              errors.speciality ? 'border-red-400 bg-red-50' : 'border-zinc-300'
            }`}
          >
            <option value="">— Select speciality —</option>
            {SPECIALITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.speciality && (
            <p className="text-red-500 text-xs mt-1">{errors.speciality}</p>
          )}
        </div>

        {/* Address */}
        <p className="text-sm font-semibold text-gray-600 mt-2">Practice Address</p>
        <Field id="reg-street" label="Street" name="street" placeholder="123 Medical Ave" />
        <div className="grid grid-cols-2 gap-3">
          <div className="w-full">
            <label htmlFor="reg-city" className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-city"
              name="city"
              value={formData.address.city}
              onChange={handleChange}
              placeholder="Mumbai"
              className={`border rounded w-full p-2 text-sm ${
                errors.city ? 'border-red-400 bg-red-50' : 'border-zinc-300'
              }`}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          <div className="w-full">
            <label htmlFor="reg-state" className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-state"
              name="state"
              value={formData.address.state}
              onChange={handleChange}
              placeholder="Maharashtra"
              className={`border rounded w-full p-2 text-sm ${
                errors.state ? 'border-red-400 bg-red-50' : 'border-zinc-300'
              }`}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
        </div>
        <Field id="reg-pincode" label="Pincode" name="pincode" placeholder="400001" />

        {/* Server message */}
        {serverMsg.text && (
          <p
            className={`text-sm font-medium ${
              serverMsg.type === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {serverMsg.text}
          </p>
        )}

        <button
          id="reg-submit"
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-medium mt-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {loading ? 'Registering…' : 'Register as Doctor'}
        </button>

        <p className="text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-primary underline cursor-pointer"
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  )
}

export default RegisterDoctor
