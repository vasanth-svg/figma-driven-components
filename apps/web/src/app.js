import {
  buildBranchName,
  displaySizes,
  jobSteps,
  parseFigmaUrls,
  repositories,
} from "./contracts.js";

const state = {
  selectedRepo: repositories[0],
  activeSize: displaySizes[0],
  job: null,
  timers: [],
};

const elements = {
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
  jobState: document.querySelector("#jobState"),
  timeline: document.querySelector("#timeline"),
  events: document.querySelector("#events"),
  rawLog: document.querySelector("#rawLog"),
  sizeTabs: document.querySelector("#sizeTabs"),
  deviceFrame: document.querySelector("#deviceFrame"),
  captureMode: document.querySelector("#captureMode"),
  routeName: document.querySelector("#routeName"),
  commitSha: document.querySelector("#commitSha"),
  capturedAt: document.querySelector("#capturedAt"),
  evidenceState: document.querySelector("#evidenceState"),
  evidenceList: document.querySelector("#evidenceList"),
  buildState: document.querySelector("#buildState"),
  approveBuildBtn: document.querySelector("#approveBuildBtn"),
  buildResult: document.querySelector("#buildResult"),
};

function init() {
  elements.figmaUrls.value = "https://figma.com/design/FgMA1234/Rovia-Mobile?node-id=104-22";
  elements.prompt.value =
    "Implement the RSU insight summary card and keep the existing app folder structure.";

  renderRepoOptions();
  renderRepoChecks();
  renderTimeline();
  renderSizeTabs();
  renderEvidence();
  updateBranchPreview();
  bindEvents();
}

function bindEvents() {
  elements.repoSelect.addEventListener("change", () => {
    state.selectedRepo = repositories.find((repo) => repo.id === elements.repoSelect.value);
    renderRepoChecks();
    updateBranchPreview();
  });

  elements.prompt.addEventListener("input", updateBranchPreview);
  elements.createJobBtn.addEventListener("click", createJob);
  elements.clearJobBtn.addEventListener("click", resetJob);
  elements.approveBuildBtn.addEventListener("click", approveBuild);
}

function renderRepoOptions() {
  elements.repoSelect.innerHTML = repositories
    .map((repo) => `<option value="${repo.id}">${repo.fullName}</option>`)
    .join("");
  elements.repoSelect.value = state.selectedRepo.id;
}

function renderRepoChecks() {
  const repo = state.selectedRepo;
  elements.repoMeta.textContent = `${repo.description} Default branch: ${repo.defaultBranch}.`;

  const checks = [
    {
      label: "GitHub MCP repository access",
      ok: repo.githubAccess,
      detail: repo.githubAccess ? "Connected" : "Missing access",
    },
    {
      label: "development branch",
      ok: repo.branches.includes("development"),
      detail: repo.branches.includes("development") ? "Required base branch exists" : "Blocked until created",
    },
    {
      label: "Repo instructions",
      ok: repo.hasAgentInstructions,
      detail: repo.hasAgentInstructions ? "AGENTS.md and project skills detected" : "Fallback conventions only",
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

  elements.createJobBtn.disabled = !repo.githubAccess || !repo.branches.includes("development");
}

function renderTimeline() {
  const currentIndex = state.job ? jobSteps.findIndex((step) => step.id === state.job.status) : -1;
  elements.timeline.innerHTML = jobSteps
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
      elements.deviceFrame.className = `device-frame ${state.activeSize.id}`;
      renderSizeTabs();
      updatePreviewMeta();
    });
  });
}

