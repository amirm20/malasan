import {
  IPaymentGateway,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyParams,
  PaymentVerifyResult,
} from '../domain/interfaces.js';

/**
 * ZarinPal Payment Gateway Implementation
 */
export class ZarinPalPaymentGateway implements IPaymentGateway {
  readonly gatewayName = 'زرین‌پال (ZarinPal)';
  private merchantId: string;
  private isSandbox: boolean;

  constructor(merchantId?: string, isSandbox = true) {
    this.merchantId = merchantId || process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000';
    this.isSandbox = isSandbox;
  }

  async requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult> {
    // If merchantId is default dummy or in test mode, return local simulation payment endpoint
    if (!this.merchantId || this.merchantId === '00000000-0000-0000-0000-000000000000') {
      if (process.env.NODE_ENV === 'production') {
        return {
          isSuccess: false,
          gatewayName: this.gatewayName,
          authority: '',
          paymentUrl: '',
          errorMessage: 'درگاه پرداخت در محیط عملیاتی پیکربندی نشده است.',
        };
      }
      const simulatedAuthority = `ZP_SIM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      return {
        isSuccess: true,
        gatewayName: this.gatewayName,
        authority: simulatedAuthority,
        paymentUrl: `/checkout/payment-simulator?authority=${simulatedAuthority}&amount=${params.amountTomans}&orderId=${params.orderId}&orderNumber=${params.orderNumber}`,
      };
    }

    try {
      // Standard ZarinPal REST API
      const baseUrl = this.isSandbox
        ? 'https://sandbox.zarinpal.com/pg/v4/payment'
        : 'https://api.zarinpal.com/pg/v4/payment';

      const response = await fetch(`${baseUrl}/request.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: params.amountTomans * 10, // Rials
          description: params.description,
          callback_url: params.callbackUrl,
          metadata: {
            mobile: params.customerMobile,
            email: params.customerEmail,
            order_id: params.orderId,
          },
        }),
      });

      const data = (await response.json()) as any;
      if (data?.data?.code === 100 && data?.data?.authority) {
        const payUrl = this.isSandbox
          ? `https://sandbox.zarinpal.com/pg/StartPay/${data.data.authority}`
          : `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`;
        return {
          isSuccess: true,
          gatewayName: this.gatewayName,
          authority: data.data.authority,
          paymentUrl: payUrl,
        };
      }

      return {
        isSuccess: false,
        gatewayName: this.gatewayName,
        authority: '',
        paymentUrl: '',
        errorMessage: data?.errors?.message || 'خطا در ارتباط با درگاه زرین‌پال',
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        gatewayName: this.gatewayName,
        authority: '',
        paymentUrl: '',
        errorMessage: err?.message || 'خطای اتصال به سرور زرین‌پال',
      };
    }
  }

  async verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
    // Simulator is development-only and the API must verify that the authority
    // was issued for this exact order before calling this method.
    if (params.authority.startsWith('ZP_SIM_')) {
      if (process.env.NODE_ENV === 'production') {
        return { isSuccess: false, gatewayName: this.gatewayName, refId: '', code: -1, message: 'پرداخت شبیه‌سازی‌شده در محیط عملیاتی مجاز نیست.' };
      }
      if (params.status === 'NOK') {
        return { isSuccess: false, gatewayName: this.gatewayName, refId: '', code: -2, message: 'پرداخت توسط کاربر لغو شد.' };
      }
      const refId = `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return {
        isSuccess: true,
        gatewayName: this.gatewayName,
        refId,
        maskedCardPan: '6037-99**-****-4512',
        code: 100,
        message: 'پرداخت تستی با موفقیت شبیه‌سازی و تأیید شد.',
      };
    }

    try {
      const baseUrl = this.isSandbox
        ? 'https://sandbox.zarinpal.com/pg/v4/payment'
        : 'https://api.zarinpal.com/pg/v4/payment';

      const response = await fetch(`${baseUrl}/verify.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: params.amountTomans * 10, // Rials
          authority: params.authority,
        }),
      });

      const data = (await response.json()) as any;
      if (data?.data?.code === 100 || data?.data?.code === 101) {
        return {
          isSuccess: true,
          gatewayName: this.gatewayName,
          refId: String(data.data.ref_id),
          maskedCardPan: data.data.card_pan,
          code: data.data.code,
          message: 'پرداخت با موفقیت توسط شاپرک تأیید شد.',
        };
      }

      return {
        isSuccess: false,
        gatewayName: this.gatewayName,
        refId: '',
        code: data?.data?.code || -1,
        message: data?.errors?.message || 'تأیید تراکنش ناموفق بود یا توسط کاربر لغو شده است.',
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        gatewayName: this.gatewayName,
        refId: '',
        message: err?.message || 'خطای سیستمی در استعلام تراکنش',
      };
    }
  }
}
