import dayjs from 'dayjs';
import * as card from'../repositories/cardRepository.js';
import * as employee from'../repositories/employeeRepository.js';
import * as company from'../repositories/companyRepository.js';
import * as recharge from '../repositories/rechargeRepository.js';

export async function validateCreateRecharge(apikey: string | string [], cardId: string, amount: number){

  if (!apikey || !cardId || !amount) 
    throw { type: 'unprocessable_entity', message: 'apiKey, cardId and amount are required' }

  if ( isNaN(+cardId) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid card id' }

  if ( isNaN(amount) ) 
    throw { type: 'unprocessable_entity', message: 'Invalid amount' }  

  if ( +amount <= 0 ) 
    throw { type: 'unprocessable_entity', message: 'Invalid amount' }

  const companyInfo = await getCompany(apikey as string); 

  if ( !companyInfo ) 
    throw { type: 'not_found', message: 'Company not found' }
  
  const cardInfo = await getCard(+cardId); 

  if ( !cardInfo ) 
    throw { type: 'not_found', message: 'Card not found' }

  const employeeInfo = await getEmployee(cardInfo.employeeId); 

  if ( !employeeInfo || employeeInfo?.companyId !== companyInfo.id) 
    throw { type: 'not_found', message: 'Card not found' }

  if ( !isActiveCard(cardInfo.password) ) 
    throw { type: 'conflict', message: 'Card not active' }  

  if (isCardExpired(cardInfo.expirationDate))
    throw { type: 'conflict', message: 'Expired card' }  
 
  return await createRecharge(+cardId, amount);

}

async function createRecharge(cardId: number, amount: number){
  const newRecharge: recharge.RechargeInsertData = {
    cardId: cardId,
    amount: amount
  };
  return await recharge.insert(newRecharge);
}
  
async function getCompany(apikey: string){
  return await company.findByApiKey(apikey);
}

async function getEmployee(employeeId: number){
  return await employee.findById(employeeId);
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