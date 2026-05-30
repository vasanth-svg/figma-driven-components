import {
  buildBranchName,
  jobSteps,
  parseFigmaUrls,
  repositories,
  snackPlatforms,
} from "./contracts.js";

const stepOrder = ["connect", "setup", "snack", "plan", "progress", "evidence", "build"];

const state = {
  figmaConnected: false,
  gitConnected: false,
  openAiConnected: false,
  openAiKeyLabel: "",
  setupRunning: false,
  setupComplete: false,
  snackOpened: false,
  aiPlan: null,
  selectedRepo: repositories[0],
  activeSnackPlatform: snackPlatforms[0],
  activeStep: "connect",
  job: null,
  timers: [],
};

const elements = {
  stepNavButtons: document.querySelectorAll("[data-step-target]"),
  stagePanels: document.querySelectorAll("[data-step-panel]"),
  figmaCard: document.querySelector("#figmaCard"),
  gitCard: document.querySelector("#gitCard"),
  figmaStatus: document.querySelector("#figmaStatus"),
  gitStatus: document.querySelector("#gitStatus"),
  figmaConnectBtn: document.querySelector("#figmaConnectBtn"),
  gitConnectBtn: document.querySelector("#gitConnectBtn"),
  connectNextBtn: document.querySelector("#connectNextBtn"),
  gateBadge: document.querySelector("#gateBadge"),
  gateMessage: document.querySelector("#gateMessage"),
  setupBadge: document.querySelector("#setupBadge"),
  setupResult: document.querySelector("#setupResult"),
  runSetupBtn: document.querySelector("#runSetupBtn"),
  openAiStatus: document.querySelector("#openAiStatus"),
  openAiKeyInput: document.querySelector("#openAiKeyInput"),
  openAiError: document.querySelector("#openAiError"),
  openAiConnectBtn: document.querySelector("#openAiConnectBtn"),
  changePanel: document.querySelector("#changePanel"),
  repoSelect: document.querySelector("#repoSelect"),
  repoMeta: document.querySelector("#repoMeta"),
  repoChecks: document.querySelector("#repoChecks"),
  figmaUrls: document.querySelector("#figmaUrls"),
  prompt: document.querySelector("#prompt"),
  branchName: document.querySelector("#branchName"),
  formError: document.querySelector("#formError"),
  aiPlanSummary: document.querySelector("#aiPlanSummary"),
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
  snackNextBtn: document.querySelector("#snackNextBtn"),
  evidenceBadge: document.querySelector("#evidenceBadge"),
  evidenceList: document.querySelector("#evidenceList"),
  evidenceSummary: document.querySelector("#evidenceSummary"),
  screenshotProof: document.querySelector("#screenshotProof"),
  screenshotArtifactMeta: document.querySelector("#screenshotArtifactMeta"),
  screenshotArtifactPath: document.querySelector("#screenshotArtifactPath"),
  videoProof: document.querySelector("#videoProof"),
  videoArtifactMeta: document.querySelector("#videoArtifactMeta"),
  videoArtifactPath: document.querySelector("#videoArtifactPath"),
  snackChangePreview: document.querySelector("#snackChangePreview"),
  snackChangeMeta: document.querySelector("#snackChangeMeta"),
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
  renderRepoOptions();
  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.stepNavButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveStep(button.dataset.stepTarget));
  });

  elements.figmaConnectBtn.addEventListener("click", () => {
    state.figmaConnected = true;
    renderAll();
  });

  elements.gitConnectBtn.addEventListener("click", () => {
    state.gitConnected = true;
    renderAll();
  });

  elements.connectNextBtn.addEventListener("click", () => setActiveStep("setup"));

  elements.repoSelect.addEventListener("change", () => {
    state.selectedRepo = repositories.find((repo) => repo.id === elements.repoSelect.value);
    state.setupComplete = false;
    state.snackOpened = false;
    state.aiPlan = null;
    renderAll();
  });

  elements.openAiKeyInput.addEventListener("input", () => {
    elements.openAiError.textContent = "";
    elements.openAiError.classList.remove("is-note");
  });

  elements.openAiConnectBtn.addEventListener("click", connectOpenAi);
  elements.runSetupBtn.addEventListener("click", runSetup);

  elements.snackNextBtn.addEventListener("click", () => {
    generateAiPlan();
    setActiveStep("plan");
  });

  elements.createJobBtn.addEventListener("click", createJob);
  elements.clearJobBtn.addEventListener("click", resetJob);
  elements.reviewBuildBtn.addEventListener("click", () => setActiveStep("build"));
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
  elements.openAiError.textContent = "Connected for this session. Production stores this server-side in an encrypted vault.";
  elements.openAiError.classList.add("is-note");
  renderAll();
}

