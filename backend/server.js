import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors()) // Allow all origins — for development only
app.use(express.json())

// Your API routes here...

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
