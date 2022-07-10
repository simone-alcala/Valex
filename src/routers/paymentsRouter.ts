import { Router } from 'express';
import * as payments from '../controllers/paymentsController.js';

const paymentsRouter = Router();

paymentsRouter.post('/payments/:cardId', payments.createPayment);

export default paymentsRouter;
