import 'dotenv/config';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import bodyParser from "body-parser";
import cors from 'cors';
import { connect, disconnect } from "./config/connectionState.js";
import authRoute from "./routes/authRoute.js";
import userRouter from './routes/userRoute.js';
import balancesRouter from './routes/balancesRoute.js';
import stakingRouter from './routes/stakingRoute.js';



const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "Monkey loves to eat banana",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



connect();


app.use("/api/auth", authRoute);
app.use("/api/user", userRouter);
app.use('/api/balances', balancesRouter);
app.use('/api/stake', stakingRouter);






app.get("/api", (req, res) => {
    res.json({ message: "Welcome to /api" });
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to newage coin" });
});





app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port 3000");
});

