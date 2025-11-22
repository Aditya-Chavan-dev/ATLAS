const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { admin, db } = require('./config/firebaseConfig');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ATLAS Backend is running' });
});

// Routes (Placeholders)
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
