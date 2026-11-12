
/* =========================================
   4-BIT ALU CALCULATOR
   FRONTEND + FASTAPI + VIVADO XSIM
========================================= */

const API_URL = "http://127.0.0.1:8000";
const CALCULATE_URL = `${API_URL}/api/calculate`;
const HEALTH_URL = `${API_URL}/api/health`;

// =========================================
// 1. HTML ELEMENT REFERENCES
// =========================================

const inputA = document.getElementById("inputA");
const inputB = document.getElementById("inputB");

const binaryA = document.getElementById("binaryA");
const binaryB = document.getElementById("binaryB");

const resultValue = document.getElementById("resultValue");
const binaryResult = document.getElementById("binaryResult");
const decimalResult = document.getElementById("decimalResult");

const carryFlag = document.getElementById("carryFlag");
const zeroFlag = document.getElementById("zeroFlag");
const overflowFlag = document.getElementById("overflowFlag");

const selectedOperation = document.getElementById("selectedOperation");

const backendStatus = document.getElementById("backendStatus");
const simulationStatus = document.getElementById("simulationStatus");

const historyList = document.getElementById("historyList");
const exportHistoryButton = document.getElementById("exportHistory");
const clearHistoryButton = document.getElementById("clearHistory");

const operationButtons = document.querySelectorAll(".operation-btn");

// =========================================
// 2. OPERATION INFORMATION
// =========================================

const operationNames = {
    "000": "Addition",
    "001": "Subtraction",
    "010": "Bitwise AND",
    "011": "Bitwise OR",
    "100": "Bitwise XOR",
    "101": "Bitwise NOT",
    "110": "Increment",
    "111": "Decrement"
};

// Stores successful calculations during this page session.
let operationHistory = [];

// =========================================
// 3. UPDATE BINARY INPUTS
// =========================================

function updateBinaryInputs() {

    const A = Number(inputA.value);
    const B = Number(inputB.value);

    binaryA.textContent =
        Number.isInteger(A) && A >= 0 && A <= 15
            ? A.toString(2).padStart(4, "0")
            : "----";

    binaryB.textContent =
        Number.isInteger(B) && B >= 0 && B <= 15
            ? B.toString(2).padStart(4, "0")
            : "----";
}

inputA.addEventListener("input", updateBinaryInputs);
inputB.addEventListener("input", updateBinaryInputs);

// =========================================
// 4. VALIDATE INPUTS
// =========================================

function validateInputs() {

    const A = Number(inputA.value);
    const B = Number(inputB.value);

    if (
        inputA.value.trim() === "" ||
        inputB.value.trim() === "" ||
        !Number.isInteger(A) ||
        !Number.isInteger(B) ||
        A < 0 || A > 15 ||
        B < 0 || B > 15
    ) {
        alert("Enter valid 4-bit inputs between 0 and 15.");
        return null;
    }

    return { A, B };
}

// =========================================
// 5. RESET OUTPUT
// =========================================

function resetOutput() {

    resultValue.textContent = "----";
    binaryResult.textContent = "----";
    decimalResult.textContent = "--";

    carryFlag.textContent = "-";
    zeroFlag.textContent = "-";
    overflowFlag.textContent = "-";
}

// =========================================
// 6. UPDATE STATUS INDICATORS
// =========================================

function updateStatus(element, message, state) {

    element.textContent = message;

    const dot = element.querySelector(".status-dot");

    if (dot) {
        dot.classList.remove("online", "error");

        if (state === "online") {
            dot.classList.add("online");
        } else if (state === "error") {
            dot.classList.add("error");
        }
    }
}

// =========================================
// 7. CHECK FASTAPI BACKEND
// =========================================

async function checkBackend() {

    try {

        const response = await fetch(HEALTH_URL);

        if (!response.ok) {
            throw new Error("Backend health check failed");
        }

        await response.json();

        updateStatus(
            backendStatus,
            "Connected",
            "online"
        );

        return true;

    } catch (error) {

        updateStatus(
            backendStatus,
            "Disconnected",
            "error"
        );

        return false;
    }
}

// =========================================
// 8. DISPLAY SIMULATION RESULTS
// =========================================

function displayResults(data) {

    const output = data.outputs;

    resultValue.textContent = output.result_decimal;
    binaryResult.textContent = output.result_binary;
    decimalResult.textContent = output.result_decimal;

    carryFlag.textContent = output.carry;
    zeroFlag.textContent = output.zero;
    overflowFlag.textContent = output.overflow;

    selectedOperation.textContent =
        data.operation + " completed successfully";
}

// =========================================
// 9. ADD OPERATION TO HISTORY
// =========================================

