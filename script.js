const operationDisplay = document.getElementById("operationDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const historyButton = document.getElementById("historyButton");
const historyContainer = document.getElementById("historyContainer");
const backspace = document.getElementById("backspace");
const player = document.getElementById("player");
const player2 = document.getElementById("player2");
const player3 = document.getElementById("player3");
const toastContainer = document.getElementById("toastContainer");

const buttons = document.querySelectorAll(".btn");

const STORAGE_KEY = "CALCULATOR_HISTORY_ARRAY";
const MAX_ALLOWED_LENGTH = 15;
const ALLOWED_KEYBOARD_KEYS = "1234567890";
let num1 = 0,
  num2 = 0,
  result = 0,
  operand = null,
  floatInput = false,
  percentage = { n1: false, n2: false },
  historyArray = [];

//! Utility Functions
function eraseLast(str) {
  return str
    .split("")
    .filter((ch, i) => i !== str.split("").length - 1)
    .join("");
}

const myLocalStorage = {
  setItem: (key, value) =>
    window.localStorage.setItem(key, JSON.stringify(value)),
  getItem: (key) => JSON.parse(window.localStorage.getItem(key)),
};

const weekDays = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const recentDays = ["Yestarday", "Today", "Tomorrow"];

function prettyDateFormat(date) {
  const paramMilis = date.getTime();
  const currentMilis = new Date().getTime();
  const diff = Math.floor((currentMilis - paramMilis) / 1000 / 60 / 60 / 24);
  let day = "";

  switch (diff) {
    case -1:
      day = "Tomorrow";
      break;
    case 0:
      day = "Today";
      break;
    case 1:
      day = "Yestarday";
      break;
    default:
      if (diff < 7) {
        day = weekDays[date.getDay()];
      } else {
        day = date.getDate().toString();
      }
      break;
  }
  let [hour, minute] = [date.getHours(), date.getMinutes()];
  let id = hour > 12 ? "PM" : "AM";
  hour = hour > 12 ? hour - 12 : hour;
  return recentDays.includes(day)
    ? `${day} at ${hour < 10 ? `0${hour}` : hour}:${
        minute < 10 ? `0${minute}` : minute
      } ${id}`
    : `${day} ${months[date.getMonth()]} ${date.getFullYear()} at ${
        hour < 10 ? `0${hour}` : hour
      }:${minute < 10 ? `0${minute}` : minute} ${id}`;
}
//! End Utility Functions

//! Main Functions

function loadHistory() {
  const previousHistory = myLocalStorage.getItem(STORAGE_KEY);
  if (previousHistory && previousHistory.length > 0)
    historyArray = previousHistory;
}

function showHistoryPanel() {
  player3.currentTime = 0;
  player3.play();
  historyArray.forEach((item) => {
    const historyElement = document.createElement("div");
    historyElement.classList.add("history");
    historyElement.innerHTML = ` <p class="timestamp">◔ ${prettyDateFormat(
      new Date(item.timestamp)
    )}</p>
    <p class="operation">${item.operation}</p>
    <p class="result">= ${item.result}</p>`;
    historyContainer.appendChild(historyElement);
  });
  historyContainer.style.display = "flex";
  historyContainer.classList.remove("fade");
  historyContainer.classList.add("appear");
}

function hideHistoryPanel() {
  historyContainer.innerHTML =
    '<p class="darkButton" id="historyCloseButton" onclick="hideHistoryPanel()">X Close</p>';
  historyContainer.classList.remove("appear");
  historyContainer.classList.add("fade");
  setTimeout(() => {
    historyContainer.style.display = "none";
  }, 1000);
}

function addToHistory(item) {
  historyArray.push(item);
  myLocalStorage.setItem(STORAGE_KEY, historyArray);
}

function reset() {
  num1 = num2 = result = 0;
  operand = null;
  floatInput = false;
  percentage = { n1: false, n2: false };
}

function addToast(msg = "Can't enter more than 15 digits.") {
  let num = -1;
  const toast = document.createElement("div");
  toast.classList.add("toastFrame");
  toast.innerHTML = ` <div class="flex">
                        <a class="closeBtn">✖</a>
                        <p class="toast">${msg}</p>
                      </div>
                      <div class="bar"></div>`;
  toastContainer.appendChild(toast);
  toast.firstElementChild.addEventListener("click", () => {
    toastContainer.removeChild(toast);
    clearTimeout(num);
  });
  player.currentTime = 0;
  player.play();
  num = setTimeout(() => {
    toastContainer.removeChild(toast);
  }, 3000);
}

function updateDisplay() {
  operationDisplay.value = result
    ? result
    : `${num1}${operand ? ` ${operand}` : ""}${
        num2 ? (num2 < 0 ? ` (${num2})` : ` ${num2}`) : ``
      }`;
  if (operationDisplay.value.length > 11) {
    operationDisplay.style.fontSize = "2rem";
  } else {
    operationDisplay.style.fontSize = "3rem";
  }
}

function setOperator(op) {
  if (operand && !result) handleEvaluation();
  if (num1) {
    operand = op;
  } else if (result) {
    num1 = result;
    operand = op;
    result = 0;
  }
  updateDisplay();
}

function handleSignUpdate() {
  if (operand) {
    num2 = parseFloat(-num2);
  } else {
    num1 = parseFloat(-num1);
  }
  updateDisplay();
}

function handleReset() {
  reset();
  updateDisplay();
}

function handleFloatingPoint() {
  if (!percentage.n1 && !percentage.n2) {
    floatInput = true;
    addToInput();
  }
}

function handlePercentage() {
  if (!num1) return;
  if (!operand) {
    percentage.n1 = true;
    addToInput();
  } else if (num2 !== 0) {
    percentage.n2 = true;
    addToInput();
  } else {
    addToast("Invalid Input Format");
  }
}

function addToInput(value = "") {
  result = 0;
  if (!operand) {
    const length = num1.toString().length;
    if (
      (num1 < 0 && length > MAX_ALLOWED_LENGTH) ||
      (num1 > 0 && length === MAX_ALLOWED_LENGTH)
    ) {
      addToast();
      return;
    } else {
      if (percentage.n1) {
        if (!num1.toString().includes("%")) {
          num1 += "%";
        }
      } else {
        if (floatInput && Number.isInteger(num1)) {
          console.log("hehe1");
          num1 += ".";
        } else {
          num1 += value;
          num1 = parseFloat(num1);
        }
        floatInput = false;
      }
    }
  } else {
    const length = num2.toString().length;
    if (
      (num2 < 0 && length > MAX_ALLOWED_LENGTH) ||
      (num2 > 0 && length === MAX_ALLOWED_LENGTH)
    ) {
      addToast();
      return;
    } else {
      if (percentage.n2) {
        if (!num2.toString().includes("%")) {
          num2 += "%";
        }
      } else {
        if (floatInput && Number.isInteger(num2)) {
          console.log("hehe");
          num2 += ".";
        } else {
          num2 += value;
          num2 = parseFloat(num2);
        }
        floatInput = false;
      }
    }
  }
  updateDisplay();
}

function handleEvaluation() {
  let res = 0;
  if (percentage.n1 || percentage.n2) {
    if (percentage.n1 && !operand) {
      res = parseFloat(num1.toString().split("%")[0]) / 100;
      num1 = res;
      percentage.n1 = false;
      updateDisplay();
      return;
    }
    if (!percentage.n1 && operand && percentage.n2) {
      if ("+-".includes(operand)) {
        num2 = (parseFloat(num2.toString().split("%")[0]) / 100) * num1;
      } else {
        num2 = parseFloat(num2.toString().split("%")[0]) / 100;
      }
    }
    if (percentage.n1 && operand && !percentage.n2) {
      num1 = parseFloat(num1.toString().split("%")[0]) / 100;
    }
    if (percentage.n1 && operand && percentage.n2) {
      num1 = parseFloat(num1.toString().split("%")[0]) / 100;
      num2 = (parseFloat(num2.toString().split("%")[0]) / 100) * num1;
    }
    percentage.n1 = false;
    percentage.n2 = false;
    handleEvaluation();
  } else if (operand && num2) {
    switch (operand) {
      case "+":
        res = num1 + num2;
        break;
      case "-":
        res = num1 - num2;
        break;
      case "x":
        res = num1 * num2;
        break;
      case "÷":
        res = num1 / num2;
        break;
      default:
        alert("Unexpected case");
        break;
    }
    player3.currentTime = 0;
    player3.play();
    addToHistory({
      timestamp: new Date(),
      operation: operationDisplay.value,
      result: res,
    });
    reset();
    result = res;
    updateDisplay();
  }
}

const handleButtonClick = ({ target }) => {
  if (target.innerText !== "=") {
    player2.currentTime = 0;
    player2.play();
  }
  if (target.classList.contains("dark")) {
    switch (target.innerText) {
      case "AC":
        handleReset();
        break;
      case "±":
        handleSignUpdate();
        break;
      case "%":
        handlePercentage();
        break;
      case ".":
        handleFloatingPoint();
        break;
      case "=":
        handleEvaluation();
        break;
      default:
        setOperator(target.innerText);
        break;
    }
  } else {
    addToInput(target.innerText);
  }
};
//! End Main Functions

//! Event Listeners
buttons.forEach((btn) => btn.addEventListener("click", handleButtonClick));

historyButton.addEventListener("click", () => showHistoryPanel());

document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") loadHistory();
});

