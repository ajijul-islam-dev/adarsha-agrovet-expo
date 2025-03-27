import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

app.use(express.json());
app.use(cors({
  origin : "*"
}))


app.get('/',(req,res)=>{
  res.send('adarsha server is xonnected');
})


app.listen(PORT,()=>{
  console.log('server is running on PORT ',PORT);
})