document.addEventListener('DOMContentLoaded', () => {
  const checkBtn = document.getElementById("check-btn");
  const stopCheckBtn = document.getElementById("stop-check-btn");
  const numbersTextarea = document.getElementById("numbers");
  const resultOutputTextarea = document.getElementById("result-output");

  const liveNumbersTextarea = document.getElementById("ali-numbers");
  const deadNumbersTextarea = document.getElementById("muhammad-numbers");
  const unknownNumbersTextarea = document.getElementById("murad-numbers");

  const liveCountSpan = document.getElementById("ali-count");
  const deadCountSpan = document.getElementById("muhammad-count");
  const unknownCountSpan = document.getElementById("murad-count");

  let liveCount = 0, deadCount = 0, unknownCount = 0;
  let eventSource;

  checkBtn.addEventListener("click", async () => {
    const cards = numbersTextarea.value.split('\n').map(c => c.trim()).filter(c => c);
    if (cards.length === 0) {
      Swal.fire("No Cards", "Please enter credit card numbers to check.", "info");
      return;
    }

    checkBtn.disabled = true;
    stopCheckBtn.disabled = false;

    resultOutputTextarea.value = "Starting check...\n";
    liveNumbersTextarea.value = "";
    deadNumbersTextarea.value = "";
    unknownNumbersTextarea.value = "";
    updateSummaryCounts(0, 0, 0);

    const response = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const processChunk = ({ done, value }) => {
      if (done) {
        updateStatusText("Checking Finished!");
        checkBtn.disabled = false;
        stopCheckBtn.disabled = true;
        Swal.fire("Done", "All cards checked", "success");
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop();

      events.forEach(event => {
        if (event.startsWith("data: ")) {
          const payload = JSON.parse(event.slice(6));
          const card = payload.card;
          const status = payload.status;

          if (status === "Live") {
            liveCount++;
            appendResult(liveNumbersTextarea, card);
          } else if (status === "Dead") {
            deadCount++;
            appendResult(deadNumbersTextarea, card);
          } else {
            unknownCount++;
            appendResult(unknownNumbersTextarea, card);
          }

          updateSummaryCounts(liveCount, deadCount, unknownCount);
          updateStatusText(`Checked: ${card} → ${status}`);
        }
      });

      return reader.read().then(processChunk);
    };

    reader.read().then(processChunk);
  });

  stopCheckBtn.addEventListener("click", () => {
    Swal.fire("Cannot Stop", "This version does not support stopping mid-stream.", "info");
  });

  function appendResult(textarea, text) {
    textarea.value += text + '\n';
    textarea.scrollTop = textarea.scrollHeight;
  }

  function updateSummaryCounts(l, d, u) {
    liveCountSpan.textContent = l;
    deadCountSpan.textContent = d;
    unknownCountSpan.textContent = u;
  }

  function updateStatusText(text) {
    resultOutputTextarea.value = text;
    resultOutputTextarea.scrollTop = resultOutputTextarea.scrollHeight;
  }

  window.copyToClipboard = function (id) {
    const text = document.getElementById(id).value;
    if (!text) return Swal.fire("Empty", "Nothing to copy", "info");

    navigator.clipboard.writeText(text)
      .then(() => Swal.fire("Copied!", "Content copied.", "success"))
      .catch(() => Swal.fire("Error", "Copy failed.", "error"));
  };
});
