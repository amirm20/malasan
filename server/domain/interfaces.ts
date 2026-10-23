/**
 * Payment Gateway Abstraction & Core Repository Interfaces
 */

export interface PaymentRequestParams {
  orderId: string;
  orderNumber: string;
  amountTomans: number;
  description: string;
  customerMobile?: string;
  customerEmail?: string;
  callbackUrl: string;
}

export interface PaymentRequestResult {
  isSuccess: boolean;
  gatewayName: string;
  authority: string;
  paymentUrl: string;
  errorMessage?: string;
}

export interface PaymentVerifyParams {
  authority: string;
  amountTomans: number;
  status?: 'OK' | 'NOK';
}

export interface PaymentVerifyResult {
  isSuccess: boolean;
  gatewayName: string;
  refId: string;
  maskedCardPan?: string;
  code?: number;
  message: string;
}

/**
 * Abstract Payment Gateway Interface
 * Supports easy swapping between ZarinPal, IDPay, NextPay, Mellat, or Test Gateway
 */
export interface IPaymentGateway {
  readonly gatewayName: string;
  requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult>;
  verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerifyResult>;
}
