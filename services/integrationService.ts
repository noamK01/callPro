export const sendToIntegrations = async (urls: { zapierUrl?: string; makeUrl?: string }, data: Record<string, any>) => {
  const promises = [];

  if (urls.zapierUrl) {
    promises.push(
      fetch(urls.zapierUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.error("Zapier Error:", err))
    );
  }

  if (urls.makeUrl) {
    promises.push(
      fetch(urls.makeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.error("Make Error:", err))
    );
  }

  await Promise.all(promises);
};