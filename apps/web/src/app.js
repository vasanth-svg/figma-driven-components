import {
  buildBranchName,
  displaySizes,
  jobSteps,
  parseFigmaUrls,
  repositories,
} from "./contracts.js";

const state = {
  figmaConnected: false,
  gitConnected: false,
  selectedRepo: repositories[0],
  activeSize: displaySizes[0],
  job: null,
  timers: [],
};

const elements = {
  figmaCard: document.querySelector("#figmaCard"),
  gitCard: document.querySelector("#gitCard"),
  figmaStatus: document.querySelector("#figmaStatus"),
  gitStatus: document.querySelector("#gitStatus"),
  figmaConnectBtn: document.querySelector("#figmaConnectBtn"),
  gitConnectBtn: document.querySelector("#gitConnectBtn"),
  gateBadge: document.querySelector("#gateBadge"),
  gateMessage: document.querySelector("#gateMessage"),
  changePanel: document.querySelector("#changePanel"),
  repoSelect: document.querySelector("#repoSelect"),
  repoMeta: document.querySelector("#repoMeta"),
  repoChecks: document.querySelector("#repoChecks"),
  figmaUrls: document.querySelector("#figmaUrls"),
  prompt: document.querySelector("#prompt"),
  branchName: document.querySelector("#branchName"),
  formError: document.querySelector("#formError"),
  createJobBtn: document.querySelector("#createJobBtn"),
  clearJobBtn: document.querySelector("#clearJobBtn"),
  jobIdBadge: document.querySelector("#jobIdBadge"),
  timeline: document.querySelector("#timeline"),
  events: document.querySelector("#events"),
  rawLog: document.querySelector("#rawLog"),
  sizeTabs: document.querySelector("#sizeTabs"),
  deviceFrame: document.querySelector("#deviceFrame"),
  previewState: document.querySelector("#previewState"),
  routeName: document.querySelector("#routeName"),
  commitSha: document.querySelector("#commitSha"),
  capturedAt: document.querySelector("#capturedAt"),
  evidenceList: document.querySelector("#evidenceList"),
  buildState: document.querySelector("#buildState"),
  approveBuildBtn: document.querySelector("#approveBuildBtn"),
  buildResult: document.querySelector("#buildResult"),
};

function init() {
  elements.figmaUrls.value = "https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22";
  elements.prompt.value = "Implement the new RSU insights screen and keep the current mobile app structure.";

  renderRepoOptions();
  renderConnections();
  renderRepoChecks();
  renderTimeline();
  renderSizeTabs();
  renderEvidence();
  updateBranchPreview();
  bindEvents();
}

function bindEvents() {
  elements.figmaConnectBtn.addEventListener("click", () => {
    state.figmaConnected = true;
    renderConnections();
  });

  elements.gitConnectBtn.addEventListener("click", () => {
    state.gitConnected = true;
    renderConnections();
  });

  elements.repoSelect.addEventListener("change", () => {
    state.selectedRepo = repositories.find((repo) => repo.id === elements.repoSelect.value);
    renderConnections();
    renderRepoChecks();
    updateBranchPreview();
  });

  elements.prompt.addEventListener("input", updateBranchPreview);
  elements.createJobBtn.addEventListener("click", createJob);
  elements.clearJobBtn.addEventListener("click", resetJob);
  elements.approveBuildBtn.addEventListener("click", approveBuild);
}

function isRepoReady() {
  return state.gitConnected && state.selectedRepo.githubAccess && state.selectedRepo.branches.includes("development");
}

function isReadyForChanges() {
  return state.figmaConnected && isRepoReady();
}

