const frontendDetail = document.querySelector("#frontend-detail");
const backendBadge = document.querySelector("#backend-badge");
const backendDetail = document.querySelector("#backend-detail");
const databaseBadge = document.querySelector("#database-badge");
const databaseDetail = document.querySelector("#database-detail");
const databaseButton = document.querySelector("#database-button");

frontendDetail.textContent = `Loaded ${new Date().toLocaleString()}`;

function setResult(badge, detail, state, label, message) {
  badge.className = `badge ${state}`;
  badge.textContent = label;
  detail.textContent = message;
}

async function checkBackend() {
  setResult(backendBadge, backendDetail, "pending", "Checking", "Calling /api/health…");

  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    const region = result.vercel.region || "local";
    const environment = result.vercel.environment || "local";
    setResult(
      backendBadge,
      backendDetail,
      "success",
      "Online",
      `${environment} · ${region} · ${new Date(result.timestamp).toLocaleTimeString()}`,
    );
  } catch (error) {
    setResult(backendBadge, backendDetail, "error", "Failed", error.message);
  }
}

async function checkDatabase() {
  databaseButton.disabled = true;
  setResult(databaseBadge, databaseDetail, "pending", "Running", "Testing insert → read → cleanup…");

  try {
    const response = await fetch("/api/supabase-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    setResult(
      databaseBadge,
      databaseDetail,
      "success",
      "Passed",
      `Temporary row ${result.checkId.slice(0, 8)}… verified in ${result.durationMs} ms and removed.`,
    );
  } catch (error) {
    setResult(databaseBadge, databaseDetail, "error", "Failed", error.message);
  } finally {
    databaseButton.disabled = false;
  }
}

databaseButton.addEventListener("click", checkDatabase);
checkBackend();
