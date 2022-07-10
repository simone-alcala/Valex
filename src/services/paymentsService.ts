import dayjs from 'dayjs';
import Cryptr from 'cryptr';
import dotenv from 'dotenv';

import * as card from'../repositories/cardRepository.js';
import * as recharge from '../repositories/rechargeRepository.js';
import * as business from '../repositories/businessRepository.js';
import * as payment from '../repositories/paymentRepository.js';

dotenv.config();
const cryptr = new Cryptr(process.env.CRYPTR);

export async function validateCreatePayment(cardId: string, password: number, businessId: number, amount: number){
    
  if (!cardId || !password|| !businessId|| !amount) 
    throw { type: 'unprocessable_entity', message: 'cardId password, businessId and amount are required' }
  
  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }
  
  if ( isNaN(businessId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid business id' }  
  
  if ( isNaN(amount) || +amount <= 0 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid amount' }  
  
  const businessInfo = await getBusiness(+businessId);
  
  if (!businessInfo)
    throw { type: 'not_found', message: 'Business not found' }
  
  const cardInfo = await getCard(+cardId); 
  
  if ( !cardInfo ) 
    throw { type: 'not_found', message: 'Card not found' }
  
  if (businessInfo.type !== cardInfo.type)
    throw { type: 'unauthorized', message: 'Unauthorized card type' }
  
  if ( !isActiveCard(cardInfo.password) ) 
    throw { type: 'conflict', message: 'Card not active' }  
  
  if (isCardExpired(cardInfo.expirationDate))
    throw { type: 'conflict', message: 'Expired card' }  
  
  if (cardInfo.isBlocked) 
    throw { type: 'conflict', message: 'Blocked card' }    
  
  if (getEncryptPassword(password.toString()) === cardInfo.password) 
    throw { type: 'unauthorized', message: 'Invalid password' }     
  
  const balance = await getBalance(+cardId);
  
  if ( balance < +amount)  {
    throw { type: 'unauthorized', message: 'Not sufficient funds' }    
  }

  return await createPayment(+cardId, +businessId, amount);

}

async function createPayment(cardId: number,  businessId: number, amount: number){

  const newPayment : payment.PaymentInsertData = {
    cardId: cardId, 
    businessId: businessId, 
    amount: amount
  };
  return await payment.insert(newPayment);
}
  
async function getCard(cardId: number){
  return await card.findById(cardId);
}

function isActiveCard(password: string){
  if (password) return true;
  return false;
}

function isCardExpired(expirationDate: string){
  const today = dayjs().format('YY/MM');
  const convertedExpirationDate = expirationDate.split('/').reverse().join('/');
  return today > convertedExpirationDate;
}

function getEncryptPassword(password: string){
  return cryptr.encrypt(password);
}

async function getBusiness(businessId: number) {
  return await business.findById(businessId);
}

async function getBalance(cardId: number){
  const transactions = await payment.findByCardId(cardId);
  const recharges = await recharge.findByCardId(cardId);

  const balanceTemp = transactions.reduce((prev, cur) => prev + cur.amount, 0);
  const balance = recharges.reduce((prev, cur) => prev + cur.amount, balanceTemp);

  return balance;
}