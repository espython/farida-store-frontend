import PaymobService from '@/services/paymobService';
import {
  validatePaymobCallback,
  maskSensitiveData
} from '@/utils/paymentValidation';

export interface OrderData {
  id: number | string;
  total?: number | string | null;
  payment_method?: string;
  payment_status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ServerPaymentResult {
  order: OrderData;
  payment: {
    paymentKey: string;
    paymobOrderId: number | string;
    amountCents: number;
    currency: string;
  } | null;
  alreadyExists?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  message?: string;
}

class PaymentStore {
  // Loading states
  isInitiatingPayment = false;
  isProcessingPayment = false;
  
  // Payment data
  currentPaymentKey: string | null = null;
  currentIframeUrl: string | null = null;
  createdOrderId: number | string | null = null;
  createdPaymobOrderId: number | string | null = null;
  paymentResult: PaymentResult | null = null;
  
  // Error handling
  paymentError: string | null = null;
  
  // Services
  private paymobService: PaymobService;

  constructor() {
    this.paymobService = new PaymobService();

  }

  // Reset payment state
  resetPaymentState = () => {
    {
      this.isInitiatingPayment = false;
      this.isProcessingPayment = false;
      this.currentPaymentKey = null;
      this.currentIframeUrl = null;
      this.createdOrderId = null;
      this.createdPaymobOrderId = null;
      this.paymentResult = null;
      this.paymentError = null;
    }
  };

  // The Paymob order and payment key are created server-side (POST
  // /order-details/checkout with paymentMethod "card"). This store only
  // renders the returned payment key in Paymob's hosted iframe — no Paymob
  // secret ever reaches the browser (#179, #180).
  setServerPayment = (result: ServerPaymentResult): string | null => {
    const paymentKey = result?.payment?.paymentKey;
    {
      this.createdOrderId = result?.order?.id ?? null;
      this.createdPaymobOrderId = result?.payment?.paymobOrderId ?? null;
      if (!paymentKey) {
        this.paymentError = 'Payment could not be initiated';
        return null;
      }
      this.currentPaymentKey = paymentKey;
      this.currentIframeUrl = this.paymobService.getIframeUrl({
        paymentKey,
      });
      this.isInitiatingPayment = false;
    }
    return paymentKey || null;
  };

  // Handle payment callback
  handlePaymentCallback = (params: URLSearchParams) => {
    {
      this.isProcessingPayment = true;
    }

    try {
      // Validate callback parameters
      const validation = validatePaymobCallback(params);
      if (!validation.isValid) {
        console.error('Invalid callback parameters:', validation.errors);
        throw new Error(`Invalid callback: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Callback validation warnings:', validation.warnings);
      }

      const success = params.get('success');
      const transactionId = params.get('id');
      const orderId = params.get('order');
      const amount = params.get('amount_cents');
      const pending = params.get('pending');
      const errorOccurred = params.get('error_occured');

      let paymentResult: PaymentResult;

      // Log callback data for debugging (masked)
      console.log('Processing payment callback:', maskSensitiveData({
        success,
        transactionId,
        orderId,
        amount,
        pending,
        errorOccurred
      }));

      if (success === 'true' && errorOccurred !== 'true') {
        paymentResult = {
          success: true,
          transactionId: transactionId || undefined,
          orderId: orderId || undefined,
          amount: amount ? parseInt(amount) / 100 : undefined,
          message: 'Payment completed successfully'
        };
      } else if (pending === 'true') {
        paymentResult = {
          success: false,
          transactionId: transactionId || undefined,
          orderId: orderId || undefined,
          amount: amount ? parseInt(amount) / 100 : undefined,
          message: 'Payment is pending'
        };
      } else {
        paymentResult = {
          success: false,
          transactionId: transactionId || undefined,
          orderId: orderId || undefined,
          amount: amount ? parseInt(amount) / 100 : undefined,
          message: errorOccurred === 'true' ? 'Payment error occurred' : 'Payment failed'
        };
      }

      {
        this.paymentResult = paymentResult;
        this.isProcessingPayment = false;
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment callback processing error:', error);

      const errorResult: PaymentResult = {
        success: false,
        message: 'Error processing payment callback'
      };

      {
        this.paymentResult = errorResult;
        this.paymentError = error instanceof Error ? error.message : 'Callback processing failed';
        this.isProcessingPayment = false;
      }

      return errorResult;
    }
  };

  // Format amount for display
  formatAmount = (amount: number, currency: string = 'EGP'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
}

export default PaymentStore;
