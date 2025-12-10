import { CallReport } from '../types';

export const sendToZapier = async (webhookUrl: string, data: Record<string, any>) => {
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        console.warn("Zapier request might have failed or is opaque.");
    }
  } catch (error) {
    console.error("Error sending to Zapier:", error);
  }
};