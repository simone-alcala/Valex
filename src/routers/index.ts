import { Router } from 'express';

import cardsRouter from './cardsRouter.js';
import rechargesRouter from './rechargesRouter.js';
import paymentsRouter from './paymentsRouter.js';

const router = Router();

router.use(cardsRouter);
router.use(rechargesRouter);
router.use(paymentsRouter);

export default router;