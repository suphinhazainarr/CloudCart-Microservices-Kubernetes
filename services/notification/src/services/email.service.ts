// In production: replace console.log with Nodemailer / SendGrid / Resend

export interface OrderEmailData {
  to:          string;
  firstName:   string;
  orderNumber: string;
  total:       number;
  status:      string;
}

class EmailService {

  async sendOrderConfirmation(data: OrderEmailData): Promise<void> {
    // Production: await transporter.sendMail({ to: data.to, subject: `Order ${data.orderNumber} confirmed`, html: template })
    console.warn(`[notification] ORDER CONFIRMED email → ${data.to}`);
    console.warn(`  Order: ${data.orderNumber} | Total: $${data.total}`);
  }

  async sendOrderShipped(data: OrderEmailData & { trackingNumber: string }): Promise<void> {
    console.warn(`[notification] ORDER SHIPPED email → ${data.to}`);
    console.warn(`  Order: ${data.orderNumber} | Tracking: ${data.trackingNumber}`);
  }

  async sendOrderDelivered(data: OrderEmailData): Promise<void> {
    console.warn(`[notification] ORDER DELIVERED email → ${data.to}`);
  }

  async sendPaymentFailed(data: OrderEmailData): Promise<void> {
    console.warn(`[notification] PAYMENT FAILED email → ${data.to}`);
  }
}

export const emailService = new EmailService();
