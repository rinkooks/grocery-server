import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDb from './config/connectDb.js';

import userRouter from './routes/user.route.js';

const app = express();

app.use(cors());

app.use(express.json());
app.use(cookieParser());

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

app.get("/", (request, response) => {
    response.json({
        message: "server is running " + process.env.PORT
    });
});

app.use('/api/user', userRouter);

connectDb().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("Server is running", process.env.PORT);
    });
});
