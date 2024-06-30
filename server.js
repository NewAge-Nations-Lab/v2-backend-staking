import 'dotenv/config';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import bodyParser from "body-parser";
import cors from 'cors';
import { connect } from "./config/connectionState.js";
import authRoute from "./routes/authRoute.js";
import userRouter from './routes/userRoute.js';
import balancesRouter from './routes/balancesRoute.js';
import stakingRouter from './routes/stakingRoute.js';



const app = express();


const allowedOrigins = ['http://localhost:3001', 'http://localhost:3001', 'https://newage-staking-v2.vercel.app/' ]; // Add other allowed origins if necessary

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "Monkeylovestoeatbanana",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'development', // true in production, false otherwise
      sameSite: 'lax'
    }
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

