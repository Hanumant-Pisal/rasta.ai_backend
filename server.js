const express = require('express')

require('dotenv').config();
require('./config/db');

const app = express();

app.use(express.json());



app.get("/test", (req,resp)=>{
    resp.send("Api is working properly")
})




app.listen(5000, ()=>{
     console.log("server started on port 5000");
     
})