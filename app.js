const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// =====================================================
// HELPERS
// =====================================================

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}


// =====================================================
// DOM
// =====================================================

const loginPage = $("loginPage");
const dashboardPage = $("dashboardPage");

const loginForm = $("loginForm");
const loginButton = $("loginButton");
const loginError = $("loginError");

const logoutButton = $("logoutButton");
const userEmail = $("userEmail");

const kpiTotal = $("kpiTotal");
const kpiCampus = $("kpiCampus");
const kpiFaculty = $("kpiFaculty");
const kpiWatched = $("kpiWatched");
const kpiUnwatched = $("kpiUnwatched");
const kpiProblem = $("kpiProblem");

const campusList = $("campusList");

const submissionTableBody = $("submissionTableBody");
const submissionCards = $("submissionCards");
const resultCount = $("resultCount");
const submissionTitle = $("submissionTitle");

const filterYear = $("filterYear");
const filterCampus = $("filterCampus");
const filterFaculty = $("filterFaculty");
const filterStatus = $("filterStatus");
const searchInput = $("searchInput");
const clearFilters = $("clearFilters");

const selectedCount = $("selectedCount");
const exportSelectedButton = $("exportSelectedButton");
const selectAllVisible = $("selectAllVisible");

const campusModal = $("campusModal");
const campusModalTitle = $("campusModalTitle");
const campusModalContent = $("campusModalContent");
const closeCampusModal = $("closeCampusModal");

const reviewModal = $("reviewModal");
const reviewModalName = $("reviewModalName");
const reviewModalMeta = $("reviewModalMeta");
const videoFrame = $("videoFrame");
const openOriginalVideo = $("openOriginalVideo");
const currentReviewStatus = $("currentReviewStatus");
const hasProblem = $("hasProblem");
const problemType = $("problemType");
const reviewNote = $("reviewNote");
const saveReviewButton = $("saveReviewButton");
const reviewSaveMessage = $("reviewSaveMessage");
const closeReviewModal = $("closeReviewModal");


// =====================================================
// STATE
// =====================================================

let allSubmissions = [];
let currentProject = "all";
let selectedSubmissionIds = new Set();
let currentReviewSubmission = null;


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginError.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "กำลังเข้าสู่ระบบ...";

  const email = $("email").value.trim();
  const password = $("password").value;

  const { data, error } =
    await client.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error(error);

    loginError.textContent =
      "Email หรือ Password ไม่ถูกต้อง";

    loginButton.disabled = false;
    loginButton.textContent = "เข้าสู่ระบบ";
    return;
  }

  await showDashboard(data.user);

  loginButton.disabled = false;
  loginButton.textContent = "เข้าสู่ระบบ";
});


// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener("click", async () => {
  await client.auth.signOut();

  allSubmissions = [];
  selectedSubmissionIds.clear();

  dashboardPage.classList.add("hidden");
  loginPage.classList.remove("hidden");

  loginForm.reset();
});


// =====================================================
// LOAD DATA
// =====================================================

async function loadDashboardData() {
  const [submissionsResult, reviewsResult] =
    await Promise.all([
      client
        .from("submissions")
        .select(`
          id,
          project_id,
          project_name,
          student_id,
          name,
          campus,
          faculty,
          program,
          year_level,
          phone,
          email,
          video_url,
          duplicate_count,
          submitted_at
        `)
        .order("name", {
          ascending: true
        }),

      client
        .from("review_status")
        .select(`
          submission_id,
          watched,
          watched_at,
          has_problem,
          problem_type,
          note
        `)
    ]);

  if (submissionsResult.error) {
    console.error(submissionsResult.error);
    alert("ไม่สามารถโหลดข้อมูลผู้ส่งผลงานได้");
    return;
  }

  if (reviewsResult.error) {
    console.error(reviewsResult.error);
    alert("ไม่สามารถโหลดสถานะการตรวจได้");
    return;
  }

  const reviewMap = new Map();

  (reviewsResult.data || []).forEach((review) => {
    reviewMap.set(
      review.submission_id,
      review
    );
  });

  allSubmissions =
    (submissionsResult.data || []).map((row) => {
      const review =
        reviewMap.get(row.id) || {
          watched: false,
          watched_at: null,
          has_problem: false,
          problem_type: "",
          note: ""
        };

      return {
        ...row,
        review
      };
    });

  populateProjectFilters();
  renderDashboard();
}


