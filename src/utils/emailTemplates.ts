import { sendMail } from '../config/mailer';

export const sendVerificationEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  await sendMail(
    email,
    'Verify your ShopHub account',
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#2563eb;">Welcome to ShopHub!</h2>
      <p>Your email verification code is:</p>
      <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;">${otp}</span>
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:14px;">If you didn't create an account, please ignore this email.</p>
    </div>
    `
  );
};

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<void> => {
  await sendMail(
    email,
    'Reset your ShopHub password',
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#2563eb;">Password Reset Request</h2>
      <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email.</p>
    </div>
    `
  );
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderId: string,
  total: number
): Promise<void> => {
  await sendMail(
    email,
    `Order Confirmed — #${orderId}`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#16a34a;">✅ Order Confirmed!</h2>
      <p>Your order <strong>#${orderId}</strong> has been placed successfully.</p>
      <p>Total Amount: <strong>₹${total.toFixed(2)}</strong></p>
      <p>We'll notify you when your order ships.</p>
    </div>
    `
  );
};

export const sendOtpResendEmail = async (email: string, otp: string): Promise<void> => {
  await sendMail(
    email,
    'Your new ShopHub verification code',
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#2563eb;">New Verification Code</h2>
      <p>Your new email verification code is:</p>
      <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:8px;margin:20px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;">${otp}</span>
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    </div>
    `
  );
};

export const sendShipmentNotification = async (
  email: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  trackingUrl?: string
): Promise<void> => {
  await sendMail(
    email,
    `Your ShopHub order #${orderNumber} has shipped!`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#2563eb;">🚚 Your Order Has Shipped!</h2>
      <p>Great news! Your order <strong>#${orderNumber}</strong> is on its way.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
        <p><strong>Carrier:</strong> ${carrier}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        ${trackingUrl ? `<p><a href="${trackingUrl}" style="color:#2563eb;">Track your shipment →</a></p>` : ''}
      </div>
    </div>
    `
  );
};

export const sendRefundConfirmation = async (
  email: string,
  orderNumber: string,
  amount: number
): Promise<void> => {
  await sendMail(
    email,
    `Refund processed for order #${orderNumber}`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#16a34a;">💸 Refund Processed</h2>
      <p>Your refund of <strong>₹${amount.toFixed(2)}</strong> for order <strong>#${orderNumber}</strong> has been processed.</p>
      <p>It may take 5–7 business days to appear in your account depending on your bank.</p>
    </div>
    `
  );
};
