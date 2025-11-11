const express = require('express')
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();
require('./config/db');

const port = process.env.PORT

const app = express();

app.use(express.json());



app.use('/api/auth', authRoutes);

app.get("/test", (req,resp)=>{
    resp.send("Api is working properly")
})



app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});


app.listen(port, ()=>{
     console.log(`server started on port ${port}`);
     
})