// =====================================================
// PROJECT SWITCHER
// =====================================================

document
  .querySelectorAll(".project-tab")
  .forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".project-tab")
        .forEach((tab) => {
          tab.classList.remove("active");
        });

      button.classList.add("active");

      currentProject =
        button.dataset.project;

      selectedSubmissionIds.clear();

      resetFilters();
      populateProjectFilters();
      renderDashboard();
    });
  });


// =====================================================
// PROJECT DATA
// =====================================================

function getProjectRows() {
  if (currentProject === "all") {
    return allSubmissions;
  }

  return allSubmissions.filter(
    (row) =>
      row.project_id === currentProject
  );
}


// =====================================================
// FILTER OPTIONS
// =====================================================

function uniqueValues(rows, field) {
  return [
    ...new Set(
      rows
        .map((row) => row[field])
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "th")
  );
}

function populateSelect(
  element,
  values,
  firstLabel,
  currentValue = ""
) {
  element.innerHTML =
    `<option value="">${firstLabel}</option>`;

  values.forEach((value) => {
    const option =
      document.createElement("option");

    option.value = value;
    option.textContent = value;

    element.appendChild(option);
  });

  if (
    values.includes(currentValue)
  ) {
    element.value = currentValue;
  }
}

function populateProjectFilters() {
  const rows = getProjectRows();

  const currentYear =
    filterYear.value;

  const currentCampus =
    filterCampus.value;

  const currentFaculty =
    filterFaculty.value;

  populateSelect(
    filterYear,
    uniqueValues(
      rows,
      "year_level"
    ),
    "ทุกชั้นปี",
    currentYear
  );

  populateSelect(
    filterCampus,
    uniqueValues(
      rows,
      "campus"
    ),
    "ทุกวิทยาเขต",
    currentCampus
  );

  let facultyRows = rows;

  if (filterCampus.value) {
    facultyRows =
      rows.filter(
        (row) =>
          row.campus ===
          filterCampus.value
      );
  }

  populateSelect(
    filterFaculty,
    uniqueValues(
      facultyRows,
      "faculty"
    ),
    "ทุกคณะ",
    currentFaculty
  );
}


// =====================================================
// STATUS
// =====================================================

function getStatus(row) {
  if (
    row.review?.has_problem
  ) {
    return "problem";
  }

  if (
    row.review?.watched
  ) {
    return "watched";
  }

  return "unwatched";
}

function getStatusLabel(row) {
  const status =
    getStatus(row);

  if (
    status === "problem"
  ) {
    return "มีปัญหา";
  }

  if (
    status === "watched"
  ) {
    return "ดูแล้ว";
  }

  return "ยังไม่ดู";
}

function statusBadge(row) {
  const status =
    getStatus(row);

  if (
    status === "problem"
  ) {
    return `
      <span class="status-badge problem">
        ⚠ มีปัญหา
      </span>
    `;
  }

  if (
    status === "watched"
  ) {
    return `
      <span class="status-badge watched">
        ✓ ดูแล้ว
      </span>
    `;
  }

  return `
    <span class="status-badge unwatched">
      ● ยังไม่ดู
    </span>
  `;
}


// =====================================================
// MAIN RENDER
// =====================================================

function renderDashboard() {
  const rows =
    getProjectRows();

  renderKPIs(rows);
  renderCampusOverview(rows);
  renderSubmissions();
  updateSelectionUI();
}


// =====================================================
// KPI
// =====================================================

