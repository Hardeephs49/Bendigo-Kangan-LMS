declare namespace ApplePayJS {
    interface ApplePayPaymentRequest {
        countryCode: string;
        currencyCode: string;
        supportedNetworks: string[];
        merchantCapabilities: string[];
        total: {
            label: string;
            amount: string;
        };
    }

    interface ApplePayPaymentToken {
        paymentData: any;
        paymentMethod: any;
        transactionIdentifier: string;
    }

    interface ApplePayPayment {
        token: ApplePayPaymentToken;
        billingContact?: any;
        shippingContact?: any;
    }

    interface ApplePayPaymentAuthorizedEvent {
        payment: ApplePayPayment;
    }

    class ApplePaySession {
        static STATUS_SUCCESS: number;
        static STATUS_FAILURE: number;
        static canMakePayments(): boolean;
        static canMakePaymentsWithActiveCard(merchantIdentifier: string): Promise<boolean>;

        constructor(version: number, paymentRequest: ApplePayPaymentRequest);
        begin(): void;
        completePayment(status: number): void;
        onpaymentauthorized: (event: ApplePayPaymentAuthorizedEvent) => void;
        oncancel: () => void;
    }
}

declare global {
    interface Window {
        ApplePaySession?: typeof ApplePayJS.ApplePaySession;
    }
} 