function renderConnections() {
  updateConnectorCard({
    card: elements.figmaCard,
    status: elements.figmaStatus,
    button: elements.figmaConnectBtn,
    connected: state.figmaConnected,
    connectedText: "Connected",
    buttonText: "Figma MCP connected",
  });

  updateConnectorCard({
    card: elements.gitCard,
    status: elements.gitStatus,
    button: elements.gitConnectBtn,
    connected: state.gitConnected,
    connectedText: isRepoReady() ? "Repo ready" : "Connected",
    buttonText: "Git repo connected",
  });

  const ready = isReadyForChanges();
  elements.gateBadge.textContent = ready ? "Ready" : "Locked";
  elements.gateBadge.className = `gate-badge ${ready ? "ready" : "locked"}`;
  elements.changePanel.classList.toggle("is-disabled", !ready);

  elements.repoSelect.disabled = !state.gitConnected;
  elements.figmaUrls.disabled = !ready;
  elements.prompt.disabled = !ready;
  elements.createJobBtn.disabled = !ready;

  if (!state.figmaConnected && !state.gitConnected) {
    elements.gateMessage.textContent = "Connect Figma MCP and GitHub/Git MCP to unlock changes.";
  } else if (!state.figmaConnected) {
    elements.gateMessage.textContent = "Git repo is connected. Connect Figma MCP before starting a change.";
  } else if (!state.gitConnected) {
    elements.gateMessage.textContent = "Figma MCP is connected. Connect a Git repository before starting a change.";
  } else if (!state.selectedRepo.branches.includes("development")) {
    elements.gateMessage.textContent = "This repo is connected, but it is blocked because the development branch is missing.";
  } else {
    elements.gateMessage.textContent = "Everything is connected. You can start a Figma-driven change.";
  }

  renderRepoChecks();
}

function updateConnectorCard({ card, status, button, connected, connectedText, buttonText }) {
  card.classList.toggle("connected", connected);
  status.textContent = connected ? connectedText : "Not connected";
  status.className = `status-chip ${connected ? "connected" : "disconnected"}`;
  button.textContent = connected ? buttonText : button.textContent;
  button.disabled = connected;
}

function renderRepoOptions() {
  elements.repoSelect.innerHTML = repositories
    .map((repo) => `<option value="${repo.id}">${repo.fullName}</option>`)
    .join("");
  elements.repoSelect.value = state.selectedRepo.id;
}

function renderRepoChecks() {
  const repo = state.selectedRepo;
  elements.repoMeta.textContent = state.gitConnected
    ? `${repo.description} Default branch: ${repo.defaultBranch}.`
    : "Connect GitHub/Git MCP to choose and validate a repository.";

  const checks = [
    {
      label: "GitHub/Git MCP repository access",
      ok: state.gitConnected && repo.githubAccess,
      detail: state.gitConnected && repo.githubAccess ? "Connected to selected repository" : "Waiting for Git connection",
    },
    {
      label: "development branch",
      ok: state.gitConnected && repo.branches.includes("development"),
      detail:
        state.gitConnected && repo.branches.includes("development")
          ? "Required PR base branch exists"
          : "Required before changes can start",
    },
    {
      label: "Figma MCP design access",
      ok: state.figmaConnected,
      detail: state.figmaConnected ? "Ready to fetch design context and screenshots" : "Waiting for Figma MCP",
    },
  ];

  elements.repoChecks.innerHTML = checks
    .map(
      (check) => `
        <div class="repo-check ${check.ok ? "ok" : "blocked"}">
          <span aria-hidden="true"></span>
          <div>
            <strong>${check.label}</strong>
            <p>${check.detail}</p>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderTimeline() {
  const visibleSteps = jobSteps.filter((step) =>
    ["queued", "validating_repo", "fetching_figma", "implementing", "creating_pr", "testing_flow", "awaiting_review"].includes(
      step.id,
    ),
  );
  const currentIndex = state.job ? visibleSteps.findIndex((step) => step.id === state.job.status) : -1;

  elements.timeline.innerHTML = visibleSteps
    .map((step, index) => {
      const isDone = state.job && index < currentIndex;
      const isActive = state.job && index === currentIndex;
      return `
        <li class="${isDone ? "done" : ""} ${isActive ? "active" : ""}">
          <span>${index + 1}</span>
          <div>
            <strong>${step.label}</strong>
            <p>${step.description}</p>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderSizeTabs() {
  elements.sizeTabs.innerHTML = displaySizes
    .map(
      (size) => `
        <button
          class="${state.activeSize.id === size.id ? "active" : ""}"
          type="button"
          role="tab"
          aria-selected="${state.activeSize.id === size.id}"
          data-size-id="${size.id}"
        >
          ${size.label}
        </button>
      `,
    )
    .join("");

  elements.sizeTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSize = displaySizes.find((size) => size.id === button.dataset.sizeId);
      elements.deviceFrame.className = `phone-frame ${state.activeSize.id}`;
      renderSizeTabs();
      updatePreviewMeta();
    });
  });
}