function renderKPIs(rows) {
  kpiTotal.textContent =
    rows.length;

  kpiCampus.textContent =
    uniqueValues(
      rows,
      "campus"
    ).length;

  kpiFaculty.textContent =
    uniqueValues(
      rows,
      "faculty"
    ).length;

  const watched =
    rows.filter(
      (row) =>
        row.review?.watched
    ).length;

  const problem =
    rows.filter(
      (row) =>
        row.review?.has_problem
    ).length;

  const unwatched =
    rows.filter(
      (row) =>
        !row.review?.watched
    ).length;

  kpiWatched.textContent =
    watched;

  kpiUnwatched.textContent =
    unwatched;

  kpiProblem.textContent =
    problem;
}


// =====================================================
// CAMPUS OVERVIEW
// =====================================================

function renderCampusOverview(rows) {
  const grouped = {};

  rows.forEach((row) => {
    const campus =
      row.campus || "ไม่ระบุ";

    if (!grouped[campus]) {
      grouped[campus] = [];
    }

    grouped[campus].push(row);
  });

  const campuses =
    Object.entries(grouped)
      .sort(
        (a, b) =>
          b[1].length -
          a[1].length
      );

  campusList.innerHTML = "";

  if (!campuses.length) {
    campusList.innerHTML =
      `
        <div class="empty-state">
          ไม่มีข้อมูล
        </div>
      `;
    return;
  }

  campuses.forEach(
    ([campus, campusRows]) => {
      const facultyCount =
        uniqueValues(
          campusRows,
          "faculty"
        ).length;

      const watched =
        campusRows.filter(
          (row) =>
            row.review?.watched
        ).length;

      const problem =
        campusRows.filter(
          (row) =>
            row.review?.has_problem
        ).length;

      const item =
        document.createElement("div");

      item.className =
        "campus-item";

      item.innerHTML = `
        <div class="campus-main">

          <strong>
            ${escapeHtml(campus)}
          </strong>

          <div class="campus-meta">

            <span>
              ${campusRows.length} คน
            </span>

            <span>
              ${facultyCount} คณะ
            </span>

          </div>

          <div class="campus-progress">

            <span>
              ดูแล้ว
              ${watched}/${campusRows.length}
            </span>

            ${
              problem > 0
                ? `
                  <span class="problem-text">
                    ⚠ ${problem} มีปัญหา
                  </span>
                `
                : ""
            }

          </div>

        </div>

        <div class="campus-actions">

          <button
            class="small-button campus-list-button"
            data-campus="${escapeAttribute(campus)}"
          >
            ดูรายชื่อ
          </button>

          <button
            class="small-button secondary campus-detail-button"
            data-campus="${escapeAttribute(campus)}"
          >
            รายละเอียด
          </button>

        </div>
      `;

      campusList.appendChild(item);
    }
  );

  document
    .querySelectorAll(
      ".campus-list-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          filterCampus.value =
            button.dataset.campus;

          populateProjectFilters();
          renderSubmissions();
        }
      );
    });

  document
    .querySelectorAll(
      ".campus-detail-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          showCampusDetail(
            button.dataset.campus
          );
        }
      );
    });
}


// =====================================================
// FILTERING
// =====================================================

function getFilteredRows() {
  let rows =
    getProjectRows();

  const year =
    filterYear.value;

  const campus =
    filterCampus.value;

  const faculty =
    filterFaculty.value;

  const status =
    filterStatus.value;

  const search =
    searchInput
      .value
      .trim()
      .toLowerCase();

  if (year) {
    rows =
      rows.filter(
        (row) =>
          row.year_level === year
      );
  }

  if (campus) {
    rows =
      rows.filter(
        (row) =>
          row.campus === campus
      );
  }

  if (faculty) {
    rows =
      rows.filter(
        (row) =>
          row.faculty === faculty
      );
  }

  if (status) {
    rows =
      rows.filter(
        (row) =>
          getStatus(row) === status
      );
  }

  if (search) {
    rows =
      rows.filter((row) => {
        const text =
          [
            row.name,
            row.student_id,
            row.campus,
            row.faculty,
            row.program
          ]
            .join(" ")
            .toLowerCase();

        return text.includes(search);
      });
  }

  return rows;
}


