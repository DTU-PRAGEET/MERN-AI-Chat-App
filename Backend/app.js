import express from "express";
import morgan from "morgan"; //// used to console any request coming from any route and it's details
import connect from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser"; // used to parse cookies from the request

connect();

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser()); 

app.use('/users', userRoutes);

app.get("/", (req, res) =>{
    res.send('hello world ai chat bot');
})

export default app; 