document.body.addEventListener("keydown", (ev) => {
  if (ev.key === "Backspace" || ev.key === "Delete") {
    backspace.click();
  }
});

document.body.addEventListener("keypress", (ev) => {
  ev.preventDefault();
  if (ALLOWED_KEYBOARD_KEYS.includes(ev.key)) {
    addToInput(ev.key);
  } else if ("+-/*".includes(ev.key)) {
    if (ev.key === "/") setOperator("÷");
    else if (ev.key === "*") setOperator("x");
    else {
      setOperator(ev.key);
    }
  }
  if (ev.key === ".") handleFloatingPoint();
  if (ev.key === "%") handlePercentage();
  if (ev.key === "Enter") handleEvaluation();
});

backspace.addEventListener("click", () => {
  let text = operationDisplay.value;
  if (num1) {
    if (operand) {
      if (num2) {
        percentage.n2 = false;
        let str2 = text.split(operand)[1];
        if (num2 > 0 && num2.toString().length > 1) {
          num2 = parseFloat(eraseLast(str2));
        } else if (num2.toString().length > 2) {
          str2 = str2.trim().slice(1, str2.length - 2);
          num2 = parseFloat(eraseLast(str2));
        } else {
          num2 = 0;
        }
      } else {
        operand = null;
      }
    } else {
      percentage.n1 = false;
      if (num1 > 0 && num1.toString().length > 1) {
        num1 = parseFloat(eraseLast(text));
      } else if (num1.toString().length > 2) {
        num1 = parseFloat(eraseLast(text));
      } else {
        num1 = 0;
      }
    }
  } else if (result) {
    result = parseFloat(eraseLast(result.toString()));
  }
  player2.currentTime = 0;
  player2.play();
  updateDisplay();
});
//! End Event Listerners