// =====================================================
// SUBMISSIONS
// =====================================================

function renderSubmissions() {
  const rows =
    getFilteredRows();

  resultCount.textContent =
    `${rows.length} รายการ`;

  if (
    currentProject ===
    "campus-pride"
  ) {
    submissionTitle.textContent =
      "My University, My Campus, My Pride";
  } else if (
    currentProject ===
    "my-life-mbu"
  ) {
    submissionTitle.textContent =
      "My Life at MBU";
  } else {
    submissionTitle.textContent =
      "รายชื่อผู้ส่งผลงานทั้งหมด";
  }

  submissionTableBody.innerHTML =
    "";

  submissionCards.innerHTML =
    "";

  rows.forEach((row) => {
    const status =
      getStatus(row);

    const tr =
      document.createElement("tr");

    tr.className =
      `submission-row ${status}`;

    tr.innerHTML = `
      <td>
        <input
          type="checkbox"
          class="row-checkbox"
          data-id="${row.id}"
          ${
            selectedSubmissionIds
              .has(row.id)
              ? "checked"
              : ""
          }
        >
      </td>

      <td>
        <strong>
          ${escapeHtml(
            row.name || "-"
          )}
        </strong>

        ${
          row.duplicate_count > 1
            ? `
              <div class="tiny-duplicate">
                ส่ง ${row.duplicate_count} ครั้ง
              </div>
            `
            : ""
        }
      </td>

      <td>
        ${escapeHtml(
          row.student_id || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          row.campus || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          row.faculty || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          row.year_level || "-"
        )}
      </td>

      <td>
        ${statusBadge(row)}
      </td>

      <td>
        ${
          row.video_url
            ? `
              <button
                class="review-button"
                data-id="${row.id}"
              >
                ▶ ดูผลงาน
              </button>
            `
            : `
              <span class="no-link">
                ไม่มีลิงก์
              </span>
            `
        }
      </td>
    `;

    submissionTableBody.appendChild(
      tr
    );

    const card =
      document.createElement("div");

    card.className =
      `submission-card ${status}`;

    card.innerHTML = `
      <div class="mobile-card-top">

        <input
          type="checkbox"
          class="row-checkbox"
          data-id="${row.id}"
          ${
            selectedSubmissionIds
              .has(row.id)
              ? "checked"
              : ""
          }
        >

        ${statusBadge(row)}

      </div>

      <div class="submission-card-name">
        ${escapeHtml(
          row.name || "-"
        )}
      </div>

      <div class="submission-card-id">
        ${escapeHtml(
          row.student_id || "-"
        )}
      </div>

      <div class="submission-card-meta">
        ${escapeHtml(
          row.campus || "-"
        )}
      </div>

      <div class="submission-card-meta">
        ${escapeHtml(
          row.faculty || "-"
        )}
        ·
        ${escapeHtml(
          row.year_level || "-"
        )}
      </div>

      ${
        row.video_url
          ? `
            <button
              class="review-button mobile-review-button"
              data-id="${row.id}"
            >
              ▶ ดูผลงาน
            </button>
          `
          : ""
      }
    `;

    submissionCards.appendChild(
      card
    );
  });

  attachSubmissionEvents(rows);

  if (!rows.length) {
    submissionTableBody.innerHTML =
      `
        <tr>
          <td
            colspan="8"
            class="empty-table"
          >
            ไม่พบข้อมูลตามตัวกรอง
          </td>
        </tr>
      `;

    submissionCards.innerHTML =
      `
        <div class="empty-state">
          ไม่พบข้อมูลตามตัวกรอง
        </div>
      `;
  }

  updateSelectionUI();
}


// =====================================================
// ROW EVENTS
// =====================================================

