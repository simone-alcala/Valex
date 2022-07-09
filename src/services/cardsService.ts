import dayjs from 'dayjs';
import { faker } from '@faker-js/faker'; 
import Cryptr from 'cryptr';
import dotenv from 'dotenv';

import * as card from'../repositories/cardRepository.js';
import * as employee from'../repositories/employeeRepository.js';
import * as company from'../repositories/companyRepository.js';
import * as payment from '../repositories/paymentRepository.js';
import * as recharge from '../repositories/rechargeRepository.js';

dotenv.config();
const cryptr = new Cryptr(process.env.CRYPTR);

export async function validateCreateCard(apikey: string | string [], employeeId: number, cardType: string) {
  
  if (!apikey || !employeeId || !cardType) 
    throw { type: 'unprocessable_entity', message: 'apiKey, employeeId and cardType are required' }

  if ( !validateCardType(cardType) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card type' }
  
  const companyInfo = await getCompany(apikey as string); 

  if ( !companyInfo ) 
    throw { type: 'not_found', message: 'Company not found' }

  const employeeInfo = await getEmployee(employeeId); 

  if ( !employeeInfo || employeeInfo?.companyId !== companyInfo.id) 
    throw { type: 'not_found', message: 'Employee not found' }
    
  const cardAlreadyExists = await validateEmployeeVsCard(employeeId, cardType as card.TransactionTypes);
  
  if ( cardAlreadyExists )
    throw { type: 'conflict', message: 'Card already registered' }

  return createCard(employeeInfo, cardType);

}

function validateCardType (cardType: string) {
  const cardTypeList = ['groceries', 'restaurant', 'transport', 'education', 'health'];
  return cardTypeList.includes(cardType.toLowerCase());
}

async function getCompany(apikey: string){
  return await company.findByApiKey(apikey);
}

async function getEmployee(employeeId: number){
  return await employee.findById(employeeId);
}

async function validateEmployeeVsCard(employeeId: number, cardType: card.TransactionTypes){
  return await card.findByTypeAndEmployeeId(cardType , employeeId);
}

async function createCard(employeeInfo: any, cardType: string){
  const employeeId = employeeInfo.id;
  const cardNumber = generateCardNumber();
  const userName = getCardName(employeeInfo.fullName);
  const cvv = getEncryptCvc( generateCvv()) ;
  const expirationDate = generateExpirationDate();

  const newCard: card.CardInsertData = {
    employeeId : employeeId,
    number: cardNumber,
    cardholderName: userName,
    securityCode: cvv,
    expirationDate: expirationDate,
    isVirtual: true,
    isBlocked: false,
    type: cardType as card.TransactionTypes
  };

  return await card.insert(newCard);

}

function getCardName(employeeName: string){
  let fullName = employeeName.toUpperCase().split(' ');
  if (fullName.length <= 2 ) return fullName.join(' ');
  let name = [];
  name.push(fullName[0]);
  for (let i = 1; i < fullName.length; i++) {
    if ( i === fullName.length - 1) {
      name.push(fullName[i]);
    } else {
      if (fullName[i].length >= 3) name.push(fullName[i][0]);
      else name.push(fullName[i]);
    }
  }
  return name.join(' ');
}

function generateExpirationDate(){
  const today = dayjs();
  const expirationDate = today.add(5, 'year');
  return expirationDate.format('MM/YY');
}

function generateCvv(){
  return faker.finance.creditCardCVV();
}

function getEncryptCvc(cvv: string){
  return cryptr.encrypt(cvv);
}

function getDecryptCvc(cvv: string){
  return cryptr.decrypt(cvv);
}

function generateCardNumber(){
  return faker.finance.creditCardNumber();
}

export async function validateActivateCard(cardId: string, securityCode: string, password: number){
  if (!cardId || !securityCode || !password) 
    throw { type: 'unprocessable_entity', message: 'card id, securityCode and password are required' }

  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }

  if ( isNaN(password) || password.toString().length !== 4 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid password' }

  if ( isNaN(+securityCode) || securityCode.length !== 3 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid security code' }

  const cardInfo = await getCardById(+cardId);

  if (!cardInfo)
    throw { type: 'not_found', message: 'Card not found' }

  if (getDecryptCvc(cardInfo.securityCode) !== securityCode)   
    throw { type: 'unauthorized', message: 'Invalid security code' }

  if (isCardExpired(cardInfo.expirationDate))
    throw { type: 'conflict', message: 'Expired card' }

  if ( isActiveCard(cardInfo.password) )
    throw { type: 'conflict', message: 'Card already activated' }

  return await activateCard(cardInfo, password);
}

async function getCardById(cardId){
  return await card.findById(cardId);
}

function isCardExpired(expirationDate: string){
  const today = dayjs().format('YY/MM');
  const convertedExpirationDate = expirationDate.split('/').reverse().join('/');

  return today > convertedExpirationDate;
}

function isActiveCard(password: string){
  if (password) return true;
  return false;
}

async function activateCard(cardInfo: any, password: number) {

  const updateCard: card.CardUpdateData = {
    password: cryptr.encrypt(password)
  };

  return await card.update(cardInfo.id,updateCard);
}

export async function validateBlockCard(cardId: string, password: number){
  if (!cardId || !password) 
    throw { type: 'unprocessable_entity', message: 'card id and password are required' }

  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }

  if ( isNaN(password) || password.toString().length !== 4 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid password' }

  const cardInfo = await getCardById(+cardId);

  if (!cardInfo)
    throw { type: 'not_found', message: 'Card not found' }

  if (getDecryptPassword(cardInfo.password) !== password.toString())
    throw { type: 'unauthorized', message: 'Invalid password' }  

  if (isCardExpired(cardInfo.expirationDate))
    throw { type: 'conflict', message: 'Expired card' }

  if ( cardInfo.isBlocked )
    throw { type: 'conflict', message: 'Card already blocked' }

  return await blockCard(cardInfo);
}

function getDecryptPassword(password: string){
  return cryptr.decrypt(password);
}

async function blockCard(cardInfo: any){
  const updateCard: card.CardUpdateData = {
    isBlocked: true
  };

  return await card.update(cardInfo.id,updateCard);
}

export async function validateUnblockCard(cardId: string, password: number){
  if (!cardId || !password) 
    throw { type: 'unprocessable_entity', message: 'card id and password are required' }

  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }

  if ( isNaN(password) || password.toString().length !== 4 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid password' }

  const cardInfo = await getCardById(+cardId);

  if (!cardInfo)
    throw { type: 'not_found', message: 'Card not found' }

  if (getDecryptPassword(cardInfo.password) !== password.toString())
    throw { type: 'unauthorized', message: 'Invalid password' }  

  if (isCardExpired(cardInfo.expirationDate))
    throw { type: 'conflict', message: 'Expired card' }

  if ( !cardInfo.isBlocked )
    throw { type: 'conflict', message: 'Card already unblocked' }

  return await unblockCard(cardInfo);
}

async function unblockCard(cardInfo: any){
  const updateCard: card.CardUpdateData = {
    isBlocked: false
  };

  return await card.update(cardInfo.id,updateCard);
}

export async function validateGetTransactions(cardId: string){
  if (!cardId ) 
    throw { type: 'unprocessable_entity', message: 'card id is required' }

  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }
  
  const cardInfo = await getCardById(+cardId);

  if (!cardInfo)
    throw { type: 'not_found', message: 'Card not found' }

  return await getTransactions(+cardId);
}

async function getTransactions(cardId: number){
  const transactions = await payment.findByCardId(cardId);
  const recharges = await recharge.findByCardId(cardId);

  const balanceTemp = transactions.reduce((prev, cur) => prev + cur.amount, 0);
  const balance = recharges.reduce((prev, cur) => prev + cur.amount, balanceTemp);

  return { balance, transactions, recharges };
}