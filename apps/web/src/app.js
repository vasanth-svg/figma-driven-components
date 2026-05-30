import {
  buildBranchName,
  jobSteps,
  parseFigmaUrls,
  repositories,
  snackPlatforms,
} from "./contracts.js";

const state = {
  figmaConnected: false,
  gitConnected: false,
  selectedRepo: repositories[0],
  activeSnackPlatform: snackPlatforms[0],
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
  snackPlatformTabs: document.querySelector("#snackPlatformTabs"),
  snackLoading: document.querySelector("#snackLoading"),
  snackFrame: document.querySelector("#snackFrame"),
  previewState: document.querySelector("#previewState"),
  snackRepoName: document.querySelector("#snackRepoName"),
  snackBranch: document.querySelector("#snackBranch"),
  snackSourceLink: document.querySelector("#snackSourceLink"),
  openSnackLink: document.querySelector("#openSnackLink"),
  evidenceList: document.querySelector("#evidenceList"),
  buildState: document.querySelector("#buildState"),
  approveBuildBtn: document.querySelector("#approveBuildBtn"),
  buildResult: document.querySelector("#buildResult"),
};

const evidenceIcons = {
  Passed: "circle-check",
  Waiting: "circle-dot",
};

function init() {
  elements.figmaUrls.value = "https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22";
  elements.prompt.value = "Implement the new RSU insights screen and keep the current mobile app structure.";

  renderRepoOptions();
  renderConnections();
  renderRepoChecks();
  renderTimeline();
  renderSnackPlatformTabs();
  renderEvidence();
  updateSnackPreview();
  updateBranchPreview();
  bindEvents();
  renderIcons();
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
    updateSnackPreview();
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
    idleText: "Connect Figma MCP",
    idleIcon: "plug-zap",
    buttonText: "Figma MCP connected",
    buttonIcon: "circle-check",
  });

  updateConnectorCard({
    card: elements.gitCard,
    status: elements.gitStatus,
    button: elements.gitConnectBtn,
    connected: state.gitConnected,
    connectedText: isRepoReady() ? "Repo ready" : "Connected",
    idleText: "Connect Git repository",
    idleIcon: "git-pull-request-create",
    buttonText: "Git repo connected",
    buttonIcon: "circle-check",
  });

  const ready = isReadyForChanges();
  setBadge(elements.gateBadge, ready ? "success" : "secondary", ready ? "Ready" : "Locked");
  elements.changePanel.classList.toggle("is-disabled", !ready);

  elements.repoSelect.disabled = !state.gitConnected;
  elements.figmaUrls.disabled = !ready;
  elements.prompt.disabled = !ready;
  elements.createJobBtn.disabled = !ready;

  if (!state.figmaConnected && !state.gitConnected) {
    setGateMessage("lock-keyhole", "Connect Figma MCP and GitHub/Git MCP to unlock changes.");
  } else if (!state.figmaConnected) {
    setGateMessage("lock-keyhole", "Git repo is connected. Connect Figma MCP before starting a change.");
  } else if (!state.gitConnected) {
    setGateMessage("lock-keyhole", "Figma MCP is connected. Connect a Git repository before starting a change.");
  } else if (!state.selectedRepo.branches.includes("development")) {
    setGateMessage("circle-alert", "This repo is connected, but it is blocked because the development branch is missing.");
  } else {
    setGateMessage("badge-check", "Everything is connected. You can start a Figma-driven change.");
  }

  renderRepoChecks();
  updateSnackPreview();
  renderIcons();
}

function updateConnectorCard({ card, status, button, connected, connectedText, idleText, idleIcon, buttonText, buttonIcon }) {
  card.classList.toggle("connected", connected);
  setBadge(status, connected ? "success" : "secondary", connected ? connectedText : "Not connected", connected ? "circle-check" : "circle-alert");
  setButtonLabel(button, connected ? buttonIcon : idleIcon, connected ? buttonText : idleText);
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
          <span class="check-icon" aria-hidden="true">${icon(check.ok ? "circle-check" : "circle-alert")}</span>
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
      const stepIcon = isDone ? "check" : isActive ? "loader-circle" : "circle-dot";
      return `
        <li class="${isDone ? "done" : ""} ${isActive ? "active" : ""}">
          <span class="timeline-icon" aria-hidden="true">${icon(stepIcon)}</span>
          <div>
            <strong>${step.label}</strong>
            <p>${step.description}</p>
          </div>
        </li>
      `;
    })
    .join("");
}

