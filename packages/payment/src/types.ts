export interface CreateOrderRequest {
    assetId: string;
    licenseType: "usage" | "source";
    buyerId: string;
    buyerEmail: string;
    buyerName: string;
    buyerPhone?: string;
}

export interface CreateOrderResponse {
    orderId: string;
    paymentSessionId: string;
    orderAmount: number;
}

export interface PaymentVerificationResponse {
    orderId: string;
    orderStatus: "PAID" | "ACTIVE" | "EXPIRED" | "FAILED";
    paymentStatus: "SUCCESS" | "PENDING" | "FAILED" | "USER_DROPPED";
    paymentMethod?: string;
    paymentTime?: string;
    transactionId?: string;
}

export interface WebhookPayload {
    type: string;
    data: {
        order: {
            order_id: string;
            order_amount: number;
            order_currency: string;
            order_status: string;
        };
        payment: {
            cf_payment_id: string;
            payment_status: string;
            payment_amount: number;
            payment_time: string;
            payment_method?: string;
        };
        customer_details: {
            customer_name: string;
            customer_email: string;
            customer_phone: string;
        };
    };
}
