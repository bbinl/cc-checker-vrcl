document.getElementById("check-btn").addEventListener("click", async () => {
  const input = document.getElementById("numbers").value.trim();
  const cards = input.split("\n").filter(Boolean);
  const output = document.getElementById("result-output");
  output.value = "";

  const response = await fetch("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    output.value += chunk;
    output.scrollTop = output.scrollHeight;
  }
});