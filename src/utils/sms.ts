import axios from 'axios';
import { logger } from './logger';

/**
 * Send OTP via Fast2SMS Bulk API
 * Docs: https://docs.fast2sms.com
 */
export const sendSmsOtp = async (phone: string, otp: string): Promise<void> => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    logger.warn(`[SMS] FAST2SMS_API_KEY not set. OTP for ${phone}: ${otp}`);
    return; // graceful degradation in dev
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        variables_values: otp,
        route: 'otp',
        numbers: phone,
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    logger.info(`[SMS] OTP sent to ${phone}. Status: ${response.data?.return}`);
  } catch (err: any) {
    logger.error(`[SMS] Failed to send OTP to ${phone}:`, err?.response?.data || err.message);
    throw new Error('Failed to send SMS OTP. Please try again.');
  }
};
