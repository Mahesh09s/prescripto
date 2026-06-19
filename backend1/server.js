// backend/server.js
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

// In-memory appointments array (for demo)
let appointments = [
  {
    id: 1,
    name: "Dr. Smith",
    image: "https://via.placeholder.com/150",
    date: "2025-08-12",
    time: "10:00 AM",
    fees: 500
  },
  {
    id: 2,
    name: "Dr. Jane",
    image: "https://via.placeholder.com/150",
    date: "2025-08-13",
    time: "11:00 AM",
    fees: 600
  }
]

// GET all appointments
app.get('/api/appointments', (req, res) => {
  res.json(appointments)
})

// DELETE appointment by id
app.delete('/api/appointments/:id', (req, res) => {
  const id = parseInt(req.params.id)
  appointments = appointments.filter(appt => appt.id !== id)
  res.json({ message: 'Appointment cancelled' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