function runSetup() {
  if (!state.openAiConnected || !isRepoReady()) return;

  state.setupRunning = true;
  state.setupComplete = false;
  setBadge(elements.setupBadge, "warning", "Running");
  elements.setupResult.innerHTML = `${icon("loader-circle")} <span>Validating repo, preparing Snack entry, and checking agent instructions.</span>`;
  renderIcons();

  const timer = window.setTimeout(() => {
    state.setupRunning = false;
    state.setupComplete = true;
    state.snackOpened = true;
    state.activeStep = "snack";
    openSnackPreview({ forceReload: true });
    renderAll();
  }, 850);
  state.timers.push(timer);
}

function isRepoReady() {
  return state.gitConnected && state.selectedRepo.githubAccess && state.selectedRepo.branches.includes("development");
}

function isConnectReady() {
  return state.figmaConnected && state.gitConnected;
}

function isSetupReady() {
  return isConnectReady() && state.openAiConnected && isRepoReady();
}

function isEvidenceReady() {
  return Boolean(state.job?.evidence);
}

function isBuildStepReady() {
  return Boolean(state.job && ["awaiting_review", "building", "complete"].includes(state.job.status));
}

function canOpenStep(step) {
  if (step === "connect") return true;
  if (step === "setup") return isConnectReady();
  if (step === "snack") return state.setupComplete;
  if (step === "plan") return state.snackOpened;
  if (step === "progress") return Boolean(state.job);
  if (step === "evidence") return isEvidenceReady();
  if (step === "build") return isBuildStepReady();
  return false;
}

function setActiveStep(step) {
  if (!stepOrder.includes(step) || !canOpenStep(step)) return;
  if (step === "plan") generateAiPlan();
  state.activeStep = step;
  renderAll();
}

function bestAvailableStep() {
  if (state.activeStep === "build" && canOpenStep("build")) return "build";
  if (state.activeStep === "evidence" && canOpenStep("evidence")) return "evidence";
  if (state.job && !isEvidenceReady()) return "progress";
  if (state.aiPlan && canOpenStep("plan")) return "plan";
  if (state.snackOpened) return "snack";
  if (state.setupComplete) return "snack";
  if (isConnectReady()) return "setup";
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
  if (step === "connect") return isConnectReady();
  if (step === "setup") return state.setupComplete;
  if (step === "snack") return Boolean(state.aiPlan || state.job);
  if (step === "plan") return Boolean(state.job);
  if (step === "progress") return isEvidenceReady();
  if (step === "evidence") return state.job?.status === "building" || state.job?.status === "complete";
  if (step === "build") return state.job?.status === "complete";
  return false;
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
    connectedText: state.gitConnected ? "Connected" : "Not connected",
    idleText: "Connect Git repository",
    idleIcon: "git-pull-request-create",
    buttonText: "Git repo connected",
    buttonIcon: "circle-check",
  });

  const ready = isConnectReady();
  setBadge(elements.gateBadge, ready ? "success" : "secondary", ready ? "Connected" : "Locked");
  elements.connectNextBtn.disabled = !ready;
  elements.changePanel.classList.toggle("is-disabled", !state.aiPlan);

  if (!state.figmaConnected && !state.gitConnected) {
    setGateMessage("lock-keyhole", "Connect Figma MCP and GitHub/Git MCP to continue.");
  } else if (!state.figmaConnected) {
    setGateMessage("lock-keyhole", "Git repo is connected. Connect Figma MCP next.");
  } else if (!state.gitConnected) {
    setGateMessage("lock-keyhole", "Figma MCP is connected. Connect GitHub/Git MCP next.");
  } else {
    setGateMessage("badge-check", "Tools connected. Continue to select the repo and run setup.");
  }
}

function updateConnectorCard({ card, status, button, connected, connectedText, idleText, idleIcon, buttonText, buttonIcon }) {
  card.classList.toggle("connected", connected);
  setBadge(status, connected ? "success" : "secondary", connected ? connectedText : "Not connected", connected ? "circle-check" : "circle-alert");
  setButtonLabel(button, connected ? buttonIcon : idleIcon, connected ? buttonText : idleText);
  button.disabled = connected;
}