function addToHistory(data) {

    const record = {

        time: new Date().toLocaleString(),

        A: data.inputs.A,
        B: data.inputs.B,

        operation: data.operation,

        opcode: data.inputs.binary_opcode,

        resultBinary: data.outputs.result_binary,
        resultDecimal: data.outputs.result_decimal,

        carry: data.outputs.carry,
        zero: data.outputs.zero,
        overflow: data.outputs.overflow
    };

    operationHistory.unshift(record);

    renderHistory();
}

// =========================================
// 10. DISPLAY OPERATION HISTORY
// =========================================

function renderHistory() {

    historyList.innerHTML = "";

    if (operationHistory.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">No operations performed yet.</p>';

        return;
    }

    operationHistory.forEach((record) => {

        const item = document.createElement("div");

        item.className = "history-item";

        const details = document.createElement("div");

        const heading = document.createElement("strong");

        heading.textContent =
            `${record.operation} | ${record.A} and ${record.B}`;

        const description = document.createElement("small");

        description.textContent =
            `Opcode: ${record.opcode} | Result: ${record.resultBinary} (${record.resultDecimal})`;

        details.appendChild(heading);
        details.appendChild(document.createElement("br"));
        details.appendChild(description);

        const timestamp = document.createElement("small");

        timestamp.textContent = record.time;

        item.appendChild(details);
        item.appendChild(timestamp);

        historyList.appendChild(item);
    });
}

// =========================================
// 11. CLEAR OPERATION HISTORY
// =========================================

clearHistoryButton.addEventListener("click", () => {

    operationHistory = [];

    renderHistory();

});

// =========================================
// 12. EXPORT HISTORY TO CSV
// =========================================

exportHistoryButton.addEventListener("click", () => {

    if (operationHistory.length === 0) {

        alert("No operation history available to export.");

        return;
    }

    const headers = [
        "Time",
        "Input A",
        "Input B",
        "Operation",
        "Opcode",
        "Binary Result",
        "Decimal Result",
        "Carry",
        "Zero",
        "Overflow"
    ];

    const rows = operationHistory.map(record => [
        record.time,
        record.A,
        record.B,
        record.operation,
        record.opcode,
        record.resultBinary,
        record.resultDecimal,
        record.carry,
        record.zero,
        record.overflow
    ]);

    function escapeCSV(value) {

        const text = String(value);

        return `"${text.replace(/"/g, '""')}"`;
    }

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(
        [csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "ALU_Operation_History.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

});

// =========================================
// 13. RUN ALU SIMULATION
// =========================================

async function calculateALU(opcode, button) {

    const values = validateInputs();

    if (!values) {
        return;
    }

    const { A, B } = values;

    // Disable all operation buttons while simulation runs.
    operationButtons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("active");
    });

    button.classList.add("active");
    button.classList.add("loading");

    selectedOperation.textContent =
        "Running Vivado XSim simulation...";

    updateStatus(
        simulationStatus,
        "Running",
        ""
    );

    resetOutput();

    try {

        const response = await fetch(CALCULATE_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                A: A,
                B: B,
                opcode: parseInt(opcode, 2)
            })

        });

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail || "ALU simulation failed"
            );
        }

        // Display actual Verilog simulation results.
        displayResults(data);

        // Record successful calculation.
        addToHistory(data);

        updateStatus(
            simulationStatus,
            "Success",
            "online"
        );

    } catch (error) {

        console.error("ALU Simulation Error:", error);

        selectedOperation.textContent =
            "Simulation failed: " + error.message;

        resultValue.textContent = "ERROR";

        updateStatus(
            simulationStatus,
            "Failed",
            "error"
        );

        alert(
            "Unable to complete ALU simulation.\n\n" +
            error.message
        );

    } finally {

        operationButtons.forEach(btn => {
            btn.disabled = false;
        });

        button.classList.remove("loading");

    }
}

// =========================================
// 14. CONNECT OPERATION BUTTONS
// =========================================

operationButtons.forEach(button => {

    button.addEventListener("click", () => {

        calculateALU(
            button.dataset.opcode,
            button
        );

    });

});

// =========================================
// 15. INITIALIZE DASHBOARD
// =========================================

async function initializeDashboard() {

    updateBinaryInputs();

    resetOutput();

    selectedOperation.textContent =
        "No operation selected";

    updateStatus(
        backendStatus,
        "Checking...",
        ""
    );

    updateStatus(
        simulationStatus,
        "Idle",
        ""
    );

    renderHistory();

    await checkBackend();

    console.log("4-Bit ALU Dashboard Initialized");

}

initializeDashboard();
