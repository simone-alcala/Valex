import { Request, Response } from 'express';

import * as service from '../services/rechargesService.js';

export async function createRechage(req: Request, res: Response) {

  const { apikey } = req.headers;
  const { cardId } = req.params;
  const { amount } = req.body;

  await service.validateCreateRecharge(apikey, cardId, amount);

  res.sendStatus(201);

}