function attachSubmissionEvents(
  visibleRows
) {
  document
    .querySelectorAll(
      ".review-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const row =
            allSubmissions.find(
              (item) =>
                item.id ===
                button.dataset.id
            );

          if (row) {
            openReviewModal(row);
          }
        }
      );
    });

  document
    .querySelectorAll(
      ".row-checkbox"
    )
    .forEach((checkbox) => {
      checkbox.addEventListener(
        "change",
        () => {
          const id =
            checkbox.dataset.id;

          if (checkbox.checked) {
            selectedSubmissionIds
              .add(id);
          } else {
            selectedSubmissionIds
              .delete(id);
          }

          document
            .querySelectorAll(
              `.row-checkbox[data-id="${id}"]`
            )
            .forEach((other) => {
              other.checked =
                checkbox.checked;
            });

          updateSelectionUI();
        }
      );
    });

  selectAllVisible.checked =
    visibleRows.length > 0 &&
    visibleRows.every(
      (row) =>
        selectedSubmissionIds
          .has(row.id)
    );
}


// =====================================================
// SELECT ALL
// =====================================================

selectAllVisible.addEventListener(
  "change",
  () => {
    const rows =
      getFilteredRows();

    rows.forEach((row) => {
      if (
        selectAllVisible.checked
      ) {
        selectedSubmissionIds
          .add(row.id);
      } else {
        selectedSubmissionIds
          .delete(row.id);
      }
    });

    renderSubmissions();
  }
);

function updateSelectionUI() {
  selectedCount.textContent =
    selectedSubmissionIds.size;

  exportSelectedButton.disabled =
    selectedSubmissionIds.size === 0;
}


// =====================================================
// REVIEW MODAL
// =====================================================

async function openReviewModal(row) {
  currentReviewSubmission = row;

  reviewSaveMessage.textContent =
    "";

  reviewModalName.textContent =
    row.name || "ผลงาน";

  reviewModalMeta.textContent =
    [
      row.project_name,
      row.campus,
      row.faculty,
      row.year_level
    ]
      .filter(Boolean)
      .join(" · ");

  videoFrame.src =
    convertToPreviewUrl(
      row.video_url
    );

  openOriginalVideo.href =
    row.video_url || "#";

  hasProblem.checked =
    Boolean(
      row.review?.has_problem
    );

  problemType.value =
    row.review?.problem_type || "";

  reviewNote.value =
    row.review?.note || "";

  renderCurrentReviewStatus(row);

  reviewModal.classList.remove(
    "hidden"
  );

  if (
    !row.review?.watched
  ) {
    await markAsWatched(row);
  }
}

async function markAsWatched(row) {
  const now =
    new Date().toISOString();

  const payload = {
    submission_id:
      row.id,

    watched:
      true,

    watched_at:
      now,

    has_problem:
      Boolean(
        row.review?.has_problem
      ),

    problem_type:
      row.review?.problem_type || null,

    note:
      row.review?.note || null,

    updated_at:
      now
  };

  const { error } =
    await client
      .from("review_status")
      .upsert(
        payload,
        {
          onConflict:
            "submission_id"
        }
      );

  if (error) {
    console.error(error);
    return;
  }

  row.review = {
    ...row.review,
    watched: true,
    watched_at: now
  };

  renderCurrentReviewStatus(row);
  renderDashboard();
}

function renderCurrentReviewStatus(row) {
  currentReviewStatus.innerHTML =
    statusBadge(row);
}


// =====================================================
// SAVE REVIEW
// =====================================================

saveReviewButton.addEventListener(
  "click",
  async () => {
    if (
      !currentReviewSubmission
    ) {
      return;
    }

    saveReviewButton.disabled =
      true;

    saveReviewButton.textContent =
      "กำลังบันทึก...";

    const now =
      new Date().toISOString();

    const problem =
      hasProblem.checked;

    const payload = {
      submission_id:
        currentReviewSubmission.id,

      watched:
        true,

      watched_at:
        currentReviewSubmission
          .review?.watched_at ||
        now,

      has_problem:
        problem,

      problem_type:
        problem
          ? (
              problemType.value ||
              null
            )
          : null,

      note:
        reviewNote.value.trim() ||
        null,

      updated_at:
        now
    };

    const { error } =
      await client
        .from("review_status")
        .upsert(
          payload,
          {
            onConflict:
              "submission_id"
          }
        );

    saveReviewButton.disabled =
      false;

    saveReviewButton.textContent =
      "บันทึก";

    if (error) {
      console.error(error);

      reviewSaveMessage.textContent =
        "บันทึกไม่สำเร็จ";

      reviewSaveMessage.className =
        "save-message error";

      return;
    }

    currentReviewSubmission.review = {
      watched:
        true,

      watched_at:
        payload.watched_at,

      has_problem:
        payload.has_problem,

      problem_type:
        payload.problem_type,

      note:
        payload.note
    };

    reviewSaveMessage.textContent =
      "✓ บันทึกเรียบร้อย";

    reviewSaveMessage.className =
      "save-message success";

    renderCurrentReviewStatus(
      currentReviewSubmission
    );

    renderDashboard();
  }
);


