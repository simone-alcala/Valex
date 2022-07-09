import { Router } from 'express';
import * as cards from '../controllers/cardsController.js';

const cardsRouter = Router();

cardsRouter.post('/cards'             , cards.createCard);
cardsRouter.put ('/cards/activate/:id', cards.activateCard);
cardsRouter.put ('/cards/block/:id'   , cards.blockCard);
cardsRouter.put ('/cards/unblock/:id' , cards.unblockCard);
cardsRouter.get ('/cards/:id'         , cards.getBalance);
//cardsRouter.get ('/cards/user/:id'    , cards.getCards);

export default cardsRouter;
