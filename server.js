import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

app.use(cors({ origin: true }))
app.get('/', (req, res) => res.send('Hello from Node.js!'))

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
