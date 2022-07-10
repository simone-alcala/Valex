import { Router } from 'express';
import * as recharges from '../controllers/rechargesController.js';

const rechargesRouter = Router();

rechargesRouter.post('/recharges/:cardId', recharges.createRechage);

export default rechargesRouter;