function renderSetup() {
  const setupReady = isSetupReady();

  elements.repoSelect.disabled = !state.gitConnected || state.setupRunning;
  elements.runSetupBtn.disabled = !setupReady || state.setupRunning || state.setupComplete;
  elements.openAiKeyInput.disabled = state.openAiConnected || state.setupRunning;
  elements.openAiConnectBtn.disabled = state.openAiConnected || state.setupRunning;

  setBadge(
    elements.openAiStatus,
    state.openAiConnected ? "success" : "secondary",
    state.openAiConnected ? "Agent ready" : "Not connected",
    state.openAiConnected ? "circle-check" : "circle-alert",
  );
  setButtonLabel(
    elements.openAiConnectBtn,
    state.openAiConnected ? "circle-check" : "shield-check",
    state.openAiConnected ? `${state.openAiKeyLabel} connected` : "Connect OpenAI agent",
  );

  if (state.setupRunning) {
    setBadge(elements.setupBadge, "warning", "Running");
  } else if (state.setupComplete) {
    setBadge(elements.setupBadge, "success", "Ready");
    elements.setupResult.innerHTML = `${icon("badge-check")} <span>Setup complete. The app is open in Expo Snack from the selected repo branch.</span>`;
  } else {
    setBadge(elements.setupBadge, setupReady ? "primary" : "secondary", setupReady ? "Ready" : "Waiting");
    elements.setupResult.innerHTML = `${icon("settings-2")} <span>Setup will validate the repo, confirm the development branch, prepare Snack, and connect the AI runtime.</span>`;
  }
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
    {
      label: "OpenAI agent runtime",
      ok: state.openAiConnected,
      detail: state.openAiConnected ? "Ready to auto-create prompt and branch plan" : "Waiting for API key",
    },
    {
      label: "Snack preview entry",
      ok: state.setupComplete,
      detail: state.setupComplete ? "Prepared from repo source URL" : "Prepared during setup",
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
    ? "Changed screenshot is ready in Snack. Review it before approving a build."
    : "After code changes finish, the worker captures a changed screenshot and refreshes the Snack preview.";
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
      openSnackPreview({ forceReload: true });
      renderIcons();
    });
  });
}

function generateAiPlan() {
  if (state.aiPlan) return;

  const figmaUrl = "https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22";
  const prompt = "Implement the RSU insights screen from the selected Figma frame, keep the current mobile folder structure, and reuse existing app components before adding new ones.";

  state.aiPlan = {
    figmaUrls: [figmaUrl],
    prompt,
    branchName: buildBranchName("job-preview", prompt),
    baseBranch: "development",
  };
}

function renderAiPlan() {
  if (!state.aiPlan && state.snackOpened) generateAiPlan();

  const hasPlan = Boolean(state.aiPlan);
  elements.figmaUrls.value = hasPlan ? state.aiPlan.figmaUrls.join("\n") : "";
  elements.prompt.value = hasPlan ? state.aiPlan.prompt : "";
  elements.branchName.textContent = hasPlan ? state.aiPlan.branchName : "figma/job-preview-design-update";
  elements.createJobBtn.disabled = !hasPlan || Boolean(state.job);
  elements.aiPlanSummary.classList.toggle("is-ready", hasPlan);
}

