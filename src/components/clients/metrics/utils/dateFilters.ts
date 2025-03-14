
import { Client } from "../../types";
import { isValid, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";

export const isClientActiveInMonth = (client: Client, monthStart: Date, monthEnd: Date): boolean => {
  try {
    if (!client.first_payment_date) return false;
    const clientStart = new Date(client.first_payment_date);
    clientStart.setDate(clientStart.getDate() + 1);
    
    const clientEnd = client.last_payment_date ? 
      (() => {
        const date = new Date(client.last_payment_date);
        date.setDate(date.getDate() + 1);
        return date;
      })() : 
      new Date();
    
    if (!isValid(clientStart)) return false;
    if (client.last_payment_date && !isValid(clientEnd)) return false;

    return isWithinInterval(monthStart, { start: clientStart, end: clientEnd }) ||
           isWithinInterval(monthEnd, { start: clientStart, end: clientEnd }) ||
           (clientStart <= monthStart && clientEnd >= monthEnd);
  } catch (error) {
    console.error("Error processing active client:", client, error);
    return false;
  }
};

export const isClientNewInMonth = (client: Client, monthStart: Date, monthEnd: Date): boolean => {
  try {
    if (!client.first_payment_date) return false;
    const firstPayment = new Date(client.first_payment_date);
    firstPayment.setDate(firstPayment.getDate() + 1);
    return isValid(firstPayment) && 
           isWithinInterval(firstPayment, { start: monthStart, end: monthEnd });
  } catch (error) {
    console.error("Error processing new client:", client, error);
    return false;
  }
};

export const isClientChurnedInMonth = (client: Client, monthStart: Date, monthEnd: Date): boolean => {
  if (!client.last_payment_date) return false;
  try {
    const lastPaymentDate = new Date(client.last_payment_date);
    lastPaymentDate.setDate(lastPaymentDate.getDate() + 1);
    return isValid(lastPaymentDate) && 
           isWithinInterval(lastPaymentDate, { start: monthStart, end: monthEnd });
  } catch (error) {
    console.error("Error processing churn date for client:", client, error);
    return false;
  }
};

export const getActiveClientsAtStartOfMonth = (clients: Client[], monthStart: Date): number => {
  return clients.filter((client: Client) => {
    if (!client.first_payment_date) return false;
    const clientStart = new Date(client.first_payment_date);
    clientStart.setDate(clientStart.getDate() + 1);
    
    return clientStart <= monthStart && 
           (!client.last_payment_date || new Date(client.last_payment_date) > monthStart);
  }).length;
};