function renderSnackPlatformTabs() {
  elements.snackPlatformTabs.innerHTML = snackPlatforms
    .map(
      (platform) => `
        <button
          class="btn ${state.activeSnackPlatform.id === platform.id ? "platform-active" : "platform-idle"}"
          type="button"
          data-platform-id="${platform.id}"
        >
          ${icon(platform.icon)}
          <span>${platform.label}</span>
        </button>
      `,
    )
    .join("");

  elements.snackPlatformTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSnackPlatform = snackPlatforms.find((platform) => platform.id === button.dataset.platformId);
      renderSnackPlatformTabs();
      updateSnackPreview({ forceReload: true });
      renderIcons();
    });
  });
  renderIcons();
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
          <span class="badge rounded-pill text-bg-${item.status === "Passed" ? "success" : "secondary"}">
            ${icon(evidenceIcons[item.status] ?? "circle-dot")}
            <span>${item.status}</span>
          </span>
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

  setBadge(elements.jobIdBadge, "primary", id);
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
    ["implementing", "Expo Snack synced", "Snack is auto-running from the generated repo branch."],
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
  setBadge(elements.jobIdBadge, "secondary", "No job yet");
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
  updateSnackPreview();
  updateApproval();
  renderIcons();
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
          <span class="event-icon" aria-hidden="true">${icon("workflow")}</span>
          <div>
            <time>${event.time}</time>
            <strong>${event.title}</strong>
            <p>${event.body}</p>
          </div>
        </article>
      `,
    )
    .join("");
  elements.rawLog.textContent = state.job.rawLogs.join("\n");
}

function updateSnackPreview({ forceReload = false } = {}) {
  const ready = isReadyForChanges();
  const branch = getSnackBranch();
  const sourceUrl = buildSnackSourceUrl(branch);
  const snackUrl = buildSnackUrl(sourceUrl, true);
  const editorUrl = buildSnackUrl(sourceUrl, false);

  elements.snackRepoName.textContent = state.selectedRepo.fullName;
  elements.snackBranch.textContent = branch;
  elements.snackSourceLink.href = sourceUrl;
  elements.snackSourceLink.textContent = state.selectedRepo.snack.entryFile;
  elements.openSnackLink.href = editorUrl;
  elements.snackLoading.classList.toggle("is-hidden", ready);
  elements.snackFrame.classList.toggle("is-visible", ready);

  if (!ready) {
    setBadge(elements.previewState, "secondary", state.gitConnected ? "Blocked" : "Waiting");
    if (elements.snackFrame.src !== "about:blank") {
      elements.snackFrame.src = "about:blank";
      elements.snackFrame.dataset.snackUrl = "";
    }
    return;
  }

  setBadge(elements.previewState, "success", state.job ? "Auto-running" : "Repo live");
  if (forceReload || elements.snackFrame.dataset.snackUrl !== snackUrl) {
    elements.snackFrame.src = snackUrl;
    elements.snackFrame.dataset.snackUrl = snackUrl;
  }
}

function updateApproval() {
  const canApprove = state.job?.status === "awaiting_review";
  elements.approveBuildBtn.disabled = !canApprove;

  if (!state.job) {
    setBadge(elements.buildState, "secondary", "Blocked");
    elements.buildResult.textContent = "Build approval unlocks after validation and Maestro evidence pass.";
    return;
  }

  if (state.job.status === "awaiting_review") {
    setBadge(elements.buildState, "success", "Ready");
    elements.buildResult.textContent = "Evidence passed. Choose stage or prod, then approve APK generation.";
  } else if (state.job.status === "building") {
    setBadge(elements.buildState, "warning", "Building");
    elements.buildResult.textContent = "APK build is running from the approved branch and commit.";
  } else if (state.job.status === "complete") {
    setBadge(elements.buildState, "success", "APK ready");
    elements.buildResult.innerHTML = `<strong>APK ready:</strong> <code>${state.job.apkUrl}</code>`;
  } else {
    setBadge(elements.buildState, "secondary", "Blocked");
    elements.buildResult.textContent = "Waiting for validation and Maestro evidence.";
  }
}

function getSnackBranch() {
  if (state.job?.branchName) return state.job.branchName;
  if (state.selectedRepo.branches.includes("development")) return "development";
  return state.selectedRepo.defaultBranch;
}

function buildSnackSourceUrl(branch) {
  const entryFile = state.selectedRepo.snack.entryFile
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://raw.githubusercontent.com/${state.selectedRepo.fullName}/${branch}/${entryFile}`;
}

function buildSnackUrl(sourceUrl, embedded) {
  const params = new URLSearchParams({
    platform: state.activeSnackPlatform.id,
    preview: "true",
    theme: "light",
    supportedPlatforms: snackPlatforms.map((platform) => platform.id).join(","),
    sourceUrl,
    name: `${state.selectedRepo.fullName} live preview`,
    description: `Auto-run from ${state.selectedRepo.fullName}@${getSnackBranch()}`,
  });

  if (embedded) {
    params.set("device-frame", "true");
  }

  if (state.selectedRepo.snack.sdkVersion) {
    params.set("sdkVersion", state.selectedRepo.snack.sdkVersion);
  }

  if (state.selectedRepo.snack.dependencies) {
    params.set("dependencies", state.selectedRepo.snack.dependencies);
  }

  return `https://snack.expo.dev/${embedded ? "embedded" : ""}?${params.toString()}`;
}

function randomSha() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function toTitle(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function icon(name) {
  return `<i data-lucide="${name}" aria-hidden="true"></i>`;
}

function setButtonLabel(button, iconName, label) {
  button.innerHTML = `${icon(iconName)}<span>${label}</span>`;
}

function setBadge(badge, variant, label, iconName) {
  badge.className = `badge rounded-pill text-bg-${variant}`;
  badge.innerHTML = iconName ? `${icon(iconName)}<span>${label}</span>` : label;
}

function setGateMessage(iconName, message) {
  elements.gateMessage.innerHTML = `${icon(iconName)}<span>${message}</span>`;
}

function renderIcons() {
  if (!window.lucide?.createIcons) return;
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 2,
    },
  });
}

init();