function renderEvidence() {
  const evidence = state.job?.evidence ?? [
    { label: "Validation", value: "Waiting for AI code changes", status: "Waiting" },
    { label: "Snack screenshot", value: "Captured after implementation", status: "Waiting" },
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
  setBadge(elements.evidenceBadge, artifacts ? "success" : "secondary", artifacts ? "Evidence ready" : "Waiting");

  if (!artifacts) {
    elements.screenshotProof.className = "screenshot-proof is-waiting";
    elements.screenshotProof.innerHTML = `
      <div class="mock-phone-screen">
        <span class="mock-status"></span>
        <strong>Waiting for changed screen</strong>
        <p>After AI finishes, this screenshot is attached and shown beside Snack.</p>
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
    elements.evidenceSummary.textContent = "Build approval stays locked until validation, Snack refresh, screenshot capture, and video recording pass.";
    elements.snackChangeMeta.textContent = "Waiting for AI changes to finish.";
    elements.reviewBuildBtn.disabled = true;
    return;
  }

  elements.screenshotProof.className = "screenshot-proof is-ready";
  elements.screenshotProof.innerHTML = changedScreenMarkup();
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
  elements.snackChangePreview.innerHTML = changedScreenMarkup("compact");
  elements.snackChangeMeta.textContent = `Snack refreshed from ${state.job.branchName} at ${state.job.commitSha}.`;

  if (isBuildStepReady()) {
    elements.evidenceSummary.textContent = "Changed screenshot is visible in Snack. Continue to approval when this looks right.";
    elements.reviewBuildBtn.disabled = false;
  } else {
    elements.evidenceSummary.textContent = "Screenshot is captured. Waiting for PR creation and final validation summary.";
    elements.reviewBuildBtn.disabled = true;
  }
}

function changedScreenMarkup(extraClass = "") {
  return `
    <div class="mock-phone-screen ${extraClass}">
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
}

function createJob() {
  clearTimers();
  elements.formError.textContent = "";

  if (!state.aiPlan) {
    elements.formError.textContent = "Let AI generate the Figma URL, prompt, and branch plan first.";
    return;
  }

  const parsed = parseFigmaUrls(state.aiPlan.figmaUrls.join("\n"));
  if (!parsed.ok) {
    elements.formError.textContent = parsed.error;
    return;
  }

  const id = `job-${Math.floor(1000 + Math.random() * 9000)}`;
  state.job = {
    id,
    repository: state.selectedRepo,
    figmaInputs: parsed.urls,
    prompt: state.aiPlan.prompt,
    branchName: buildBranchName(id, state.aiPlan.prompt),
    status: "queued",
    events: [],
    rawLogs: [],
    commitSha: "pending",
    evidence: null,
    evidenceArtifacts: null,
    buildArtifacts: null,
    approved: false,
  };

  state.aiPlan.branchName = state.job.branchName;
  state.activeStep = "progress";
  setBadge(elements.jobIdBadge, "primary", id);
  elements.branchName.textContent = state.job.branchName;
  addEvent("AI change plan accepted", `Branch ${state.job.branchName} will open a PR to development.`);
  addRawLog(`queued ${id} ${state.job.branchName}`);
  runJobSimulation();
  renderAll();
}

function runJobSimulation() {
  const sequence = [
    ["validating_repo", "Repository verified", "GitHub/Git MCP confirmed access and development branch."],
    ["fetching_figma", "Figma design fetched", "Figma MCP prepared design context, screenshot, and metadata fallback."],
    ["implementing", "Code changes applied", "AI updated the repo branch and refreshed the Snack entry."],
    ["validating_code", "Code checks passed", "Lint, typecheck, and local build checks completed."],
    ["creating_pr", "Draft PR prepared", `Target branch is development from ${state.job.branchName}.`],
    ["testing_flow", "Snack screenshot captured", "Changed screen screenshot and MP4 recording are attached to the job."],
    ["awaiting_review", "Ready for review", "Snack shows the changed UI. APK build remains blocked until approval."],
  ];

  sequence.forEach(([status, title, body], index) => {
    const timer = window.setTimeout(() => {
      state.job.status = status;
      if (status === "implementing") state.job.commitSha = randomSha();
      if (status === "testing_flow") {
        state.activeStep = "evidence";
        state.job.evidence = [
          { label: "Validation", value: "lint, typecheck, and PR checks passed", status: "Passed" },
          { label: "Snack screenshot", value: "02-rsu-insights-snack.png", status: "Passed" },
          { label: "Video recording", value: "flow-recording.mp4", status: "Passed" },
        ];
        state.job.evidenceArtifacts = {
          screenName: "RSU Insights Snack preview",
          screenPath: `artifacts/${state.job.id}/screenshots/02-rsu-insights-snack.png`,
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
  state.aiPlan = null;
  state.activeStep = state.snackOpened ? "snack" : state.setupComplete ? "snack" : isConnectReady() ? "setup" : "connect";
  elements.formError.textContent = "";
  setBadge(elements.jobIdBadge, "secondary", "No job yet");
  elements.buildResult.textContent = "Build approval unlocks after validation and Maestro evidence pass.";
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
  renderSetup();
  renderRepoChecks();
  renderTimeline();
  renderSnackPlatformTabs();
  renderAiPlan();
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
    elements.events.innerHTML = `<p class="empty-state">Start AI code changes to see progress.</p>`;
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
  openSnackPreview({ forceReload });
}

function openSnackPreview({ forceReload = false } = {}) {
  const branch = getSnackBranch();
  const sourceUrl = buildSnackSourceUrl(branch);
  const snackUrl = buildSnackUrl(sourceUrl, true);
  const editorUrl = buildSnackUrl(sourceUrl, false);
  const ready = state.snackOpened;

  elements.snackRepoName.textContent = state.selectedRepo.fullName;
  elements.snackBranch.textContent = branch;
  elements.snackSourceLink.href = sourceUrl;
  elements.snackSourceLink.textContent = state.selectedRepo.snack.entryFile;
  elements.openSnackLink.href = editorUrl;
  elements.snackNextBtn.disabled = !ready;
  elements.snackLoading.classList.toggle("is-hidden", ready);
  elements.snackFrame.classList.toggle("is-visible", ready);

  if (!ready) {
    setBadge(elements.previewState, "secondary", "Waiting");
    if (elements.snackFrame.src !== "about:blank") {
      elements.snackFrame.src = "about:blank";
      elements.snackFrame.dataset.snackUrl = "";
    }
    return;
  }

  const label = isEvidenceReady() ? "Changed UI ready" : "App running";
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
    elements.buildResult.textContent = "Changed screenshot and recording passed. Choose stage or prod, then approve APK generation.";
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
    elements.releaseSummary.textContent = "Review the Snack screenshot and video recording before approving build generation.";
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
