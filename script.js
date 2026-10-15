const form = document.querySelector("#generator-form");
const productInput = document.querySelector("#product");
const detailsInput = document.querySelector("#details");
const platformInput = document.querySelector("#platform");
const toneInput = document.querySelector("#tone");
const generateBtn = document.querySelector("#generate-btn");
const buttonLabel = document.querySelector("#button-label");
const emptyState = document.querySelector("#empty-state");
const loadingState = document.querySelector("#loading-state");
const resultContent = document.querySelector("#result-content");
const generatedText = document.querySelector("#generated-text");
const statusLabel = document.querySelector("#status-label");
const modelLabel = document.querySelector("#model-label");
const resultType = document.querySelector("#result-type");
const toast = document.querySelector("#toast");
let lastRequest = null;
let toastTimer;

document.querySelectorAll('input[name="outputType"]').forEach(input => {
  input.addEventListener("change", () => {
    document.querySelectorAll(".option").forEach(option => option.classList.remove("selected"));
    input.closest(".option").classList.add("selected");
  });
});

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setView(view) {
  emptyState.classList.toggle("hidden", view !== "empty");
  loadingState.classList.toggle("hidden", view !== "loading");
  resultContent.classList.toggle("hidden", view !== "result");
}

function buildDemoDraft(data) {
  // Clearly labelled fallback. Real model output comes from the local Ollama server.
  const details = data.details.trim() || "thoughtfully made with care";
  if (data.outputType === "Social caption") {
    return `A little something to make your day better ✨\n\nMeet ${data.product} — ${details}.\n\nMade for people who appreciate the little details. Ready to make it yours?\n\nDiscover more and send us a message to learn more.\n\n#${data.product.replace(/[^a-z0-9]/gi, "")} #SmallBusiness #ShopSmall`;
  }
  if (data.outputType === "Product headlines") {
    return `1. Meet your new favourite: ${data.product}\n\n2. Small details. A big difference.\n\n3. Discover ${data.product} — made with intention\n\n4. A better way to enjoy the everyday\n\n5. Thoughtful by design: ${data.product}`;
  }
  return `PRODUCT TITLE\n${data.product} | Thoughtful Quality for Everyday Life\n\nOVERVIEW\nDiscover ${data.product}, ${details}. Designed for customers who value quality and thoughtful details.\n\nWHY YOU'LL LOVE IT\n• A clear, useful choice for everyday needs\n• Thoughtful details and a customer-friendly experience\n• An easy option to consider for yourself or as a gift\n\nA GOOD FIT FOR\nPeople looking for practical products with a personal touch.\n\nCALL TO ACTION\nInterested in ${data.product}? Explore the details and contact the seller with any questions.\n\nNote: This is a starter draft. Replace general claims with verified product facts before publishing.`;
}

async function generate(data) {
  lastRequest = data;
  setView("loading");
  statusLabel.textContent = "WORKING";
  generateBtn.disabled = true;
  buttonLabel.textContent = "Generating…";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Local AI server is unavailable.");
    }
    const result = await response.json();
    generatedText.textContent = result.text;
    modelLabel.textContent = result.model ? `OPEN MODEL · ${result.model}` : "OPEN MODEL";
    statusLabel.textContent = "AI READY";
    showResult(data);
  } catch (error) {
    // If opened as a static page or Ollama is not running, still demonstrate the UX honestly.
    generatedText.textContent = buildDemoDraft(data);
    modelLabel.textContent = "DEMO DRAFT · NOT LIVE AI";
    statusLabel.textContent = "DEMO MODE";
    showResult(data);
    notify("Showing a demo draft. Start the local server + Ollama for real AI.");
  } finally {
    generateBtn.disabled = false;
    buttonLabel.textContent = "Generate content";
  }
}

function showResult(data) {
  resultType.textContent = data.outputType.toUpperCase();
  setView("result");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = {
    product: productInput.value.trim(),
    details: detailsInput.value.trim(),
    platform: platformInput.value,
    tone: toneInput.value,
    outputType: document.querySelector('input[name="outputType"]:checked').value
  };
  if (!data.product) {
    productInput.focus();
    notify("Add a product or service first.");
    return;
  }
  generate(data);
});

document.querySelector("#regenerate-btn").addEventListener("click", () => {
  if (lastRequest) generate(lastRequest);
});

document.querySelector("#copy-btn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(generatedText.textContent);
    notify("Content copied to clipboard.");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(generatedText);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    notify("Select the highlighted text and copy it.");
  }
});
