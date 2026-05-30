import {
  buildBranchName,
  jobSteps,
  parseFigmaUrls,
  repositories,
  snackPlatforms,
} from "./contracts.js";

const stepOrder = ["connect", "change", "progress", "evidence", "build"];

const state = {
  openAiConnected: false,
  openAiKeyLabel: "",
  figmaConnected: false,
  gitConnected: false,
  selectedRepo: repositories[0],
  activeSnackPlatform: snackPlatforms[0],
  activeStep: "connect",
  job: null,
  timers: [],
};

const elements = {
  stepNavButtons: document.querySelectorAll("[data-step-target]"),
  stagePanels: document.querySelectorAll("[data-step-panel]"),
  openAiCard: document.querySelector("#openAiCard"),
  figmaCard: document.querySelector("#figmaCard"),
  gitCard: document.querySelector("#gitCard"),
  openAiStatus: document.querySelector("#openAiStatus"),
  figmaStatus: document.querySelector("#figmaStatus"),
  gitStatus: document.querySelector("#gitStatus"),
  openAiKeyInput: document.querySelector("#openAiKeyInput"),
  openAiError: document.querySelector("#openAiError"),
  openAiConnectBtn: document.querySelector("#openAiConnectBtn"),
  figmaConnectBtn: document.querySelector("#figmaConnectBtn"),
  gitConnectBtn: document.querySelector("#gitConnectBtn"),
  connectNextBtn: document.querySelector("#connectNextBtn"),
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
  progressNextHint: document.querySelector("#progressNextHint"),
  snackPlatformTabs: document.querySelector("#snackPlatformTabs"),
  snackLoading: document.querySelector("#snackLoading"),
  snackFrame: document.querySelector("#snackFrame"),
  previewState: document.querySelector("#previewState"),
  snackRepoName: document.querySelector("#snackRepoName"),
  snackBranch: document.querySelector("#snackBranch"),
  snackSourceLink: document.querySelector("#snackSourceLink"),
  openSnackLink: document.querySelector("#openSnackLink"),
  evidenceList: document.querySelector("#evidenceList"),
  evidenceSummary: document.querySelector("#evidenceSummary"),
  screenshotProof: document.querySelector("#screenshotProof"),
  screenshotArtifactMeta: document.querySelector("#screenshotArtifactMeta"),
  screenshotArtifactPath: document.querySelector("#screenshotArtifactPath"),
  videoProof: document.querySelector("#videoProof"),
  videoArtifactMeta: document.querySelector("#videoArtifactMeta"),
  videoArtifactPath: document.querySelector("#videoArtifactPath"),
  reviewBuildBtn: document.querySelector("#reviewBuildBtn"),
  buildState: document.querySelector("#buildState"),
  releaseSummary: document.querySelector("#releaseSummary"),
  approveBuildBtn: document.querySelector("#approveBuildBtn"),
  buildResult: document.querySelector("#buildResult"),
  buildArtifactPanel: document.querySelector("#buildArtifactPanel"),
  apkArtifactPath: document.querySelector("#apkArtifactPath"),
  buildScreenPath: document.querySelector("#buildScreenPath"),
  buildRecordingPath: document.querySelector("#buildRecordingPath"),
};

const evidenceIcons = {
  Passed: "circle-check",
  Waiting: "circle-dot",
};

function init() {
  elements.figmaUrls.value = "https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22";
  elements.prompt.value = "Implement the new RSU insights screen and keep the current mobile app structure.";

  renderRepoOptions();
  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.stepNavButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveStep(button.dataset.stepTarget));
  });

  elements.openAiKeyInput.addEventListener("input", () => {
    elements.openAiError.textContent = "";
    elements.openAiError.classList.remove("is-note");
  });

  elements.openAiConnectBtn.addEventListener("click", connectOpenAi);

  elements.figmaConnectBtn.addEventListener("click", () => {
    if (!state.openAiConnected) return;
    state.figmaConnected = true;
    renderAll();
  });

  elements.gitConnectBtn.addEventListener("click", () => {
    if (!state.openAiConnected) return;
    state.gitConnected = true;
    renderAll();
  });

  elements.connectNextBtn.addEventListener("click", () => setActiveStep("change"));
  elements.reviewBuildBtn.addEventListener("click", () => setActiveStep("build"));

  elements.repoSelect.addEventListener("change", () => {
    state.selectedRepo = repositories.find((repo) => repo.id === elements.repoSelect.value);
    renderAll();
  });

  elements.prompt.addEventListener("input", updateBranchPreview);
  elements.createJobBtn.addEventListener("click", createJob);
  elements.clearJobBtn.addEventListener("click", resetJob);
  elements.approveBuildBtn.addEventListener("click", approveBuild);
}

