export const sendToIntegrations = async (urls: { makeUrl?: string }, data: Record<string, any>) => {
  if (urls.makeUrl) {
    try {
      await fetch(urls.makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("Make Error:", err);
    }
  }
};