function renderEvidence() {
  const evidence = state.job?.evidence ?? [
    { label: "Maestro test file", value: ".maestro/<feature>.yaml", status: "Waiting" },
    { label: "Screenshots", value: "Entry, changed screen, success", status: "Waiting" },
    { label: "Video recording", value: "Full Android flow", status: "Waiting" },
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

  const parsed = parseFigmaUrls(elements.figmaUrls.value);
  if (!parsed.ok) {
    elements.formError.textContent = parsed.error;
    return;
  }

  if (!state.selectedRepo.branches.includes("development")) {
    elements.formError.textContent = "Blocked: selected repository does not have a development branch.";
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
  addEvent("Job accepted", `Created ${id} for ${state.selectedRepo.fullName}.`);
  addRawLog(`queued ${id} ${state.job.branchName}`);
  runJobSimulation();
  renderAll();
}

function runJobSimulation() {
  const sequence = [
    ["validating_repo", "Verified GitHub access", "Confirmed development branch and repo instructions."],
    ["fetching_figma", "Fetched Figma context", "Design context and screenshot requests are ready for each node."],
    ["implementing", "Worker implementation checkpoint", "Changes are isolated in the generated figma branch."],
    ["validating_code", "Validation completed", "lint and typecheck placeholders passed in the mock adapter."],
    ["creating_pr", "Draft PR prepared", `Target is development from ${state.job.branchName}.`],
    ["testing_flow", "Maestro evidence captured", "Screenshots and a video recording are attached to the job."],
    ["awaiting_review", "Ready for approval", "APK generation is unlocked after evidence review."],
  ];

  sequence.forEach(([status, title, body], index) => {
    const timer = window.setTimeout(() => {
      state.job.status = status;
      if (status === "implementing") {
        state.job.commitSha = randomSha();
      }
      if (status === "testing_flow") {
        state.job.evidence = [
          { label: "Maestro test file", value: ".maestro/rsu-insight-summary.yaml", status: "Passed" },
          { label: "Screenshots", value: "01-entry.png, 02-main-change.png, 03-success.png", status: "Passed" },
          { label: "Video recording", value: "flow-recording.mp4", status: "Passed" },
        ];
      }
      addEvent(title, body);
      addRawLog(`${status} ${state.job.id} ${new Date().toISOString()}`);
      renderAll();
    }, 850 * (index + 1));
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
    addEvent("APK artifact ready", `${profile}.apk is available from the controlled artifact store.`);
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
  elements.buildResult.textContent = "Checks and Maestro evidence must pass before approval.";
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
  renderTimeline();
  renderEvents();
  renderEvidence();
  updateStatusBadges();
  updatePreviewMeta();
  updateApproval();
}

function renderEvents() {
  if (!state.job) {
    elements.events.innerHTML = `<p class="empty-state">Create a job to see readable worker events.</p>`;
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

function updateStatusBadges() {
  const status = state.job?.status ?? "ready";
  elements.jobState.textContent = toTitle(status);
  elements.evidenceState.textContent =
    state.job?.status === "awaiting_review" || state.job?.status === "building" || state.job?.status === "complete"
      ? "Passed"
      : state.job?.status === "testing_flow"
        ? "Running"
        : "Not started";
  elements.buildState.textContent =
    state.job?.status === "complete"
      ? "APK ready"
      : state.job?.status === "building"
        ? "Building"
        : state.job?.status === "awaiting_review"
          ? "Approval ready"
          : "Blocked";
}

function updatePreviewMeta() {
  elements.deviceFrame.className = `device-frame ${state.activeSize.id}`;
  elements.captureMode.textContent = `${state.activeSize.label} checkpoint`;
  elements.commitSha.textContent = state.job?.commitSha ?? "pending";
  elements.capturedAt.textContent = state.job ? new Date().toLocaleString() : "Waiting for job";
}

function updateApproval() {
  const canApprove = state.job?.status === "awaiting_review";
  elements.approveBuildBtn.disabled = !canApprove;

  if (!state.job) {
    elements.buildResult.textContent = "Checks and Maestro evidence must pass before approval.";
    return;
  }

  if (state.job.status === "awaiting_review") {
    elements.buildResult.textContent = "Evidence passed. Choose stage or prod, then approve APK generation.";
  } else if (state.job.status === "building") {
    elements.buildResult.textContent = "APK build is running from the approved branch and commit.";
  } else if (state.job.status === "complete") {
    elements.buildResult.innerHTML = `<strong>APK ready:</strong> <code>${state.job.apkUrl}</code>`;
  } else {
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