function connectOpenAi() {
  const key = elements.openAiKeyInput.value.trim();

  if (!/^sk-[A-Za-z0-9_-]{6,}/.test(key)) {
    elements.openAiError.textContent = "Add an OpenAI API key that starts with sk-. The key is never shown in logs.";
    elements.openAiKeyInput.focus();
    renderIcons();
    return;
  }

  state.openAiConnected = true;
  state.openAiKeyLabel = maskKey(key);
  elements.openAiKeyInput.value = "";
  elements.openAiKeyInput.placeholder = state.openAiKeyLabel;
  elements.openAiError.textContent = "Connected for this session. Production should store this server-side in an encrypted vault.";
  elements.openAiError.classList.add("is-note");
  renderAll();
}

function isRepoReady() {
  return state.gitConnected && state.selectedRepo.githubAccess && state.selectedRepo.branches.includes("development");
}

function isReadyForChanges() {
  return state.openAiConnected && state.figmaConnected && isRepoReady();
}

function isEvidenceReady() {
  return Boolean(state.job?.evidence);
}

function isBuildStepReady() {
  return Boolean(state.job && ["awaiting_review", "building", "complete"].includes(state.job.status));
}

function canOpenStep(step) {
  if (step === "connect") return true;
  if (step === "change") return isReadyForChanges();
  if (step === "progress") return Boolean(state.job);
  if (step === "evidence") return isEvidenceReady();
  if (step === "build") return isBuildStepReady();
  return false;
}

function setActiveStep(step) {
  if (!stepOrder.includes(step) || !canOpenStep(step)) return;
  state.activeStep = step;
  renderStepShell();
  renderIcons();
}

function bestAvailableStep() {
  if (state.activeStep === "build" && canOpenStep("build")) return "build";
  if (state.activeStep === "evidence" && canOpenStep("evidence")) return "evidence";
  if (state.job && !isEvidenceReady()) return "progress";
  if (isReadyForChanges() && !state.job) return "change";
  return "connect";
}

function renderStepShell() {
  if (!canOpenStep(state.activeStep)) {
    state.activeStep = bestAvailableStep();
  }

  elements.stepNavButtons.forEach((button) => {
    const step = button.dataset.stepTarget;
    button.disabled = !canOpenStep(step);
    button.classList.toggle("is-active", state.activeStep === step);
    button.classList.toggle("is-complete", isStepComplete(step));
  });

  elements.stagePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.stepPanel === state.activeStep);
  });
}

function isStepComplete(step) {
  if (step === "connect") return isReadyForChanges();
  if (step === "change") return Boolean(state.job);
  if (step === "progress") return isEvidenceReady();
  if (step === "evidence") return state.job?.status === "building" || state.job?.status === "complete";
  if (step === "build") return state.job?.status === "complete";
  return false;
}

