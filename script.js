/* StudySync v2 — app logic */
(() => {
  "use strict";

  const STORAGE_KEY = "studysync-v2-data";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  // Starter examples span all four years; students should adapt them to their own syllabus.
  const starterSubjects = [
    { id: "sub-1", name: "Programming for Problem Solving", year: 1, semester: "Year 1 · Semester 1", description: "Build programming fundamentals, logical thinking and problem-solving habits.", category: "Programming" },
    { id: "sub-2", name: "Mathematics for Computing", year: 1, semester: "Year 1 · Semester 1", description: "Strengthen the mathematical foundations used in computer science.", category: "Mathematics" },
    { id: "sub-3", name: "Engineering Physics", year: 1, semester: "Year 1 · Semester 2", description: "Keep first-year science concepts and revision notes organized.", category: "Foundation" },
    { id: "sub-4", name: "Object-Oriented Programming", year: 1, semester: "Year 1 · Semester 2", description: "Practice classes, objects, inheritance, polymorphism and encapsulation.", category: "Programming" },
    { id: "sub-5", name: "Data Structures", year: 2, semester: "Year 2 · Semester 1", description: "Understand arrays, linked lists, stacks, queues, trees and graphs.", category: "Core CSE" },
    { id: "sub-6", name: "Discrete Mathematics", year: 2, semester: "Year 2 · Semester 1", description: "Practice logic, relations, counting, graphs and proof techniques.", category: "Mathematics" },
    { id: "sub-7", name: "Database Management Systems", year: 2, semester: "Year 2 · Semester 2", description: "Explore relational data, SQL, normalization and transaction concepts.", category: "Core CSE" },
    { id: "sub-8", name: "Operating Systems", year: 2, semester: "Year 2 · Semester 2", description: "Learn processes, memory management, scheduling and synchronization.", category: "Core CSE" },
    { id: "sub-9", name: "Design and Analysis of Algorithms", year: 2, semester: "Year 2 · Semester 2", description: "Practice algorithm design, complexity analysis and common strategies.", category: "Core CSE" },
    { id: "sub-10", name: "Computer Networks", year: 3, semester: "Year 3 · Semester 1", description: "Study network layers, routing, protocols and reliable communication.", category: "Core CSE" },
    { id: "sub-11", name: "Software Engineering", year: 3, semester: "Year 3 · Semester 1", description: "Plan, build, test and maintain software with structured processes.", category: "Core CSE" },
    { id: "sub-12", name: "Artificial Intelligence", year: 3, semester: "Year 3 · Semester 2", description: "Explore intelligent agents, search, reasoning and machine learning basics.", category: "AI & Data" },
    { id: "sub-13", name: "Machine Learning", year: 3, semester: "Year 3 · Semester 2", description: "Understand supervised learning, model evaluation and practical workflows.", category: "AI & Data" },
    { id: "sub-14", name: "Web Technologies", year: 3, semester: "Year 3 · Semester 2", description: "Organize frontend, backend, HTTP and web application concepts.", category: "Development" },
    { id: "sub-15", name: "Cloud Computing", year: 4, semester: "Year 4 · Semester 1", description: "Review cloud service models, deployment and scalable infrastructure.", category: "Advanced CSE" },
    { id: "sub-16", name: "Cyber Security", year: 4, semester: "Year 4 · Semester 1", description: "Study security fundamentals, threats, defenses and safe practices.", category: "Advanced CSE" },
    { id: "sub-17", name: "Compiler Design", year: 4, semester: "Year 4 · Semester 1", description: "Learn lexical analysis, parsing, semantic analysis and code generation.", category: "Core CSE" },
    { id: "sub-18", name: "Project Work & Seminar", year: 4, semester: "Year 4 · Semester 2", description: "Track project milestones, documentation, demos and presentation prep.", category: "Career & Projects" }
  ];

  const starterPyqs = [
    { id: "pyq-1", title: "DBMS practice questions", subject: "Database Management Systems", year: "Practice set", url: "", description: "Add your college's previous-paper link or upload reference here." },
    { id: "pyq-2", title: "Operating Systems revision", subject: "Operating Systems", year: "Practice set", url: "", description: "Keep unit-wise questions and revision material together." },
    { id: "pyq-3", title: "Data Structures practice", subject: "Data Structures", year: "Practice set", url: "", description: "Add a verified paper link when you have one." }
  ];
  const starterVideos = [
    { id: "vid-1", title: "Data Structures learning resource", subject: "Data Structures", url: "https://www.youtube.com/results?search_query=data+structures+course", description: "Search for lessons on arrays, linked lists, stacks and trees." },
    { id: "vid-2", title: "DBMS learning resource", subject: "Database Management Systems", url: "https://www.youtube.com/results?search_query=DBMS+full+course", description: "Find explanations of SQL, normalization and transactions." },
    { id: "vid-3", title: "Operating Systems learning resource", subject: "Operating Systems", url: "https://www.youtube.com/results?search_query=operating+systems+full+course", description: "Review processes, memory management and CPU scheduling." }
  ];

  const freshState = () => ({ tasks: [], backlogs: [], subjects: starterSubjects, pyqs: starterPyqs, videos: starterVideos, tone: "gentle", exams: [], flashcards: [], quizHistory: [], xp: 0, streak: { count: 0, lastDate: "" }, focus: { sessions: 0, minutes: 0 }, reminderTime: "19:00", reminderEnabled: false });
  
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const defaults = freshState();
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      backlogs: Array.isArray(parsed.backlogs) ? parsed.backlogs : [],
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : defaults.subjects,
      pyqs: Array.isArray(parsed.pyqs) ? parsed.pyqs : defaults.pyqs,
      videos: Array.isArray(parsed.videos) ? parsed.videos : defaults.videos,
      tone: parsed.tone === "playful" ? "playful" : "gentle",
      exams: Array.isArray(parsed.exams) ? parsed.exams : [], flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [], quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
      xp: Number.isFinite(parsed.xp) ? parsed.xp : 0, streak: parsed.streak && typeof parsed.streak === "object" ? parsed.streak : { count: 0, lastDate: "" },
      focus: parsed.focus && typeof parsed.focus === "object" ? parsed.focus : { sessions: 0, minutes: 0 }, reminderTime: typeof parsed.reminderTime === "string" ? parsed.reminderTime : "19:00", reminderEnabled: Boolean(parsed.reminderEnabled)
    };
  } catch (error) {
    console.warn("StudySync could not read saved data; using a fresh workspace.", error);
    return freshState();
  }
}
  let state = loadState();
  let toastTimer;
  let lastFocusedElement = null;
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("StudySync could not save data.", error);
      showToast("Couldn't save data in this browser. Check storage settings.");
      return false;
    }
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }
  function formatDate(iso, options = { day: "numeric", month: "short" }) {
    if (!iso) return "No date";
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? "No date" : new Intl.DateTimeFormat("en-IN", options).format(date);
  }
  function isOverdue(task) { return task.status !== "completed" && task.due && task.due < todayISO(); }
  function priorityLabel(priority) { return ({ high: "High priority", medium: "Medium priority", low: "Low priority" })[priority] || "Medium priority"; }
  function emptyState(title, copy, symbol = "✧") {
    return `<div class="empty-state"><span class="empty-state-icon">${symbol}</span><strong>${escapeHTML(title)}</strong>${escapeHTML(copy)}</div>`;
  }

  const pageTitles = {
    dashboard: ["YOUR PERSONAL STUDY SPACE", "Your study space"],
    planner: ["PLAN WITH PURPOSE", "Study planner"],
    backlogs: ["ONE STEP AT A TIME", "Backlog tracker"],
    subjects: ["YOUR LEARNING MAP", "My subjects"],
    pyqs: ["PRACTICE WITH PURPOSE", "PYQ library"],
    resources: ["LEARN AT YOUR PACE", "Video resources"],
    settings: ["MAKE IT YOURS", "Settings"], focus: ["ONE THING AT A TIME", "Focus room"], practice: ["RECALL, PRACTICE, IMPROVE", "Practice lab"], exams: ["MAKE THE DEADLINE VISIBLE", "Exam countdown"], buddy: ["ASK, UNDERSTAND, KEEP GOING", "AI study buddy"]
  };
  function goToPage(page) {
    if (!pageTitles[page]) return;
    $$("[data-page-content]").forEach(section => section.classList.toggle("active-page", section.dataset.pageContent === page));
    $$(".nav-link[data-page]").forEach(button => {
      const active = button.dataset.page === page;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    $("#pageEyebrow").textContent = pageTitles[page][0];
    $("#pageTitle").textContent = pageTitles[page][1];
    closeMobileNav();
    if (page === "planner") renderPlanner();
    if (page === "backlogs") renderBacklogs();
    if (page === "subjects") renderSubjects();
    if (page === "pyqs") renderResources("pyqs");
    if (page === "resources") renderResources("videos");
  }
  function closeMobileNav() {
    $("#sidebar").classList.remove("open");
    $("#sidebarScrim").classList.remove("open");
    $("#mobileMenu").setAttribute("aria-expanded", "false");
  }
  function openMobileNav() {
    $("#sidebar").classList.add("open");
    $("#sidebarScrim").classList.add("open");
    $("#mobileMenu").setAttribute("aria-expanded", "true");
  }

  function taskMarkup(task, compact = false) {
    const overdue = isOverdue(task);
    const priorityClass = task.priority === "high" ? "high" : task.priority === "low" ? "low" : "";
    return `<article class="task-row ${task.status === "completed" ? "is-complete" : ""}" data-task-row="${escapeHTML(task.id)}">
      <input class="task-check" type="checkbox" data-task-toggle="${escapeHTML(task.id)}" ${task.status === "completed" ? "checked" : ""} aria-label="Mark ${escapeHTML(task.title)} complete">
      <div class="task-row-main"><p class="task-row-title">${escapeHTML(task.title)}</p><div class="task-row-meta"><span>${escapeHTML(task.subject || "General study")}</span><span>·</span><span>${overdue ? "Overdue" : "Due"} ${escapeHTML(formatDate(task.due))}</span><span class="priority-pill ${overdue ? "overdue" : priorityClass}">${overdue ? "Needs attention" : escapeHTML(priorityLabel(task.priority))}</span></div></div>
      ${compact ? "" : `<div class="task-row-actions"><button class="icon-button" type="button" data-edit-task="${escapeHTML(task.id)}" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button><button class="icon-button delete" type="button" data-delete-task="${escapeHTML(task.id)}" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">×</button></div>`}
    </article>`;
  }
  function sortedTasks(tasks) {
    const mode = $("#taskSort")?.value || "date";
    return [...tasks].sort((a, b) => {
      if (mode === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1) || (a.due || "").localeCompare(b.due || "");
      }
      if (mode === "created") return (b.createdAt || 0) - (a.createdAt || 0);
      return (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31");
    });
  }
  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(task => task.status === "completed").length;
    const pending = total - completed;
    const overdue = state.tasks.filter(isOverdue).length;
    $("#totalTasks").textContent = total;
    $("#completedTasks").textContent = completed;
    $("#pendingTasks").textContent = pending;
    $("#overdueTasks").textContent = overdue;
    $("#pendingCount").textContent = pending;
    const percent = total ? Math.round(completed / total * 100) : 0;
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressBar").style.width = `${percent}%`;
  }
  function renderDashboardTasks() {
    const tasks = sortedTasks(state.tasks.filter(task => task.status !== "completed")).slice(0, 4);
    $("#dashboardTaskList").innerHTML = tasks.length ? tasks.map(task => taskMarkup(task, true)).join("") : emptyState("Your space is clear", "Add a small study task and your next steps will show up here.", "✦");
  }
  function renderPlanner() {
    const query = ($("#taskSearch")?.value || "").trim().toLowerCase();
    const filter = $("#taskFilter")?.value || "all";
    let tasks = state.tasks.filter(task => `${task.title} ${task.subject || ""}`.toLowerCase().includes(query));
    if (filter === "pending") tasks = tasks.filter(task => task.status !== "completed" && !isOverdue(task));
    if (filter === "completed") tasks = tasks.filter(task => task.status === "completed");
    if (filter === "overdue") tasks = tasks.filter(isOverdue);
    tasks = sortedTasks(tasks);
    $("#plannerTaskList").innerHTML = tasks.length ? tasks.map(task => taskMarkup(task)).join("") : emptyState("Nothing on this list yet", query || filter !== "all" ? "Try a different search or filter." : "Add your first task. Small steps count.", "＋");
  }
  function renderAllTasks() { renderStats(); renderDashboardTasks(); renderPlanner(); }
  function openTaskModal(task = null) {
    lastFocusedElement = document.activeElement;
    $("#taskForm").reset();
    $("#taskId").value = task?.id || "";
    $("#modalTitle").textContent = task ? "Edit your study task" : "Add a study task";
    $("#modalEyebrow").textContent = task ? "UPDATE YOUR PLAN" : "MAKE A PLAN";
    $("#saveTaskButton").innerHTML = task ? "Save changes <span>↗</span>" : "Save task <span>↗</span>";
    $("#taskTitle").value = task?.title || "";
    $("#taskSubject").value = task?.subject || "";
    $("#taskDue").value = task?.due || todayISO();
    $("#taskPriority").value = task?.priority || "medium";
    $("#taskStatus").value = task?.status || "pending";
    $("#modalBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    $("#taskTitle").focus();
  }
  function closeTaskModal() {
    $("#modalBackdrop").hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedElement?.isConnected) lastFocusedElement.focus();
  }
  function submitTask(event) {
    event.preventDefault();
    const id = $("#taskId").value;
    const title = $("#taskTitle").value.trim();
    const due = $("#taskDue").value;
    if (!title || !due) { showToast("Add a task title and due date first."); return; }
    const oldTask = state.tasks.find(task => task.id === id);
    const task = {
      id: id || makeId(), title, subject: $("#taskSubject").value.trim(),
      due, priority: $("#taskPriority").value, status: $("#taskStatus").value,
      createdAt: oldTask?.createdAt || Date.now()
    };
    if (oldTask) state.tasks = state.tasks.map(item => item.id === id ? task : item);
    else state.tasks.unshift(task);
    saveState(); closeTaskModal(); renderAllTasks();
    showToast(oldTask ? "Your task has been updated ✨" : "A new step added to your plan ✨");
  }
  function toggleTask(id, checked) {
    const task = state.tasks.find(item => item.id === id);
    if (!task) return;
    task.status = checked ? "completed" : "pending";
    saveState(); renderAllTasks();
    if (checked) awardXP(5, "task completed");
    showToast(checked ? "Look at you go! One step done 💙" : "Task moved back to your plan.");
  }
  function deleteTask(id) {
    const task = state.tasks.find(item => item.id === id);
    if (!task || !window.confirm(`Delete "${task.title}"?`)) return;
    state.tasks = state.tasks.filter(item => item.id !== id);
    saveState(); renderAllTasks(); showToast("Task deleted.");
  }

  function renderBacklogs() {
    const host = $("#backlogGrid");
    if (!state.backlogs.length) {
      host.innerHTML = emptyState("A fresh page", "No backlog subjects added. If you have one to track, add it here—without judgment.", "✦");
      return;
    }
    host.innerHTML = state.backlogs.map(item => `<article class="backlog-card"><div class="backlog-card-top"><span class="card-kicker">${escapeHTML(item.semester || "Semester not set")}</span><span class="backlog-status ${item.status === "cleared" ? "cleared" : ""}">${item.status === "cleared" ? "Cleared ✓" : "In progress"}</span></div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.note || "One topic at a time. Keep going.")}</p><div class="card-actions"><select data-backlog-status="${escapeHTML(item.id)}" aria-label="Status for ${escapeHTML(item.name)}"><option value="pending" ${item.status === "pending" ? "selected" : ""}>Pending</option><option value="in-progress" ${item.status === "in-progress" ? "selected" : ""}>In progress</option><option value="cleared" ${item.status === "cleared" ? "selected" : ""}>Cleared</option></select><button class="icon-button delete" data-delete-backlog="${escapeHTML(item.id)}" type="button" aria-label="Delete ${escapeHTML(item.name)}">×</button></div></article>`).join("");
  }
  function addBacklog() {
    const name = window.prompt("Which subject do you want to track?");
    if (name === null) return;
    if (!name.trim()) { showToast("Enter a subject name to add it."); return; }
    const semester = window.prompt("Semester or year (optional):", "") ?? "";
    const note = window.prompt("A small next step (optional):", "") ?? "";
    state.backlogs.unshift({ id: makeId(), name: name.trim(), semester: semester.trim(), note: note.trim(), status: "pending" });
    saveState(); renderBacklogs(); showToast("Subject added. One step at a time 💙");
  }

  function renderSubjects() {
    const query = ($("#subjectSearch")?.value || "").trim().toLowerCase();
    const year = $("#subjectYearFilter")?.value || "all";
    const items = state.subjects.filter(item => `${item.name} ${item.category || ""} ${item.semester || ""}`.toLowerCase().includes(query) && (year === "all" || String(item.year) === year));
    $("#subjectGrid").innerHTML = items.length ? items.map(item => `<article class="subject-card"><div class="subject-card-top"><span class="subject-year">${escapeHTML(item.year)}${item.year === 1 ? "ST" : item.year === 2 ? "ND" : item.year === 3 ? "RD" : "TH"} YEAR</span><span class="subject-icon">▤</span></div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description || item.category || "Your personal subject space.")}</p><p class="subject-semester">${escapeHTML(item.semester || "Semester not set")}</p><div class="card-actions"><span class="card-kicker">${escapeHTML(item.category || "MY SUBJECT")}</span><button class="icon-button delete" data-delete-subject="${escapeHTML(item.id)}" type="button" aria-label="Remove ${escapeHTML(item.name)}" title="Remove subject">×</button></div></article>`).join("") : emptyState("No matching subjects", "Try another search or add a subject of your own.", "▤");
  }
  function addSubject() {
    const name = window.prompt("Subject name:");
    if (name === null) return;
    if (!name.trim()) { showToast("Enter a subject name."); return; }
    const year = window.prompt("Academic year (1, 2, 3 or 4):", "3");
    if (year === null) return;
    if (!["1", "2", "3", "4"].includes(year.trim())) { showToast("Please choose a year from 1 to 4."); return; }
    const semester = window.prompt("Semester (optional):", `Year ${year} · Semester 1`) ?? "";
    const description = window.prompt("Short description (optional):", "") ?? "";
    state.subjects.unshift({ id: makeId(), name: name.trim(), year: Number(year), semester: semester.trim(), description: description.trim(), category: "My subject" });
    saveState(); renderSubjects(); showToast("Subject added to your learning map.");
  }

  function renderResources(kind) {
    const isPyq = kind === "pyqs";
    const key = isPyq ? "pyqs" : "videos";
    const query = $(`#${isPyq ? "pyqSearch" : "videoSearch"}`)?.value.trim().toLowerCase() || "";
    const items = state[key].filter(item => `${item.title} ${item.subject || ""} ${item.description || ""}`.toLowerCase().includes(query));
    const host = $(`#${isPyq ? "pyqGrid" : "videoGrid"}`);
    host.innerHTML = items.length ? items.map(item => {
      const url = safeUrl(item.url || "");
      const label = isPyq ? "PAPER RESOURCE" : "VIDEO RESOURCE";
      const icon = isPyq ? "▧" : "▷";
      return `<article class="resource-card"><div class="resource-card-top"><span class="resource-icon">${icon}</span><span class="resource-type">${label}</span></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.subject || "General")}${item.year ? ` · ${escapeHTML(item.year)}` : ""}</p><p>${escapeHTML(item.description || "")}</p><div class="resource-card-actions">${url ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>` : `<span class="resource-type">LINK NOT ADDED</span>`}<button type="button" data-delete-resource="${escapeHTML(item.id)}" data-resource-kind="${key}" aria-label="Remove ${escapeHTML(item.title)}">Remove</button></div></article>`;
    }).join("") : emptyState("Your library is ready", query ? "No resources match this search." : "Add a verified link or a resource you want to revisit.", isPyq ? "▧" : "▷");
  }
  function addResource(kind) {
    const isPyq = kind === "pyqs";
    const key = isPyq ? "pyqs" : "videos";
    const title = window.prompt(isPyq ? "Paper or resource title:" : "Video title:");
    if (title === null) return;
    if (!title.trim()) { showToast("A title is needed to save a resource."); return; }
    const subject = window.prompt("Subject or topic:", "") ?? "";
    const urlInput = window.prompt("Link URL (optional; must start with http:// or https://):", "") ?? "";
    const url = urlInput.trim() ? safeUrl(urlInput.trim()) : "";
    if (urlInput.trim() && !url) { showToast("That link doesn't look valid. Use an http:// or https:// URL."); return; }
    const description = window.prompt("Short note (optional):", "") ?? "";
    state[key].unshift({ id: makeId(), title: title.trim(), subject: subject.trim(), url, description: description.trim(), ...(isPyq ? { year: "Personal resource" } : {}) });
    saveState(); renderResources(key); showToast("Resource saved to your library.");
  }

  // Smart Study Plan Generator: creates a 7-day plan without changing saved data until added.
  let generatedStudyPlan = [];

  function parsePlanSubjects(raw) {
    const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const subjects = [];
    for (let index = 0; index < lines.length; index += 1) {
      const parts = lines[index].split("|").map(part => part.trim());
      const name = parts[0] || "";
      const topics = (parts[1] || "").split(",").map(topic => topic.trim()).filter(Boolean);
      const examDate = parts[2] || "";
      if (!name || !topics.length) {
        throw new Error(`Line ${index + 1}: enter a subject and at least one topic, separated with |.`);
      }
      if (examDate && !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
        throw new Error(`Line ${index + 1}: use YYYY-MM-DD for the exam date, or leave it blank.`);
      }
      if (examDate) {
        const parsedDate = new Date(`${examDate}T12:00:00`);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== examDate) {
          throw new Error(`Line ${index + 1}: that exam date is not valid.`);
        }
        if (examDate < todayISO()) throw new Error(`Line ${index + 1}: the exam date is in the past. Update it or leave it blank.`);
      }
      subjects.push({ name, topics, examDate, topicIndex: 0 });
    }
    if (!subjects.length) throw new Error("Add at least one subject with topics to build your plan.");
    return subjects;
  }

 async function buildSmartPlan(event) {
    event.preventDefault();
    const results = $("#smartPlanResults");
    try {
      const subjects = parsePlanSubjects($("#planSubjects").value);
      const mode = $("#planMode").value;
      const hours = Number($("#planHours").value);
      const sessionMinutes = Number($("#planSessionMinutes").value);
      const breakMinutes = Number($("#planBreakMinutes").value);
      if (!Number.isFinite(hours) || hours < 1 || hours > 16) throw new Error("Choose between 1 and 16 study hours per day.");

      const sessionsPerDay = Math.max(1, Math.floor(hours * 60 / sessionMinutes));
      const dailyStudyMinutes = sessionsPerDay * sessionMinutes;
      const today = new Date(`${todayISO()}T12:00:00`);
      const horizon = Array.from({ length: 7 }, (_, dayOffset) => {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        return date.toISOString().slice(0, 10);
      });
      const backlogNames = state.backlogs.filter(item => item.status !== "cleared").map(item => item.name.toLowerCase());
      const pendingSubjects = state.tasks.filter(task => task.status !== "completed").map(task => (task.subject || "").toLowerCase());
      const response = await fetch("/api/study-plan", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    subjects: subjects.map(subject => subject.name)
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || "Failed to generate study plan.");
}

console.log("Flask backend response:", data);

const plan = [];

      for (const date of horizon) {
        const daySessions = [];
        for (let slot = 0; slot < sessionsPerDay; slot += 1) {
          const eligible = subjects.filter(subject => !subject.examDate || subject.examDate >= date);
          const pool = eligible.length ? eligible : subjects;
          const ranked = [...pool].sort((a, b) => {
            const daysToExam = subject => subject.examDate ? Math.max(0, Math.round((new Date(`${subject.examDate}T12:00:00`) - new Date(`${date}T12:00:00`)) / 86400000)) : 999;
            const backlogScore = subject => backlogNames.some(name => name.includes(subject.name.toLowerCase()) || subject.name.toLowerCase().includes(name)) || pendingSubjects.includes(subject.name.toLowerCase()) ? 1 : 0;
            if (mode === "exam") return daysToExam(a) - daysToExam(b) || a.topicIndex - b.topicIndex;
            if (mode === "backlog") return backlogScore(b) - backlogScore(a) || a.topicIndex - b.topicIndex;
            return a.topicIndex - b.topicIndex;
          });
          const chosen = ranked[slot % ranked.length];
          const topic = chosen.topics[chosen.topicIndex % chosen.topics.length];
          chosen.topicIndex += 1;
          daySessions.push({ subject: chosen.name, topic, minutes: sessionMinutes, breakAfter: slot < sessionsPerDay - 1 ? breakMinutes : 0, due: date });
        }
        plan.push({ date, sessions: daySessions });
      }
      generatedStudyPlan = plan;
      const totalSessions = plan.reduce((sum, day) => sum + day.sessions.length, 0);
      const totalHours = (totalSessions * sessionMinutes / 60).toFixed(1).replace(/\.0$/, "");
      const modeLabel = ({ balanced: "Balanced", exam: "Exam-focused", backlog: "Backlog-focused" })[mode] || "Balanced";
      results.innerHTML = `<div class="smart-plan-summary"><span>${escapeHTML(modeLabel)} mode</span><span>${totalSessions} sessions</span><span>${totalHours} study hours over 7 days</span><span>${breakMinutes}-minute breaks</span></div>` + plan.map(day => `<article class="smart-plan-day"><h3>${escapeHTML(new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short" }).format(new Date(`${day.date}T12:00:00`)))}</h3>${day.sessions.map((session, index) => `<div class="smart-plan-session"><span class="smart-plan-session-number">${index + 1}</span><div><strong>${escapeHTML(session.topic)}</strong><small>${escapeHTML(session.subject)} · ${session.minutes} minutes${session.breakAfter ? ` · then ${session.breakAfter}-minute break` : ""}</small></div></div>`).join("")}</article>`).join("") + `<div class="smart-plan-actions"><button class="primary-button" id="addGeneratedPlanButton" type="button">Add all sessions to my planner ↗</button><button class="button button-quiet" id="regeneratePlanButton" type="button">Generate again</button></div><p class="smart-plan-hint">This is a suggested 7-day plan. Review it before adding; it won't change your saved tasks until you choose the add button.</p>`;
      showToast("Your 7-day study plan is ready ✨");
    } catch (error) {
      generatedStudyPlan = [];
      results.innerHTML = `<p role="alert" class="smart-plan-error">${escapeHTML(error.message || "Couldn't generate a plan. Check your entries and try again.")}</p>`;
    }
  }

  function addGeneratedPlanToTasks() {
    if (!generatedStudyPlan.length) return;
    const newTasks = generatedStudyPlan.flatMap(day => day.sessions.map(session => ({
      id: makeId(),
      title: `${session.topic} (${session.minutes} min)`,
      subject: session.subject,
      due: session.due,
      priority: $("#planMode").value === "exam" ? "high" : $("#planMode").value === "backlog" ? "medium" : "medium",
      status: "pending",
      createdAt: Date.now()
    })));
    state.tasks = [...newTasks, ...state.tasks];
    const saved = saveState();
    if (!saved) {
      state.tasks = state.tasks.filter(task => !newTasks.some(created => created.id === task.id));
      return;
    }
    renderAllTasks();
    showToast(`${newTasks.length} study sessions added to your planner 💙`);
    const addButton = $("#addGeneratedPlanButton");
    if (addButton) { addButton.disabled = true; addButton.textContent = "Sessions added ✓"; }
  }

  // StudySync add-on features: local-first tools; no API key is needed for the built-in helpers.
  let timerInterval = null, timerSeconds = 25 * 60, timerRemaining = 25 * 60, timerRunning = false, timerStartedAt = 0;
  function awardXP(amount, reason) { state.xp = (state.xp || 0) + amount; updateStudyStreak(); saveState(); renderRewards(); if (reason) showToast(`+${amount} XP · ${reason}`); }
  function updateStudyStreak() {
    const today = todayISO(), yesterday = new Date(Date.now() - 86400000); const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
    if (state.streak.lastDate === today) return;
    state.streak.count = state.streak.lastDate === y ? (state.streak.count || 0) + 1 : 1; state.streak.lastDate = today;
  }
  function renderRewards() {
    const xp = state.xp || 0, streak = state.streak?.count || 0;
    if ($('#xpTotal')) $('#xpTotal').textContent = `${xp} XP`;
    if ($('#streakTotal')) $('#streakTotal').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    const badges = []; if (xp >= 10) badges.push('🌱 First steps'); if (xp >= 50) badges.push('🔥 Getting consistent'); if (xp >= 150) badges.push('🏆 Study champion'); if ((state.focus?.sessions || 0) >= 5) badges.push('⏱️ Focus five'); if (streak >= 3) badges.push('📆 3-day streak'); if ($('#badgeTotal')) $('#badgeTotal').textContent = badges.length;
    if ($('#badgeShelf')) $('#badgeShelf').innerHTML = badges.length ? badges.map(b => `<span class="achievement-badge">${escapeHTML(b)}</span>`).join('') : '<span class="feature-note">Your first badge is waiting. Complete a task or focus session to earn XP.</span>';
    if ($('#focusSessionsCount')) $('#focusSessionsCount').textContent = state.focus?.sessions || 0;
    if ($('#focusMinutesCount')) $('#focusMinutesCount').textContent = state.focus?.minutes || 0;
  }
  function fmtTimer(seconds) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
  function renderTimer() { if ($('#focusTimerDisplay')) $('#focusTimerDisplay').textContent = fmtTimer(timerRemaining); }
  function stopTimer() { clearInterval(timerInterval); timerInterval = null; timerRunning = false; }
  function startTimer() {
    if (timerRunning) return; timerRunning = true; timerStartedAt = Date.now(); $('#focusTimerStatus').textContent = `Focusing on: ${$('#focusTaskLabel').value.trim() || 'your chosen task'}. You can do this.`;
    timerInterval = setInterval(() => { timerRemaining = Math.max(0, timerRemaining - 1); renderTimer(); if (timerRemaining <= 0) {
      stopTimer(); const mins = Math.max(1, Math.round(timerSeconds/60)); state.focus.sessions = (state.focus.sessions || 0) + 1; state.focus.minutes = (state.focus.minutes || 0) + mins; awardXP(10, 'focus session complete'); saveState(); renderRewards(); $('#focusTimerStatus').textContent = 'Session complete! Stretch, drink water, or take a short break.'; notifyUser('StudySync focus session complete', 'Nice work! Your focus session is finished. Take a short break.');
    } }, 1000);
  }
  function setTimerMinutes(minutes) { stopTimer(); timerSeconds = minutes*60; timerRemaining = timerSeconds; renderTimer(); if ($('#focusTimerStatus')) $('#focusTimerStatus').textContent = `${minutes}-minute timer ready.`; }
  function renderExams() {
    const host = $('#examList'); if (!host) return; const exams = [...(state.exams || [])].sort((a,b) => a.date.localeCompare(b.date));
    host.innerHTML = exams.length ? exams.map(exam => { const days = Math.ceil((new Date(`${exam.date}T00:00:00`) - new Date(`${todayISO()}T00:00:00`))/86400000); return `<div class="exam-item"><div><strong>${escapeHTML(exam.name)}</strong><small>${formatDate(exam.date,{day:'numeric',month:'short',year:'numeric'})} · ${days < 0 ? `${Math.abs(days)} day(s) ago` : days === 0 ? 'Today' : `${days} day(s) left`}</small></div><button type="button" data-delete-exam="${escapeHTML(exam.id)}" aria-label="Delete exam">Remove</button></div>`; }).join('') : emptyState('No exams added yet','Add an exam date to see your countdown.','⌛');
  }
  function renderWeakTopics() {
    const host = $('#weakTopicsOutput'); if (!host) return; const stats = {};
    (state.quizHistory || []).forEach(row => { const key = row.topic || 'General revision'; stats[key] ||= {correct:0,total:0}; stats[key].correct += row.correct ? 1 : 0; stats[key].total += 1; });
    const weak = Object.entries(stats).filter(([,v])=>v.total>=1).sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total)).slice(0,5);
    host.innerHTML = weak.length ? `<ul>${weak.map(([topic,v])=>`<li><strong>${escapeHTML(topic)}</strong> — ${Math.round(v.correct/v.total*100)}% correct across ${v.total} attempt(s). ${v.correct/v.total < .7 ? 'Prioritize another revision round.' : 'Keep practicing to retain it.'}</li>`).join('')}</ul>` : 'Complete a quiz to start tracking topics that need revision.';
  }
  function generatePaper() {
    const subject = $('#paperSubject').value.trim(), raw = $('#paperTopics').value.trim(); if (!subject || !raw) { showToast('Add a subject and at least one topic first.'); return; }
    const topics = raw.split(/[\n,]+/).map(t=>t.trim()).filter(Boolean), count = Number($('#paperQuestionCount').value), marks = Number($('#paperMarks').value);
    const stems = marks <= 2 ? ['Define','List two points about','What is meant by','State one use of','Differentiate briefly between'] : marks <= 5 ? ['Explain','Describe with an example','Compare and contrast','Write short notes on','Discuss the importance of'] : ['Explain in detail with a suitable example','Discuss the architecture, process, and applications of','Analyze the advantages and limitations of','Describe the complete working of','Evaluate the role and significance of'];
    const qs = Array.from({length:count},(_,i)=>`${i+1}. ${stems[i%stems.length]} ${topics[i%topics.length]}. [${marks} marks]`);
    $('#paperOutput').innerHTML = `<h3>${escapeHTML(subject)} — Practice Paper</h3><p>${count} questions · ${count*marks} marks · Suggested practice only</p><ol>${qs.map(q=>`<li>${escapeHTML(q.replace(/^\d+\. /,''))}</li>`).join('')}</ol><button class="button button-quiet" id="copyPaperButton" type="button">Copy paper text</button>`;
    $('#copyPaperButton').onclick = async () => { const text = `${subject} — Practice Paper\n${count} questions · ${count*marks} marks\n\n${qs.join('\n')}`; try { await navigator.clipboard.writeText(text); showToast('Practice paper copied.'); } catch { showToast('Clipboard unavailable; select and copy the paper text.'); } };
  }
  let currentDeckIndex = 0;
  function createDeck() {
    const lines = $('#flashcardInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean), deck=[];
    for (const line of lines) { const ix=line.indexOf('|'); if(ix<1 || !line.slice(ix+1).trim()) continue; deck.push({id:makeId(), question:line.slice(0,ix).trim(), answer:line.slice(ix+1).trim(), topic:line.slice(0,ix).trim()}); }
    if (!deck.length) { showToast('Add at least one Question | Answer line.'); return; }
    state.flashcards = deck; currentDeckIndex=0; saveState(); renderDeck(); awardXP(2,'revision deck created');
  }
  function renderDeck() {
    const host=$('#flashcardOutput'); if(!host) return; const deck=state.flashcards||[]; if(!deck.length){host.textContent='Your deck will appear here.';return;}
    const card=deck[currentDeckIndex%deck.length]; host.innerHTML=`<div class="flashcard" id="activeFlashcard"><span class="card-kicker">CARD ${currentDeckIndex+1} OF ${deck.length}</span><h3>${escapeHTML(card.question)}</h3><div class="flashcard-answer"><strong>Answer:</strong> ${escapeHTML(card.answer)}</div><button class="button button-quiet" id="revealFlashcardButton" type="button">Reveal answer</button><div class="feature-actions"><button class="button button-quiet" id="prevFlashcardButton" type="button">← Previous</button><button class="button button-primary" id="nextFlashcardButton" type="button">Next →</button></div></div><hr><h3>Quiz yourself</h3><p>Read the question, answer before revealing, then record whether you got it right.</p><div class="feature-actions"><button class="button button-primary" id="quizCorrectButton" type="button">I got it right ✓</button><button class="button button-quiet" id="quizWrongButton" type="button">Need more practice</button></div>`;
    $('#revealFlashcardButton').onclick=()=>$('#activeFlashcard').classList.toggle('revealed');
    $('#prevFlashcardButton').onclick=()=>{currentDeckIndex=(currentDeckIndex+deck.length-1)%deck.length;renderDeck();}; $('#nextFlashcardButton').onclick=()=>{currentDeckIndex=(currentDeckIndex+1)%deck.length;renderDeck();};
    const record=correct=>{state.quizHistory.push({topic:card.topic,correct,date:todayISO()}); if(correct) awardXP(3,'quiz answer correct'); else {saveState();showToast('Added to revision list. You can learn this.');} renderWeakTopics();};
    $('#quizCorrectButton').onclick=()=>record(true); $('#quizWrongButton').onclick=()=>record(false);
  }
  function buddyReply() {
    const q=$('#buddyQuestion').value.trim(); if(!q){showToast('Tell your study buddy what you need help with.');return;}
    const lower=q.toLowerCase(); let reply;
    if(lower.includes('plan')||lower.includes('revision')||lower.includes('emergency')) reply='Quick plan:\n1. Spend 3 minutes listing the exact topics.\n2. Study the hardest topic for 20 minutes.\n3. Close your notes and recall the main points for 5 minutes.\n4. Solve 2 questions without looking.\n5. Mark anything unclear for your next session.\n\nTell me your subject and exam date to make this more specific.';
    else if(lower.includes('quiz')||lower.includes('question')) reply='Active-recall challenge:\n1. Define the concept in one sentence.\n2. Give one real example.\n3. Explain why it matters.\n4. Compare it with a related concept.\n5. Solve one application question.\n\nFor a topic-specific quiz, open Practice Lab and enter your own syllabus questions/answers.';
    else if(lower.includes('bfs')||lower.includes('dfs')) reply='BFS explores a graph level by level using a queue. DFS follows one path as far as it can, then backtracks, commonly using recursion or a stack. BFS is useful for shortest paths in unweighted graphs; DFS is useful for traversal, cycle checks, and backtracking.';
    else if(lower.includes('deadlock')) reply='Think of four cars stuck at a crossroads: each holds space and waits for another to move. In operating systems, deadlock happens when processes wait forever for resources held by one another. The four classic conditions are mutual exclusion, hold-and-wait, no preemption, and circular wait.';
    else if(lower.includes('normalization')||lower.includes('dbms')) reply='Database normalization organizes tables to reduce duplicate data and update anomalies. 1NF: atomic values; 2NF: no partial dependency on part of a candidate key; 3NF: remove transitive dependency of non-key attributes. Use examples and functional dependencies to practice.';
    else if(lower.includes('process')||lower.includes('operating system')||lower.includes('os')) reply='A process is a program in execution, with its own state and resources. The OS tracks it using a Process Control Block (PCB), which stores information such as process state, program counter, registers, and scheduling details.';
    else reply='Let’s break it down. First, write the concept in one simple sentence. Next, list 3 key terms. Then explain it using a real-life example, and finally try one question without notes. I’m running in offline helper mode, so for exact topic explanations tell me the subject and concept or connect a generative AI API/backend later.';
    $('#buddyOutput').innerHTML=`<p>${escapeHTML(reply).replace(/\n/g,'<br>')}</p><p class="feature-note">Offline study helper · Review answers against your class notes or textbook.</p>`;
  }
  function notifyUser(title, body) { if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title,{body}); } catch(e) { console.warn('Notification unavailable',e); } } }
  async function enableNotifications() { if(!('Notification' in window)){showToast('This browser does not support notifications.');return;} try { const permission=await Notification.requestPermission(); showToast(permission==='granted'?'Browser notifications enabled.':'Notification permission was not granted.'); if(permission==='granted') notifyUser('StudySync is ready','Your study reminders can appear while supported by your browser.'); } catch { showToast('Could not request notification permission in this browser.'); } }
  function checkReminder() { if(!state.reminderEnabled) return; const now=new Date(), hm=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; if(hm===state.reminderTime && state._lastReminderDate!==todayISO()){state._lastReminderDate=todayISO();saveState();const msg=state.tone==='playful'?'Rey student garu 😭 syllabus ni choodu, reels ni kaadu. 20 mins start cheyyi!':'A gentle nudge: take 20 minutes for one small study goal.';notifyUser('StudySync study reminder',msg);showToast(msg);} }
  function generateEmergencyPlan() { const examId=$('#emergencyPlanButton').dataset.examId; const exam=state.exams.find(x=>x.id===examId)||[...(state.exams||[])].sort((a,b)=>a.date.localeCompare(b.date)).find(x=>x.date>=todayISO()); if(!exam){showToast('Add an upcoming exam first.');return;} const days=Math.max(0,Math.ceil((new Date(`${exam.date}T00:00:00`)-new Date(`${todayISO()}T00:00:00`))/86400000)); const tasks=state.tasks.filter(t=>(t.subject||'').toLowerCase().includes(exam.name.toLowerCase())||exam.name.toLowerCase().includes((t.subject||'').toLowerCase())).filter(t=>t.status!=='completed'); const steps=days<=1?['Review summary notes and key formulas','Attempt a short timed practice set','Review mistakes only; avoid starting too many new topics','Prepare materials and protect sleep']:days<=3?['List the high-priority units and learning outcomes','Revise core concepts and definitions','Practice previous questions under time limits','Review weak answers and make a one-page summary']:['Divide syllabus into daily topic blocks','Study the highest-weight topics first','Practice questions after each topic','Schedule spaced revision and one timed paper']; $('#emergencyOutput').innerHTML=`<h3>${escapeHTML(exam.name)} · ${days===0?'today':`${days} day(s) left`}</h3><ol>${steps.map(s=>`<li>${escapeHTML(s)}</li>`).join('')}</ol>${tasks.length?`<p>Pending related planner tasks: ${tasks.length}</p><ul>${tasks.slice(0,5).map(t=>`<li>${escapeHTML(t.title)}</li>`).join('')}</ul>`:''}<button class="button button-primary" id="addEmergencyTasksButton" type="button">Add revision steps to planner</button>`; $('#addEmergencyTasksButton').onclick=()=>{steps.forEach((title,i)=>state.tasks.unshift({id:makeId(),title:`${exam.name}: ${title}`,subject:exam.name,due:todayISO(),priority:i<2?'high':'medium',status:'pending',createdAt:Date.now()}));saveState();renderAllTasks();showToast('Emergency revision steps added to your planner.');}; }
  function renderFeaturePages() { renderRewards(); renderExams(); renderWeakTopics(); renderTimer(); if($('#reminderTime')) $('#reminderTime').value=state.reminderTime||'19:00'; }

  function setGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    $("#pageTitle").innerHTML = `${greeting}<span class="title-period">.</span>`;
    $("#currentDate").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
    const gentle = "You don't have to do everything today. Just the next right thing.";
    const playful = "One task at a time ra. Your syllabus isn't going to finish itself. 😭";
    $("#gentleQuote").textContent = state.tone === "playful" ? playful : gentle;
  }

  function handleDelegatedClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.page) { goToPage(target.dataset.page); return; }
    if (target.dataset.pageLink) { goToPage(target.dataset.pageLink); return; }
    if (target.hasAttribute("data-open-task")) { openTaskModal(); return; }
    if (target.dataset.editTask) { const task = state.tasks.find(item => item.id === target.dataset.editTask); if (task) openTaskModal(task); return; }
    if (target.dataset.deleteTask) { deleteTask(target.dataset.deleteTask); return; }
    if (target.dataset.deleteBacklog) {
      const item = state.backlogs.find(entry => entry.id === target.dataset.deleteBacklog);
      if (item && window.confirm(`Remove "${item.name}" from your tracker?`)) { state.backlogs = state.backlogs.filter(entry => entry.id !== item.id); saveState(); renderBacklogs(); showToast("Backlog subject removed."); }
      return;
    }
    if (target.dataset.deleteSubject) {
      const item = state.subjects.find(entry => entry.id === target.dataset.deleteSubject);
      if (item && window.confirm(`Remove "${item.name}" from your subject library?`)) { state.subjects = state.subjects.filter(entry => entry.id !== item.id); saveState(); renderSubjects(); showToast("Subject removed."); }
      return;
    }
    if (target.dataset.deleteExam) { state.exams = state.exams.filter(item => item.id !== target.dataset.deleteExam); saveState(); renderExams(); showToast("Exam removed."); return; }
    if (target.dataset.deleteResource) {
      const key = target.dataset.resourceKind;
      const item = state[key]?.find(entry => entry.id === target.dataset.deleteResource);
      if (item && window.confirm(`Remove "${item.title}"?`)) { state[key] = state[key].filter(entry => entry.id !== item.id); saveState(); renderResources(key); showToast("Resource removed."); }
    }
  }

  function handleDelegatedChange(event) {
    const target = event.target;
    if (target.matches("[data-task-toggle]")) toggleTask(target.dataset.taskToggle, target.checked);
    if (target.matches("[data-backlog-status]")) {
      const item = state.backlogs.find(entry => entry.id === target.dataset.backlogStatus);
      if (item) { item.status = target.value; saveState(); renderBacklogs(); showToast("Backlog status updated."); }
    }
  }

  $("#smartPlanForm").addEventListener("submit", buildSmartPlan);
  $("#smartPlanResults").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.id === "addGeneratedPlanButton") addGeneratedPlanToTasks();
    if (button.id === "regeneratePlanButton") $("#smartPlanForm").requestSubmit();
  });

  document.addEventListener("click", handleDelegatedClick);
  document.addEventListener("change", handleDelegatedChange);
  $("#taskForm").addEventListener("submit", submitTask);
  $("#modalClose").addEventListener("click", closeTaskModal);
  $("#cancelModal").addEventListener("click", closeTaskModal);
  $("#modalBackdrop").addEventListener("click", event => { if (event.target === $("#modalBackdrop")) closeTaskModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("#modalBackdrop").hidden) closeTaskModal();
      closeMobileNav();
    }
  });
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.contains("open") ? closeMobileNav() : openMobileNav());
  $("#sidebarScrim").addEventListener("click", closeMobileNav);
  $("#taskSearch").addEventListener("input", renderPlanner);
  $("#taskFilter").addEventListener("change", renderPlanner);
  $("#taskSort").addEventListener("change", renderPlanner);
  $("#subjectSearch").addEventListener("input", renderSubjects);
  $("#subjectYearFilter").addEventListener("change", renderSubjects);
  $("#pyqSearch").addEventListener("input", () => renderResources("pyqs"));
  $("#videoSearch").addEventListener("input", () => renderResources("videos"));
  $("#addBacklogButton").addEventListener("click", addBacklog);
  $("#addSubjectButton").addEventListener("click", addSubject);
  $("#addPyqButton").addEventListener("click", () => addResource("pyqs"));
  $("#addVideoButton").addEventListener("click", () => addResource("videos"));
  $("#toneSelect").value = state.tone;
  $("#toneSelect").addEventListener("change", event => {
    state.tone = event.target.value === "playful" ? "playful" : "gentle";
    saveState(); setGreeting(); showToast("Your study buddy's tone has been updated.");
  });
  $("#clearDataButton").addEventListener("click", () => {
    if (!window.confirm("Clear all StudySync data saved in this browser? This cannot be undone.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { console.error(error); }
    state = freshState(); saveState(); $("#taskSearch").value = ""; $("#taskFilter").value = "all"; $("#taskSort").value = "date";
    renderAllTasks(); renderBacklogs(); renderSubjects(); renderResources("pyqs"); renderResources("videos"); renderFeaturePages(); setGreeting();
    showToast("Your workspace has been reset.");
  });

  // Feature listeners
  $$('[data-timer-minutes]').forEach(button => button.addEventListener('click', () => setTimerMinutes(Number(button.dataset.timerMinutes))));
  $('#focusStartButton').addEventListener('click', startTimer);
  $('#focusPauseButton').addEventListener('click', () => { stopTimer(); $('#focusTimerStatus').textContent='Timer paused. Resume whenever you are ready.'; });
  $('#focusResetButton').addEventListener('click', () => { stopTimer(); timerRemaining=timerSeconds; renderTimer(); $('#focusTimerStatus').textContent='Timer reset.'; });
  $('#generatePaperButton').addEventListener('click', generatePaper);
  $('#loadFlashcardsButton').addEventListener('click', createDeck);
  $('#askBuddyButton').addEventListener('click', buddyReply);
  $$('[data-buddy-prompt]').forEach(button=>button.addEventListener('click',()=>{$('#buddyQuestion').value=button.dataset.buddyPrompt;buddyReply();}));
  $('#addExamButton').addEventListener('click',()=>{const name=$('#examName').value.trim(),date=$('#examDate').value;if(!name||!date){showToast('Enter an exam name and date.');return;}if(date<todayISO()){showToast('Choose today or a future date.');return;}state.exams.unshift({id:makeId(),name,date});saveState();$('#examName').value='';$('#examDate').value='';renderExams();showToast('Exam countdown added.');});
  $('#emergencyPlanButton').addEventListener('click',generateEmergencyPlan);
  $('#enableNotificationsButton').addEventListener('click',enableNotifications);
  $('#testReminderButton').addEventListener('click',()=>{const msg=state.tone==='playful'?'Rey ra 😭 20 mins chaduvu, tarvatha chill avvu!':'A little reminder: choose one small study task and begin.';notifyUser('StudySync reminder',msg);showToast(msg);});
  $('#saveReminderButton').addEventListener('click',()=>{state.reminderTime=$('#reminderTime').value||'19:00';state.reminderEnabled=true;saveState();showToast(`Daily reminder set for ${state.reminderTime} while StudySync is open.`);});
  $('#toneSelect').value = state.tone;
  setInterval(checkReminder, 15000);
  renderFeaturePages();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('StudySync offline support could not be registered:', error));
  }
  setGreeting();
  renderAllTasks();
  renderBacklogs();
  renderSubjects();
  renderResources("pyqs");
  renderResources("videos");
})();
