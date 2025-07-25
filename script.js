export default async function handler(req, res) {
  // 1️⃣ Allow only POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  const { cards } = req.body;

  // 2️⃣ Validate cards input
  if (!cards || !Array.isArray(cards)) {
    res.status(400).json({ error: 'Invalid input: cards array is required.' });
    return;
  }

  // 3️⃣ Setup Server-Sent Events (SSE) headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Important for Vercel streaming

  // 4️⃣ Process cards one by one
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i].trim();
    if (!card) continue;

    let result = { card, status: 'Unknown' };

    try {
      const apiURL = `https://drlabapis.onrender.com/api/chk?cc=${encodeURIComponent(card)}`;
      const apiRes = await fetch(apiURL);
      const data = await apiRes.json();

      result.status = data.response || 'Unknown';
    } catch (err) {
      result.error = err.message || 'Error';
    }

    // 5️⃣ Send the individual result
    res.write(`data: ${JSON.stringify(result)}\n\n`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 6️⃣ Mark stream done
  res.write(`event: done\ndata: complete\n\n`);
  res.end();
}