// =====================================================
// VIDEO URL
// =====================================================

function convertToPreviewUrl(url) {
  if (!url) {
    return "";
  }

  let match =
    url.match(
      /drive\.google\.com\/file\/d\/([^/]+)/
    );

  if (
    match &&
    match[1]
  ) {
    return (
      "https://drive.google.com/file/d/" +
      match[1] +
      "/preview"
    );
  }

  match =
    url.match(
      /docs\.google\.com\/videos\/d\/([^/]+)/
    );

  if (
    match &&
    match[1]
  ) {
    return (
      "https://drive.google.com/file/d/" +
      match[1] +
      "/preview"
    );
  }

  return url;
}


// =====================================================
// CAMPUS DETAIL
// =====================================================

function showCampusDetail(campus) {
  const rows =
    getProjectRows()
      .filter(
        (row) =>
          row.campus === campus
      );

  const facultyMap = {};
  const yearMap = {};

  rows.forEach((row) => {
    const faculty =
      row.faculty || "ไม่ระบุ";

    facultyMap[faculty] =
      (facultyMap[faculty] || 0) + 1;

    const year =
      row.year_level || "ไม่ระบุ";

    yearMap[year] =
      (yearMap[year] || 0) + 1;
  });

  const watched =
    rows.filter(
      (row) =>
        row.review?.watched
    ).length;

  const problem =
    rows.filter(
      (row) =>
        row.review?.has_problem
    ).length;

  campusModalTitle.textContent =
    campus;

  const faculties =
    Object.entries(
      facultyMap
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  const years =
    Object.entries(
      yearMap
    )
      .sort();

  campusModalContent.innerHTML = `
    <div class="modal-stat-grid">

      <div class="modal-stat">
        <span>
          ผู้ส่งทั้งหมด
        </span>

        <strong>
          ${rows.length}
        </strong>
      </div>

      <div class="modal-stat">
        <span>
          ดูแล้ว
        </span>

        <strong>
          ${watched}
        </strong>
      </div>

      <div class="modal-stat">
        <span>
          มีปัญหา
        </span>

        <strong>
          ${problem}
        </strong>
      </div>

    </div>

    <div class="modal-section">

      <h4>
        แยกตามคณะ
      </h4>

      ${
        faculties
          .map(
            ([faculty, count]) => `
              <div class="detail-row">

                <span>
                  ${escapeHtml(faculty)}
                </span>

                <strong>
                  ${count} คน
                </strong>

              </div>
            `
          )
          .join("")
      }

    </div>

    <div class="modal-section">

      <h4>
        แยกตามชั้นปี
      </h4>

      ${
        years
          .map(
            ([year, count]) => `
              <div class="detail-row">

                <span>
                  ${escapeHtml(year)}
                </span>

                <strong>
                  ${count} คน
                </strong>

              </div>
            `
          )
          .join("")
      }

    </div>

    <button
      id="modalViewCampusList"
      class="primary-button full-width"
    >
      ดูรายชื่อในวิทยาเขตนี้
    </button>
  `;

  campusModal.classList.remove(
    "hidden"
  );

  $("modalViewCampusList")
    .addEventListener(
      "click",
      () => {
        filterCampus.value =
          campus;

        populateProjectFilters();

        campusModal.classList.add(
          "hidden"
        );

        renderSubmissions();
      }
    );
}


// =====================================================
// EXPORT
// =====================================================

exportSelectedButton.addEventListener(
  "click",
  () => {
    const rows =
      allSubmissions.filter(
        (row) =>
          selectedSubmissionIds
            .has(row.id)
      );

    if (!rows.length) {
      return;
    }

    const headers = [
      "โครงการ",
      "รหัสนักศึกษา",
      "ชื่อ-สกุล",
      "วิทยาเขต/วิทยาลัย",
      "คณะ",
      "หลักสูตร",
      "ชั้นปี",
      "เบอร์ติดต่อ",
      "Email",
      "สถานะ",
      "ประเภทปัญหา",
      "หมายเหตุ",
      "ลิงก์ผลงาน"
    ];

    const csvRows = [
      headers,

      ...rows.map(
        (row) => [
          row.project_name || "",
          row.student_id || "",
          row.name || "",
          row.campus || "",
          row.faculty || "",
          row.program || "",
          row.year_level || "",
          row.phone || "",
          row.email || "",
          getStatusLabel(row),
          row.review?.problem_type || "",
          row.review?.note || "",
          row.video_url || ""
        ]
      )
    ];

    const csv =
      csvRows
        .map(
          (row) =>
            row
              .map(csvEscape)
              .join(",")
        )
        .join("\r\n");

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv
        ],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `MBU_Contest_Selected_${getTodayString()}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }
);

function csvEscape(value) {
  const text =
    String(value ?? "");

  return (
    '"' +
    text.replaceAll(
      '"',
      '""'
    ) +
    '"'
  );
}

function getTodayString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}${month}${day}`;
}


// =====================================================
// FILTER EVENTS
// =====================================================

filterYear.addEventListener(
  "change",
  renderSubmissions
);

filterCampus.addEventListener(
  "change",
  () => {
    populateProjectFilters();
    renderSubmissions();
  }
);

filterFaculty.addEventListener(
  "change",
  renderSubmissions
);

filterStatus.addEventListener(
  "change",
  renderSubmissions
);

searchInput.addEventListener(
  "input",
  renderSubmissions
);

clearFilters.addEventListener(
  "click",
  () => {
    resetFilters();
    populateProjectFilters();
    renderSubmissions();
  }
);

function resetFilters() {
  filterYear.value = "";
  filterCampus.value = "";
  filterFaculty.value = "";
  filterStatus.value = "";
  searchInput.value = "";
}


// =====================================================
// MODALS
// =====================================================

closeCampusModal.addEventListener(
  "click",
  () => {
    campusModal.classList.add(
      "hidden"
    );
  }
);

campusModal.addEventListener(
  "click",
  (event) => {
    if (
      event.target.dataset
        .closeCampusModal === "true"
    ) {
      campusModal.classList.add(
        "hidden"
      );
    }
  }
);

closeReviewModal.addEventListener(
  "click",
  closeReview
);

reviewModal.addEventListener(
  "click",
  (event) => {
    if (
      event.target.dataset
        .closeReviewModal === "true"
    ) {
      closeReview();
    }
  }
);

function closeReview() {
  reviewModal.classList.add(
    "hidden"
  );

  videoFrame.src = "";

  currentReviewSubmission =
    null;
}


// =====================================================
// SHOW DASHBOARD
// =====================================================

async function showDashboard(user) {
  loginPage.classList.add(
    "hidden"
  );

  dashboardPage.classList.remove(
    "hidden"
  );

  userEmail.textContent =
    user.email || "";

  await loadDashboardData();
}


// =====================================================
// INITIALIZE
// =====================================================

async function initializeApp() {
  const {
    data: {
      session
    }
  } =
    await client.auth.getSession();

  if (
    session &&
    session.user
  ) {
    await showDashboard(
      session.user
    );
  } else {
    dashboardPage.classList.add(
      "hidden"
    );

    loginPage.classList.remove(
      "hidden"
    );
  }
}

initializeApp();
