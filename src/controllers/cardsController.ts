import { Request, Response } from 'express';

import * as service from '../services/cardsService.js';

export async function createCard(req: Request, res: Response) {

  const { apikey } = req.headers;
  const { employeeId, type } = req.body;

  await service.validateCreateCard(apikey, employeeId, type);

  res.sendStatus(201);

}

export async function activateCard(req: Request, res: Response) {

  const { id } = req.params;
  const { securityCode, password } = req.body;

  await service.validateActivateCard(id, securityCode, password);

  res.sendStatus(200);
}

export async function blockCard(req: Request, res: Response) {

  const { id: cardId } = req.params;
  const { password } = req.body;

  await service.validateBlockCard(cardId, password);

  res.sendStatus(200);
}

export async function unblockCard(req: Request, res: Response) {

  const { id: cardId } = req.params;
  const { password } = req.body;

  await service.validateUnblockCard(cardId, password);

  res.sendStatus(200);
}

/*export async function getCards(req: Request, res: Response) {
  res.status(200).send([]);
}*/

export async function getBalance(req: Request, res: Response) {
  
  const { id: cardId } = req.params;
  
  const transactions = await service.validateGetTransactions(cardId);

  res.status(200).send( transactions );
}