function renderConnections() {
  renderOpenAiConnection();

  updateConnectorCard({
    card: elements.figmaCard,
    status: elements.figmaStatus,
    button: elements.figmaConnectBtn,
    connected: state.figmaConnected,
    canConnect: state.openAiConnected,
    connectedText: "Connected",
    idleText: "Connect Figma MCP",
    blockedText: "Connect OpenAI first",
    idleIcon: "plug-zap",
    buttonText: "Figma MCP connected",
    buttonIcon: "circle-check",
  });

  updateConnectorCard({
    card: elements.gitCard,
    status: elements.gitStatus,
    button: elements.gitConnectBtn,
    connected: state.gitConnected,
    canConnect: state.openAiConnected,
    connectedText: isRepoReady() ? "Repo ready" : "Connected",
    idleText: "Connect Git repository",
    blockedText: "Connect OpenAI first",
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
  elements.connectNextBtn.disabled = !ready;

  if (!state.openAiConnected) {
    setGateMessage("lock-keyhole", "Add the OpenAI API key to enable the agent runtime and tool orchestration.");
  } else if (!state.figmaConnected && !state.gitConnected) {
    setGateMessage("lock-keyhole", "OpenAI is connected. Connect Figma MCP and GitHub/Git MCP next.");
  } else if (!state.figmaConnected) {
    setGateMessage("lock-keyhole", "Git repo is connected. Connect Figma MCP before starting a change.");
  } else if (!state.gitConnected) {
    setGateMessage("lock-keyhole", "Figma MCP is connected. Connect a Git repository before starting a change.");
  } else if (!state.selectedRepo.branches.includes("development")) {
    setGateMessage("circle-alert", "This repo is connected, but it is blocked because the development branch is missing.");
  } else {
    setGateMessage("badge-check", "Everything is connected. Continue to the change request screen.");
  }
}

function renderOpenAiConnection() {
  elements.openAiCard.classList.toggle("connected", state.openAiConnected);
  setBadge(
    elements.openAiStatus,
    state.openAiConnected ? "success" : "secondary",
    state.openAiConnected ? "Agent ready" : "Not connected",
    state.openAiConnected ? "circle-check" : "circle-alert",
  );
  elements.openAiKeyInput.disabled = state.openAiConnected;
  elements.openAiConnectBtn.disabled = state.openAiConnected;
  setButtonLabel(
    elements.openAiConnectBtn,
    state.openAiConnected ? "circle-check" : "shield-check",
    state.openAiConnected ? `${state.openAiKeyLabel} connected` : "Connect OpenAI agent",
  );
}

function updateConnectorCard({
  card,
  status,
  button,
  connected,
  canConnect,
  connectedText,
  idleText,
  blockedText,
  idleIcon,
  buttonText,
  buttonIcon,
}) {
  card.classList.toggle("connected", connected);
  const waitingForAgent = !connected && !canConnect;
  const statusLabel = connected ? connectedText : waitingForAgent ? "Waiting for OpenAI" : "Not connected";
  const statusIcon = connected ? "circle-check" : waitingForAgent ? "clock" : "circle-alert";
  setBadge(status, connected ? "success" : "secondary", statusLabel, statusIcon);
  setButtonLabel(button, connected ? buttonIcon : idleIcon, connected ? buttonText : waitingForAgent ? blockedText : idleText);
  button.disabled = connected || waitingForAgent;
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
      label: "OpenAI agent runtime",
      ok: state.openAiConnected,
      detail: state.openAiConnected ? "Ready to plan changes and coordinate tools" : "Waiting for API key",
    },
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
    [
      "queued",
      "validating_repo",
      "fetching_figma",
      "implementing",
      "validating_code",
      "creating_pr",
      "testing_flow",
      "awaiting_review",
    ].includes(step.id),
  );
  const currentIndex = state.job ? visibleSteps.findIndex((step) => step.id === state.job.status) : -1;
  const effectiveIndex = currentIndex === -1 && state.job ? visibleSteps.length : currentIndex;

  elements.timeline.innerHTML = visibleSteps
    .map((step, index) => {
      const isDone = state.job && index < effectiveIndex;
      const isActive = state.job && index === effectiveIndex;
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

  elements.progressNextHint.textContent = isEvidenceReady()
    ? "Evidence is ready. Review the changed screen and recording before approving a build."
    : "Screenshot and video evidence will appear automatically when Maestro finishes.";
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
}

function renderEvidence() {
  const evidence = state.job?.evidence ?? [
    { label: "Validation", value: "Waiting for a connected change request", status: "Waiting" },
    { label: "Changed screen screenshot", value: "Captured after implementation", status: "Waiting" },
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

  renderEvidenceArtifacts();
}

function renderEvidenceArtifacts() {
  const artifacts = state.job?.evidenceArtifacts;

  if (!artifacts) {
    elements.screenshotProof.className = "screenshot-proof is-waiting";
    elements.screenshotProof.innerHTML = `
      <div class="mock-phone-screen">
        <span class="mock-status"></span>
        <strong>Waiting for Maestro screenshot</strong>
        <p>Screen capture appears here after the code changes and flow test finish.</p>
      </div>
    `;
    elements.videoProof.className = "video-proof is-waiting";
    elements.videoProof.innerHTML = `
      ${icon("play-circle")}
      <strong>Waiting for MP4 recording</strong>
      <p>The full user flow recording appears here before APK approval.</p>
    `;
    elements.screenshotArtifactMeta.textContent = "No screenshot captured yet.";
    elements.videoArtifactMeta.textContent = "No recording captured yet.";
    elements.screenshotArtifactPath.textContent = "artifacts/pending/screen.png";
    elements.videoArtifactPath.textContent = "artifacts/pending/flow.mp4";
    elements.evidenceSummary.textContent = "Build approval stays locked until validation, screenshot capture, and video recording pass.";
    elements.reviewBuildBtn.disabled = true;
    return;
  }

  elements.screenshotProof.className = "screenshot-proof is-ready";
  elements.screenshotProof.innerHTML = `
    <div class="mock-phone-screen">
      <span class="mock-status ready"></span>
      <div class="mock-app-bar">
        <span></span>
        <strong>RSU Insights</strong>
        <span></span>
      </div>
      <div class="mock-stat-card">
        <small>Vesting value</small>
        <strong>$42,850</strong>
        <span>+18.4% this quarter</span>
      </div>
      <div class="mock-list-row"></div>
      <div class="mock-list-row short"></div>
    </div>
  `;
  elements.videoProof.className = "video-proof is-ready";
  elements.videoProof.innerHTML = `
    ${icon("play-circle")}
    <strong>${artifacts.videoName}</strong>
    <p>${artifacts.duration} recording of the full Maestro flow.</p>
    <div class="video-timeline"><span style="width: 78%"></span></div>
  `;
  elements.screenshotArtifactMeta.textContent = `${artifacts.screenName} captured from ${state.job.commitSha}.`;
  elements.videoArtifactMeta.textContent = `MP4 recording stored with job ${state.job.id}.`;
  elements.screenshotArtifactPath.textContent = artifacts.screenPath;
  elements.videoArtifactPath.textContent = artifacts.videoPath;

  if (isBuildStepReady()) {
    elements.evidenceSummary.textContent = "Evidence is ready. Review it here, then continue to approval when you are comfortable.";
    elements.reviewBuildBtn.disabled = false;
  } else {
    elements.evidenceSummary.textContent = "Evidence is captured. Waiting for PR creation and final validation summary.";
    elements.reviewBuildBtn.disabled = true;
  }
}

function updateBranchPreview() {
  const previewJobId = state.job?.id ?? "job-preview";
  elements.branchName.textContent = buildBranchName(previewJobId, elements.prompt.value);
}

function createJob() {
  clearTimers();
  elements.formError.textContent = "";

  if (!isReadyForChanges()) {
    elements.formError.textContent = "Connect OpenAI, Figma MCP, and GitHub/Git MCP before starting changes.";
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
    evidenceArtifacts: null,
    buildArtifacts: null,
    approved: false,
  };

  state.activeStep = "progress";
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
    ["implementing", "Code changes applied", "The OpenAI agent updated the repo branch and refreshed the Snack entry."],
    ["validating_code", "Code checks passed", "Lint, typecheck, and local build checks completed."],
    ["creating_pr", "Draft PR prepared", `Target branch is development from ${state.job.branchName}.`],
    ["testing_flow", "Evidence captured", "The changed screen screenshot and MP4 recording are attached to the job."],
    ["awaiting_review", "Ready for review", "APK build remains blocked until you approve stage or prod."],
  ];

  sequence.forEach(([status, title, body], index) => {
    const timer = window.setTimeout(() => {
      state.job.status = status;
      if (status === "implementing") state.job.commitSha = randomSha();
      if (status === "testing_flow") {
        state.activeStep = "evidence";
        state.job.evidence = [
          { label: "Validation", value: "lint, typecheck, and PR checks passed", status: "Passed" },
          { label: "Changed screen screenshot", value: "02-rsu-insights-screen.png", status: "Passed" },
          { label: "Video recording", value: "flow-recording.mp4", status: "Passed" },
        ];
        state.job.evidenceArtifacts = {
          screenName: "RSU Insights screen",
          screenPath: `artifacts/${state.job.id}/screenshots/02-rsu-insights-screen.png`,
          videoName: "flow-recording.mp4",
          videoPath: `artifacts/${state.job.id}/recordings/flow-recording.mp4`,
          duration: "00:38",
        };
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

  state.activeStep = "build";
  state.job.approved = true;
  state.job.status = "building";
  state.job.buildArtifacts = null;
  addEvent("APK build approved", `${profile} selected. EAS profile: ${easProfile}.`);
  addRawLog(`approved profile=${profile} eas=${easProfile} sha=${state.job.commitSha}`);
  renderAll();

  const timer = window.setTimeout(() => {
    state.job.status = "complete";
    state.job.apkUrl = `https://artifacts.local/${state.job.id}/${profile}.apk`;
    state.job.buildArtifacts = {
      apkPath: state.job.apkUrl,
      screenPath: `artifacts/${state.job.id}/build/${profile}-apk-ready.png`,
      recordingPath: `artifacts/${state.job.id}/build/${profile}-build-recording.mp4`,
    };
    addEvent("APK ready", `${profile}.apk is available in the artifact store with build screen and recording evidence.`);
    addRawLog(`complete apk=${state.job.apkUrl}`);
    renderAll();
  }, 1200);
  state.timers.push(timer);
}

function resetJob() {
  clearTimers();
  state.job = null;
  state.activeStep = isReadyForChanges() ? "change" : "connect";
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
  renderRepoChecks();
  renderTimeline();
  renderSnackPlatformTabs();
  renderEvents();
  renderEvidence();
  updateSnackPreview();
  updateApproval();
  renderBuildArtifacts();
  renderStepShell();
  renderIcons();
}

function renderEvents() {
  if (!state.job) {
    elements.events.innerHTML = `<p class="empty-state">Connect tools and start a change to see agent progress.</p>`;
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
    setBadge(elements.previewState, "secondary", state.openAiConnected ? "Blocked" : "Waiting");
    if (elements.snackFrame.src !== "about:blank") {
      elements.snackFrame.src = "about:blank";
      elements.snackFrame.dataset.snackUrl = "";
    }
    return;
  }

  const label = isEvidenceReady() ? "Evidence ready" : state.job ? "Auto-running" : "Repo live";
  setBadge(elements.previewState, isEvidenceReady() ? "success" : "primary", label);
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
    elements.releaseSummary.textContent = "Stage maps to EAS preview. Prod maps to EAS production. v1 generates APK artifacts only.";
    elements.buildResult.textContent = "Build approval unlocks after validation and Maestro evidence pass.";
    return;
  }

  if (state.job.status === "awaiting_review") {
    setBadge(elements.buildState, "success", "Ready");
    elements.releaseSummary.textContent = `Ready to build from ${state.job.branchName} at commit ${state.job.commitSha}.`;
    elements.buildResult.textContent = "Evidence passed. Choose stage or prod, then approve APK generation.";
  } else if (state.job.status === "building") {
    setBadge(elements.buildState, "warning", "Building");
    elements.releaseSummary.textContent = "APK generation is running. The final screen and recording will appear here when complete.";
    elements.buildResult.textContent = "APK build is running from the approved branch and commit.";
  } else if (state.job.status === "complete") {
    setBadge(elements.buildState, "success", "APK ready");
    elements.releaseSummary.textContent = "Build generated successfully with APK, result screen, and build recording evidence.";
    elements.buildResult.innerHTML = `<strong>APK ready:</strong> <code>${state.job.apkUrl}</code>`;
  } else {
    setBadge(elements.buildState, "secondary", "Blocked");
    elements.releaseSummary.textContent = "Review the screenshot and video recording before approving build generation.";
    elements.buildResult.textContent = "Waiting for validation and Maestro evidence.";
  }
}

function renderBuildArtifacts() {
  if (!state.job?.buildArtifacts) {
    elements.buildArtifactPanel.classList.add("is-empty");
    elements.apkArtifactPath.textContent = state.job?.status === "building" ? "Build running..." : "Waiting for approval";
    elements.buildScreenPath.textContent = state.job?.status === "building" ? "Capturing build result screen..." : "Waiting for build";
    elements.buildRecordingPath.textContent = state.job?.status === "building" ? "Recording build handoff..." : "Waiting for build";
    return;
  }

  elements.buildArtifactPanel.classList.remove("is-empty");
  elements.apkArtifactPath.textContent = state.job.buildArtifacts.apkPath;
  elements.buildScreenPath.textContent = state.job.buildArtifacts.screenPath;
  elements.buildRecordingPath.textContent = state.job.buildArtifacts.recordingPath;
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

function maskKey(key) {
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

function randomSha() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
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
