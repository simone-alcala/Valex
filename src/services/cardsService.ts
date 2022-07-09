import dayjs from 'dayjs';
import { faker } from '@faker-js/faker'; 
import Cryptr from 'cryptr';
import dotenv from 'dotenv';

import * as card from'../repositories/cardRepository.js';
import * as employee from'../repositories/employeeRepository.js';
import * as company from'../repositories/companyRepository.js';

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
    isBlocked: true,
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