function renderEvidence() {
  const evidence = state.job?.evidence ?? [
    { label: "Validation", value: "Waiting for a connected change request", status: "Waiting" },
    { label: "Maestro screenshots", value: "Captured after implementation", status: "Waiting" },
    { label: "Video recording", value: "Full mobile flow evidence", status: "Waiting" },
  ];

  elements.evidenceList.innerHTML = evidence
    .map(
      (item) => `
        <div class="evidence-item">
          <span class="${item.status.toLowerCase()}">${item.status}</span>
          <div>
            <strong>${item.label}</strong>
            <p>${item.value}</p>
          </div>
        </div>
      `,
    )
    .join("");
}

function updateBranchPreview() {
  const previewJobId = state.job?.id ?? "job-preview";
  elements.branchName.textContent = buildBranchName(previewJobId, elements.prompt.value);
}

function createJob() {
  clearTimers();
  elements.formError.textContent = "";

  if (!isReadyForChanges()) {
    elements.formError.textContent = "Connect Figma MCP and GitHub/Git MCP before starting changes.";
    return;
  }

  const parsed = parseFigmaUrls(elements.figmaUrls.value);
  if (!parsed.ok) {
    elements.formError.textContent = parsed.error;
    return;
  }

  const id = `job-${Math.floor(1000 + Math.random() * 9000)}`;
  state.job = {
    id,
    repository: state.selectedRepo,
    figmaInputs: parsed.urls,
    prompt: elements.prompt.value.trim(),
    branchName: buildBranchName(id, elements.prompt.value),
    status: "queued",
    events: [],
    rawLogs: [],
    commitSha: "pending",
    evidence: null,
    approved: false,
  };

  elements.jobIdBadge.textContent = id;
  elements.branchName.textContent = state.job.branchName;
  addEvent("Change request created", `Branch ${state.job.branchName} will open a PR to development.`);
  addRawLog(`queued ${id} ${state.job.branchName}`);
  runJobSimulation();
  renderAll();
}

function runJobSimulation() {
  const sequence = [
    ["validating_repo", "Repository verified", "GitHub/Git MCP confirmed access and development branch."],
    ["fetching_figma", "Figma design fetched", "Figma MCP prepared design context, screenshot, and metadata fallback."],
    ["implementing", "Mobile UI checkpoint", "The preview now reflects the intended mobile screen structure."],
    ["creating_pr", "Draft PR prepared", `Target branch is development from ${state.job.branchName}.`],
    ["testing_flow", "Evidence captured", "Maestro screenshots and video are attached to the job."],
    ["awaiting_review", "Ready for review", "APK build remains blocked until you approve stage or prod."],
  ];

  sequence.forEach(([status, title, body], index) => {
    const timer = window.setTimeout(() => {
      state.job.status = status;
      if (status === "implementing") state.job.commitSha = randomSha();
      if (status === "testing_flow") {
        state.job.evidence = [
          { label: "Validation", value: "lint, typecheck, and PR checks passed", status: "Passed" },
          { label: "Maestro screenshots", value: "01-entry.png, 02-mobile-screen.png, 03-success.png", status: "Passed" },
          { label: "Video recording", value: "flow-recording.mp4", status: "Passed" },
        ];
      }
      addEvent(title, body);
      addRawLog(`${status} ${state.job.id} ${new Date().toISOString()}`);
      renderAll();
    }, 760 * (index + 1));
    state.timers.push(timer);
  });
}

