let stopChecking = false;
let currentCheckingIndex = 0;

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
        currentCheckingIndex = 0;

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

        let liveCount = 0;
        let deadCount = 0;
        let unknownCount = 0;
        let totalCards = cards.length;

        for (let i = 0; i < totalCards; i++) {
            if (stopChecking) {
                appendToStatusOutput(`🛑 Checking stopped at ${i}/${totalCards} cards.`);
                break;
            }

            const card = cards[i].trim();
            if (!card) continue;

            appendToStatusOutput(`➡️ Checking card ${i + 1} of ${totalCards}...`);
            try {
                const apiUrl = `https://drlabapis.onrender.com/api/chk?cc=${encodeURIComponent(card)}`;
                const response = await fetch(apiUrl);

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                let resultLine = `${card}`;
                let displayResult = "";

                if (data.response === "Live") {
                    liveCount++;
                    appendResultToSpecificOutput(liveNumbersTextarea, resultLine);
                    displayResult = `🟢 Live`;
                } else if (data.response === "Dead") {
                    deadCount++;
                    appendResultToSpecificOutput(deadNumbersTextarea, resultLine);
                    displayResult = `🔴 Dead`;
                } else {
                    unknownCount++;
                    appendResultToSpecificOutput(unknownNumbersTextarea, resultLine);
                    displayResult = `🟡 Unknown`;
                }

                appendToStatusOutput(`${resultLine} ${displayResult}`);

            } catch (err) {
                unknownCount++;
                appendResultToSpecificOutput(unknownNumbersTextarea, `${card} - Error: ${err.message}`);
                appendToStatusOutput(`${card} ⚠️ Error: ${err.message}`);
            }

            updateSummaryCounts(liveCount, deadCount, unknownCount);
            await new Promise(resolve => setTimeout(resolve, 500));
            currentCheckingIndex++;
        }

        appendToStatusOutput(
            `\n✅ Checking Finished!\n` +
            `Total: ${totalCards}\n🟢 Live: ${liveCount}\n🔴 Dead: ${deadCount}\n🟡 Unknown: ${unknownCount}`
        );

        checkBtn.disabled = false;
        stopCheckBtn.disabled = true;
        Swal.fire("Checking Complete", "All credit cards have been processed.", "success");
    }

    function appendToStatusOutput(text) {
        resultOutputTextarea.value += `${text}\n`;
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
