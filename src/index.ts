import express, { json } from 'express';
import 'express-async-errors';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

import router from './routers/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(json());
app.use(router);
app.use(errorHandler);

const port = +process.env.port || 4000;

app.listen(port, () => console.log(`Running on ${port}`));