function approveBuild() {
  if (!state.job || state.job.status !== "awaiting_review") return;

  const profile = document.querySelector('input[name="profile"]:checked').value;
  const easProfile = profile === "stage" ? "preview" : "production";

  state.job.approved = true;
  state.job.status = "building";
  addEvent("APK build approved", `${profile} selected. EAS profile: ${easProfile}.`);
  addRawLog(`approved profile=${profile} eas=${easProfile} sha=${state.job.commitSha}`);
  renderAll();

  const timer = window.setTimeout(() => {
    state.job.status = "complete";
    state.job.apkUrl = `https://artifacts.local/${state.job.id}/${profile}.apk`;
    addEvent("APK ready", `${profile}.apk is available in the artifact store.`);
    addRawLog(`complete apk=${state.job.apkUrl}`);
    renderAll();
  }, 1200);
  state.timers.push(timer);
}

function resetJob() {
  clearTimers();
  state.job = null;
  elements.formError.textContent = "";
  elements.jobIdBadge.textContent = "No job yet";
  elements.buildResult.textContent = "Build approval unlocks after validation and Maestro evidence pass.";
  updateBranchPreview();
  renderAll();
}

function clearTimers() {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers = [];
}

function addEvent(title, body) {
  state.job.events.unshift({
    title,
    body,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  });
}

function addRawLog(line) {
  state.job.rawLogs.push(line);
}

function renderAll() {
  renderConnections();
  renderTimeline();
  renderEvents();
  renderEvidence();
  updatePreviewMeta();
  updateApproval();
}

function renderEvents() {
  if (!state.job) {
    elements.events.innerHTML = `<p class="empty-state">Connect both tools and start a change to see progress.</p>`;
    elements.rawLog.textContent = "No worker logs yet.";
    return;
  }

  elements.events.innerHTML = state.job.events
    .map(
      (event) => `
        <article>
          <time>${event.time}</time>
          <strong>${event.title}</strong>
          <p>${event.body}</p>
        </article>
      `,
    )
    .join("");
  elements.rawLog.textContent = state.job.rawLogs.join("\n");
}

function updatePreviewMeta() {
  elements.deviceFrame.className = `phone-frame ${state.activeSize.id}`;
  elements.previewState.textContent = state.job ? toTitle(state.job.status) : "Waiting";
  elements.commitSha.textContent = state.job?.commitSha ?? "pending";
  elements.capturedAt.textContent = state.job ? new Date().toLocaleString() : "Waiting for job";
}

function updateApproval() {
  const canApprove = state.job?.status === "awaiting_review";
  elements.approveBuildBtn.disabled = !canApprove;

  if (!state.job) {
    elements.buildState.textContent = "Blocked";
    elements.buildResult.textContent = "Build approval unlocks after validation and Maestro evidence pass.";
    return;
  }

  if (state.job.status === "awaiting_review") {
    elements.buildState.textContent = "Ready";
    elements.buildResult.textContent = "Evidence passed. Choose stage or prod, then approve APK generation.";
  } else if (state.job.status === "building") {
    elements.buildState.textContent = "Building";
    elements.buildResult.textContent = "APK build is running from the approved branch and commit.";
  } else if (state.job.status === "complete") {
    elements.buildState.textContent = "APK ready";
    elements.buildResult.innerHTML = `<strong>APK ready:</strong> <code>${state.job.apkUrl}</code>`;
  } else {
    elements.buildState.textContent = "Blocked";
    elements.buildResult.textContent = "Waiting for validation and Maestro evidence.";
  }
}

function randomSha() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function toTitle(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

init();
