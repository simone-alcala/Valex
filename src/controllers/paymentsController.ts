import { Request, Response } from 'express';

import * as service from '../services/paymentsService.js';

export async function createPayment(req: Request, res: Response) {

  const { cardId } = req.params;
  const { password, businessId, amount } = req.body;

  await service.validateCreatePayment(cardId, password, businessId, amount);

  res.sendStatus(201);

}