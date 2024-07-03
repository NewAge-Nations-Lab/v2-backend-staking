import 'dotenv/config';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local'; 
import bodyParser from "body-parser";
import cors from 'cors';
import { connect } from "./config/connectionState.js";
import authRoute from "./routes/authRoute.js";
import userRouter from './routes/userRoute.js';
import balancesRouter from './routes/balancesRoute.js';
import stakingRouter from './routes/stakingRoute.js';
import User from "./models/user.js"; // Add this to import the User model


const app = express();


// Middleware
app.use(cors({
    origin: 'http://localhost:3001', // Frontend URL
    credentials: true,
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "Monkeylovestoeatbanana",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Connect to the database
connect();

// Passport local strategy
passport.use(new LocalStrategy(User.authenticate()));

// Serialize user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

