const express = require('express')

const app = express();


app.get("/test", (req,resp)=>{
    resp.send("Api is working properly")
})




app.listen(5000, ()=>{
     console.log("server started on port 5000");
     
})