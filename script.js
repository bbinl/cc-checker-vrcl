let stopChecking = false;

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

    let liveCount = 0;
    let deadCount = 0;
    let unknownCount = 0;
    let currentIndex = 0;

    checkBtn.addEventListener("click", toggleChecking);
    stopCheckBtn.addEventListener("click", stopCheckingProcess);

    function toggleChecking() {
        checkBtn.disabled = true;
        stopCheckBtn.disabled = false;
        startChecking();
    }

    function stopCheckingProcess() {
        stopChecking = true;
        checkBtn.disabled = false;
        stopCheckBtn.disabled = true;
        Swal.fire("Checking Stopped", "Credit card checking has been stopped.", "info");
    }

    async function startChecking() {
        stopChecking = false;

        const input = numbersTextarea.value.trim();
        const cards = input.split("\n").filter(line => line.trim() !== "");

        resultOutputTextarea.value = "";
        liveNumbersTextarea.value = "";
        deadNumbersTextarea.value = "";
        unknownNumbersTextarea.value = "";
        updateSummaryCounts(0, 0, 0);

        if (cards.length === 0) {
            Swal.fire("No Cards", "Please enter credit card numbers to check.", "info");
            checkBtn.disabled = false;
            stopCheckBtn.disabled = true;
            return;
        }

        appendToStatusOutput(`⏳ Starting check of ${cards.length} cards...\n`);

        const response = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (!stopChecking) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');

            buffer = lines.pop(); // incomplete line save

            for (const chunk of lines) {
                if (chunk.startsWith('event: done')) {
                    appendToStatusOutput(
                        `\n✅ Checking Finished!\n` +
                        `Total: ${cards.length}\n🟢 Live: ${liveCount}\n🔴 Dead: ${deadCount}\n🟡 Unknown: ${unknownCount}`
                    );
                    checkBtn.disabled = false;
                    stopCheckBtn.disabled = true;
                    Swal.fire("Done", "All cards checked.", "success");
                    return;
                }

                if (chunk.startsWith('data:')) {
                    const raw = chunk.replace(/^data:\s*/, '');
                    const result = JSON.parse(raw);
                    const card = result.card;
                    const status = result.status;
                    currentIndex++;

                    let emoji = '🟡';
                    if (status === 'Live') {
                        liveCount++;
                        emoji = '🟢';
                        appendResultToSpecificOutput(liveNumbersTextarea, card);
                    } else if (status === 'Dead') {
                        deadCount++;
                        emoji = '🔴';
                        appendResultToSpecificOutput(deadNumbersTextarea, card);
                    } else {
                        unknownCount++;
                        emoji = '🟡';
                        appendResultToSpecificOutput(unknownNumbersTextarea, card);
                    }

                    appendToStatusOutput(`➡️ Checking card ${currentIndex} of ${cards.length}... ${card} ${emoji} ${status}`);
                    updateSummaryCounts(liveCount, deadCount, unknownCount);
                }
            }
        }

        appendToStatusOutput(`🛑 Checking stopped by user.`);
        checkBtn.disabled = false;
        stopCheckBtn.disabled = true;
    }

    function appendToStatusOutput(text) {
        resultOutputTextarea.value += text + '\n';
        resultOutputTextarea.scrollTop = resultOutputTextarea.scrollHeight;
    }

    function appendResultToSpecificOutput(textareaElement, text) {
        textareaElement.value += text + '\n';
        textareaElement.scrollTop = textareaElement.scrollHeight;
    }

    function updateSummaryCounts(live, dead, unknown) {
        liveCountSpan.textContent = live;
        deadCountSpan.textContent = dead;
        unknownCountSpan.textContent = unknown;
    }

    window.copyToClipboard = function (elementId) {
        const textareaElement = document.getElementById(elementId);
        if (textareaElement && textareaElement.value) {
            navigator.clipboard.writeText(textareaElement.value).then(() => {
                Swal.fire("Copied!", "Content copied to clipboard.", "success");
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                Swal.fire("Error", "Could not copy text.", "error");
            });
        } else {
            Swal.fire("No Content", "The section is empty.", "info");
        }
    }
});
