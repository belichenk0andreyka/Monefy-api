const express = require('express');
const cors = require('cors')
const connectDB = require('./config/db');

const app = express();

//Connect Database
connectDB();

// Init Middleware
app.use(cors())
app.use(express.json({ extended: false }))

app.get('/', (req, res) => res.send('API Running'));

// Define routes
app.use('/api/register', require('./routes/api/register'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/actions', require('./routes/api/actions'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
