// ============================================================
// SUPABASE CLIENT
// ============================================================

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ============================================================
// DOM HELPER
// ============================================================

function byId(id) {
  return document.getElementById(id);
}


// ============================================================
// DOM ELEMENTS
// ============================================================

const loginPage =
  byId("loginPage");

const dashboardPage =
  byId("dashboardPage");

const loginForm =
  byId("loginForm");

const loginButton =
  byId("loginButton");

const loginError =
  byId("loginError");

const logoutButton =
  byId("logoutButton");

const userEmail =
  byId("userEmail");


const kpiTotal =
  byId("kpiTotal");

const kpiCampus =
  byId("kpiCampus");

const kpiFaculty =
  byId("kpiFaculty");

const kpiWatched =
  byId("kpiWatched");

const kpiUnwatched =
  byId("kpiUnwatched");

const kpiProblem =
  byId("kpiProblem");


const campusList =
  byId("campusList");


const submissionTitle =
  byId("submissionTitle");

const resultCount =
  byId("resultCount");

const submissionTableBody =
  byId("submissionTableBody");

const submissionCards =
  byId("submissionCards");


const filterYear =
  byId("filterYear");

const filterCampus =
  byId("filterCampus");

const filterFaculty =
  byId("filterFaculty");

const filterStatus =
  byId("filterStatus");

const searchInput =
  byId("searchInput");

const clearFilters =
  byId("clearFilters");


const campusModal =
  byId("campusModal");

const campusModalBackdrop =
  byId("campusModalBackdrop");

const campusModalTitle =
  byId("campusModalTitle");

const campusModalContent =
  byId("campusModalContent");

const closeCampusModal =
  byId("closeCampusModal");

const reviewModal =
  byId("reviewModal");

const reviewModalBackdrop =
  byId("reviewModalBackdrop");

const reviewModalName =
  byId("reviewModalName");

const reviewModalMeta =
  byId("reviewModalMeta");

const reviewVideoFrame =
  byId("reviewVideoFrame");

const reviewCurrentStatus =
  byId("reviewCurrentStatus");

const reviewOriginalLink =
  byId("reviewOriginalLink");

const closeReviewModal =
  byId("closeReviewModal");


// ============================================================
// STATE
// ============================================================

let allSubmissions = [];

let currentProject = "all";


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    loginError.textContent = "";

    loginButton.disabled = true;

    loginButton.textContent =
      "กำลังเข้าสู่ระบบ...";


    const email =
      byId("email")
        .value
        .trim();


    const password =
      byId("password")
        .value;


    const result =
      await client.auth
        .signInWithPassword({
          email: email,
          password: password
        });


    if (result.error) {

      console.error(
        "Login error:",
        result.error
      );


      loginError.textContent =
        "Email หรือ Password ไม่ถูกต้อง";


      loginButton.disabled = false;

      loginButton.textContent =
        "เข้าสู่ระบบ";

      return;
    }


    await showDashboard(
      result.data.user
    );


    loginButton.disabled = false;

    loginButton.textContent =
      "เข้าสู่ระบบ";

  }
);


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener(
  "click",
  async function () {

    await client.auth.signOut();


    allSubmissions = [];


    dashboardPage.classList.add(
      "hidden"
    );


    loginPage.classList.remove(
      "hidden"
    );


    loginForm.reset();

  }
);


// ============================================================
// LOAD DATA
// ============================================================

async function loadDashboardData() {

  console.log(
    "Loading dashboard data..."
  );


  const submissionsRequest =
    client
      .from("submissions")
      .select(
        `
        id,
        project_id,
        project_name,
        student_id,
        name,
        campus,
        faculty,
        program,
        year_level,
        video_url,
        duplicate_count,
        submitted_at
        `
      )
      .order(
        "name",
        {
          ascending: true
        }
      );


  const reviewsRequest =
    client
      .from("review_status")
      .select(
        `
        submission_id,
        watched,
        watched_at,
        has_problem,
        problem_type,
        note
        `
      );


  const results =
    await Promise.all([
      submissionsRequest,
      reviewsRequest
    ]);


  const submissionsResult =
    results[0];


  const reviewsResult =
    results[1];


  if (
    submissionsResult.error
  ) {

    console.error(
      "Submission load error:",
      submissionsResult.error
    );


    alert(
      "ไม่สามารถโหลดข้อมูลผู้ส่งผลงานได้"
    );

    return;
  }


  if (
    reviewsResult.error
  ) {

    console.error(
      "Review load error:",
      reviewsResult.error
    );


    alert(
      "ไม่สามารถโหลดสถานะการตรวจได้"
    );

    return;
  }


  const reviewMap =
    new Map();


  const reviews =
    reviewsResult.data || [];


  reviews.forEach(
    function (review) {

      reviewMap.set(
        review.submission_id,
        review
      );

    }
  );


  const submissions =
    submissionsResult.data || [];


  allSubmissions =
    submissions.map(
      function (submission) {

        const review =
          reviewMap.get(
            submission.id
          );


        return {

          ...submission,

          review:
            review || {
              watched: false,
              watched_at: null,
              has_problem: false,
              problem_type: "",
              note: ""
            }

        };

      }
    );


  console.log(
    "Submissions loaded:",
    allSubmissions.length
  );


  populateFilters();

  renderDashboard();

}


// ============================================================
// PROJECT SWITCH
// ============================================================

const projectTabs =
  document.querySelectorAll(
    ".project-tab"
  );


projectTabs.forEach(
  function (button) {

    button.addEventListener(
      "click",
      function () {

        projectTabs.forEach(
          function (tab) {

            tab.classList.remove(
              "active"
            );

          }
        );


        button.classList.add(
          "active"
        );


        currentProject =
          button.dataset.project;


        resetFilters();

        populateFilters();

        renderDashboard();

      }
    );

  }
);


// ============================================================
// PROJECT DATA
// ============================================================

function getProjectRows() {

  if (
    currentProject === "all"
  ) {

    return allSubmissions;

  }


  return allSubmissions.filter(
    function (row) {

      return (
        row.project_id ===
        currentProject
      );

    }
  );

}


// ============================================================
// UNIQUE VALUES
// ============================================================

function getUniqueValues(
  rows,
  field
) {

  const values =
    rows
      .map(
        function (row) {

          return row[field];

        }
      )
      .filter(
        function (value) {

          return (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          );

        }
      );


  return [
    ...new Set(values)
  ].sort(
    function (a, b) {

      return String(a)
        .localeCompare(
          String(b),
          "th"
        );

    }
  );

}


// ============================================================
// POPULATE SELECT
// ============================================================

function populateSelect(
  element,
  values,
  firstLabel
) {

  const previousValue =
    element.value;


  element.innerHTML =
    "";


  const firstOption =
    document.createElement(
      "option"
    );


  firstOption.value =
    "";


  firstOption.textContent =
    firstLabel;


  element.appendChild(
    firstOption
  );


  values.forEach(
    function (value) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        value;


      option.textContent =
        value;


      element.appendChild(
        option
      );

    }
  );


  if (
    values.includes(
      previousValue
    )
  ) {

    element.value =
      previousValue;

  }

}


// ============================================================
// FILTER OPTIONS
// ============================================================

function populateFilters() {

  const rows =
    getProjectRows();


  populateSelect(
    filterYear,
    getUniqueValues(
      rows,
      "year_level"
    ),
    "ทุกชั้นปี"
  );


  populateSelect(
    filterCampus,
    getUniqueValues(
      rows,
      "campus"
    ),
    "ทุกวิทยาเขต"
  );


  let facultySource =
    rows;


  if (
    filterCampus.value
  ) {

    facultySource =
      rows.filter(
        function (row) {

          return (
            row.campus ===
            filterCampus.value
          );

        }
      );

  }


  populateSelect(
    filterFaculty,
    getUniqueValues(
      facultySource,
      "faculty"
    ),
    "ทุกคณะ"
  );

}


// ============================================================
// STATUS
// ============================================================

function getStatus(row) {

  if (
    row.review &&
    row.review.has_problem
  ) {

    return "problem";

  }


  if (
    row.review &&
    row.review.watched
  ) {

    return "watched";

  }


  return "unwatched";

}


function getStatusBadge(row) {

  const status =
    getStatus(row);


  if (
    status === "problem"
  ) {

    return (
      '<span class="status-badge problem">' +
      "⚠ มีปัญหา" +
      "</span>"
    );

  }


  if (
    status === "watched"
  ) {

    return (
      '<span class="status-badge watched">' +
      "✓ ดูแล้ว" +
      "</span>"
    );

  }


  return (
    '<span class="status-badge unwatched">' +
    "● ยังไม่ดู" +
    "</span>"
  );

}


// ============================================================
// RENDER DASHBOARD
// ============================================================

function renderDashboard() {

  const projectRows =
    getProjectRows();


  renderKPIs(
    projectRows
  );


  renderCampusOverview(
    projectRows
  );


  renderSubmissions();

}


// ============================================================
// KPI
// ============================================================

function renderKPIs(rows) {

  kpiTotal.textContent =
    rows.length;


  kpiCampus.textContent =
    getUniqueValues(
      rows,
      "campus"
    ).length;


  kpiFaculty.textContent =
    getUniqueValues(
      rows,
      "faculty"
    ).length;


  const watched =
    rows.filter(
      function (row) {

        return (
          row.review &&
          row.review.watched
        );

      }
    ).length;


  const problem =
    rows.filter(
      function (row) {

        return (
          row.review &&
          row.review.has_problem
        );

      }
    ).length;


  const unwatched =
    rows.filter(
      function (row) {

        return !(
          row.review &&
          row.review.watched
        );

      }
    ).length;


  kpiWatched.textContent =
    watched;


  kpiUnwatched.textContent =
    unwatched;


  kpiProblem.textContent =
    problem;

}


// ============================================================
// CAMPUS OVERVIEW
// ============================================================

function renderCampusOverview(rows) {

  const groups = {};


  rows.forEach(
    function (row) {

      const campus =
        row.campus ||
        "ไม่ระบุ";


      if (
        !groups[campus]
      ) {

        groups[campus] = [];

      }


      groups[campus].push(
        row
      );

    }
  );


  const campuses =
    Object.entries(
      groups
    ).sort(
      function (a, b) {

        return (
          b[1].length -
          a[1].length
        );

      }
    );


  campusList.innerHTML =
    "";


  if (
    campuses.length === 0
  ) {

    campusList.innerHTML =
      '<div class="empty-table">ไม่มีข้อมูล</div>';

    return;
  }


  campuses.forEach(
    function (entry) {

      const campus =
        entry[0];


      const campusRows =
        entry[1];


      const facultyCount =
        getUniqueValues(
          campusRows,
          "faculty"
        ).length;


      const watched =
        campusRows.filter(
          function (row) {

            return (
              row.review &&
              row.review.watched
            );

          }
        ).length;


      const problem =
        campusRows.filter(
          function (row) {

            return (
              row.review &&
              row.review.has_problem
            );

          }
        ).length;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "campus-item";


      item.innerHTML =
        `
        <div class="campus-info">

          <div class="campus-name">
            ${escapeHtml(campus)}
          </div>

          <div class="campus-stats">

            <span>
              ${campusRows.length} คน
            </span>

            <span>
              ${facultyCount} คณะ
            </span>

          </div>

          <div class="campus-status">

            <span>
              ดูแล้ว ${watched}/${campusRows.length}
            </span>

            ${
              problem > 0
                ? `
                <span class="problem">
                  ⚠ ${problem} มีปัญหา
                </span>
                `
                : ""
            }

          </div>

        </div>


        <div class="campus-buttons">

          <button
            type="button"
            class="mini-button view-campus-list"
            data-campus="${escapeAttribute(campus)}"
          >
            ดูรายชื่อ
          </button>

          <button
            type="button"
            class="mini-button secondary view-campus-detail"
            data-campus="${escapeAttribute(campus)}"
          >
            รายละเอียด
          </button>

        </div>
        `;


      campusList.appendChild(
        item
      );

    }
  );


  attachCampusEvents();

}


// ============================================================
// CAMPUS EVENTS
// ============================================================

function attachCampusEvents() {

  const listButtons =
    document.querySelectorAll(
      ".view-campus-list"
    );


  listButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const campus =
            button.dataset.campus;


          filterCampus.value =
            campus;


          populateFilters();


          filterCampus.value =
            campus;


          renderSubmissions();

        }
      );

    }
  );


  const detailButtons =
    document.querySelectorAll(
      ".view-campus-detail"
    );


  detailButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          showCampusDetail(
            button.dataset.campus
          );

        }
      );

    }
  );

}


// ============================================================
// FILTERED ROWS
// ============================================================

function getFilteredRows() {

  let rows =
    getProjectRows();


  const selectedYear =
    filterYear.value;


  const selectedCampus =
    filterCampus.value;


  const selectedFaculty =
    filterFaculty.value;


  const selectedStatus =
    filterStatus.value;


  const search =
    searchInput
      .value
      .trim()
      .toLowerCase();


  if (
    selectedYear
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.year_level ===
            selectedYear
          );

        }
      );

  }


  if (
    selectedCampus
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.campus ===
            selectedCampus
          );

        }
      );

  }


  if (
    selectedFaculty
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.faculty ===
            selectedFaculty
          );

        }
      );

  }


  if (
    selectedStatus
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            getStatus(row) ===
            selectedStatus
          );

        }
      );

  }


  if (
    search
  ) {

    rows =
      rows.filter(
        function (row) {

          const combinedText =
            [
              row.name,
              row.student_id,
              row.campus,
              row.faculty,
              row.program
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          return combinedText.includes(
            search
          );

        }
      );

  }


  return rows;

}


// ============================================================
// SUBMISSIONS
// ============================================================

function renderSubmissions() {

  const rows =
    getFilteredRows();


  resultCount.textContent =
    rows.length +
    " รายการ";


  updateSubmissionTitle();


  submissionTableBody.innerHTML =
    "";


  submissionCards.innerHTML =
    "";


  if (
    rows.length === 0
  ) {

    submissionTableBody.innerHTML =
      `
      <tr>
        <td
          colspan="7"
          class="empty-table"
        >
          ไม่พบข้อมูลตามตัวกรอง
        </td>
      </tr>
      `;


    submissionCards.innerHTML =
      `
      <div class="empty-table">
        ไม่พบข้อมูลตามตัวกรอง
      </div>
      `;


    return;
  }


  rows.forEach(
    function (row) {

      renderDesktopRow(
        row
      );


      renderMobileCard(
        row
      );

    }
  );

}


// ============================================================
// TITLE
// ============================================================

function updateSubmissionTitle() {

  if (
    currentProject ===
    "campus-pride"
  ) {

    submissionTitle.textContent =
      "My University, My Campus, My Pride";

    return;
  }


  if (
    currentProject ===
    "my-life-mbu"
  ) {

    submissionTitle.textContent =
      "My Life at MBU";

    return;
  }


  submissionTitle.textContent =
    "รายชื่อผู้ส่งผลงานทั้งหมด";

}


// ============================================================
// DESKTOP ROW
// ============================================================

function renderDesktopRow(row) {

  const tr =
    document.createElement(
      "tr"
    );


  const duplicateHtml =
    row.duplicate_count > 1
      ? `
        <div class="duplicate-note">
          ส่ง ${row.duplicate_count} ครั้ง
        </div>
        `
      : "";


  const videoHtml =
    row.video_url
      ? `
        <a
          class="video-button"
          href="${escapeAttribute(row.video_url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ ดูผลงาน
        </a>
        `
      : `
        <span class="no-video">
          ไม่มีลิงก์
        </span>
        `;


  tr.innerHTML =
    `
    <td>

      <div class="submission-name">
        ${escapeHtml(
          row.name || "-"
        )}
      </div>

      ${duplicateHtml}

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
      ${getStatusBadge(row)}
    </td>


    <td>
      ${videoHtml}
    </td>
    `;


  submissionTableBody.appendChild(
    tr
  );

}


// ============================================================
// MOBILE CARD
// ============================================================

function renderMobileCard(row) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "submission-card";


  const videoHtml =
    row.video_url
      ? `
        <a
          class="video-button"
          href="${escapeAttribute(row.video_url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ▶ ดูผลงาน
        </a>
        `
      : `
        <span class="no-video">
          ไม่มีลิงก์
        </span>
        `;


  card.innerHTML =
    `
    <div class="mobile-name">
      ${escapeHtml(
        row.name || "-"
      )}
    </div>


    <div class="mobile-id">
      ${escapeHtml(
        row.student_id || "-"
      )}
    </div>


    <div class="mobile-meta">

      ${escapeHtml(
        row.campus || "-"
      )}

      <br>

      ${escapeHtml(
        row.faculty || "-"
      )}

      ·

      ${escapeHtml(
        row.year_level || "-"
      )}

    </div>


    <div class="mobile-footer">

      ${getStatusBadge(row)}

      ${videoHtml}

    </div>
    `;


  submissionCards.appendChild(
    card
  );

}


// ============================================================
// FILTER EVENTS
// ============================================================

filterYear.addEventListener(
  "change",
  renderSubmissions
);


filterCampus.addEventListener(
  "change",
  function () {

    const campus =
      filterCampus.value;


    populateFilters();


    filterCampus.value =
      campus;


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
  function () {

    resetFilters();

    populateFilters();

    renderSubmissions();

  }
);


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

  filterYear.value =
    "";


  filterCampus.value =
    "";


  filterFaculty.value =
    "";


  filterStatus.value =
    "";


  searchInput.value =
    "";

}


// ============================================================
// CAMPUS DETAIL
// ============================================================

function showCampusDetail(
  campus
) {

  const rows =
    getProjectRows()
      .filter(
        function (row) {

          return (
            row.campus === campus
          );

        }
      );


  const facultyMap = {};

  const yearMap = {};


  rows.forEach(
    function (row) {

      const faculty =
        row.faculty ||
        "ไม่ระบุ";


      const year =
        row.year_level ||
        "ไม่ระบุ";


      facultyMap[faculty] =
        (
          facultyMap[faculty] ||
          0
        ) + 1;


      yearMap[year] =
        (
          yearMap[year] ||
          0
        ) + 1;

    }
  );


  const watched =
    rows.filter(
      function (row) {

        return (
          row.review &&
          row.review.watched
        );

      }
    ).length;


  const problem =
    rows.filter(
      function (row) {

        return (
          row.review &&
          row.review.has_problem
        );

      }
    ).length;


  const facultyEntries =
    Object.entries(
      facultyMap
    ).sort(
      function (a, b) {

        return (
          b[1] -
          a[1]
        );

      }
    );


  const yearEntries =
    Object.entries(
      yearMap
    ).sort();


  campusModalTitle.textContent =
    campus;


  campusModalContent.innerHTML =
    `
    <div class="modal-stat-grid">

      <div class="modal-stat">

        <div class="modal-stat-label">
          ผู้ส่งทั้งหมด
        </div>

        <div class="modal-stat-value">
          ${rows.length}
        </div>

      </div>


      <div class="modal-stat">

        <div class="modal-stat-label">
          ดูแล้ว
        </div>

        <div class="modal-stat-value">
          ${watched}
        </div>

      </div>


      <div class="modal-stat">

        <div class="modal-stat-label">
          มีปัญหา
        </div>

        <div class="modal-stat-value">
          ${problem}
        </div>

      </div>

    </div>


    <div class="detail-section">

      <h3>
        แยกตามคณะ
      </h3>

      ${facultyEntries
        .map(
          function (entry) {

            return `
            <div class="detail-row">

              <span>
                ${escapeHtml(
                  entry[0]
                )}
              </span>

              <strong>
                ${entry[1]} คน
              </strong>

            </div>
            `;

          }
        )
        .join("")
      }

    </div>


    <div class="detail-section">

      <h3>
        แยกตามชั้นปี
      </h3>

      ${yearEntries
        .map(
          function (entry) {

            return `
            <div class="detail-row">

              <span>
                ${escapeHtml(
                  entry[0]
                )}
              </span>

              <strong>
                ${entry[1]} คน
              </strong>

            </div>
            `;

          }
        )
        .join("")
      }

    </div>


    <button
      id="modalCampusListButton"
      type="button"
      class="primary-button modal-list-button"
    >
      ดูรายชื่อเฉพาะวิทยาเขตนี้
    </button>
    `;


  campusModal.classList.remove(
    "hidden"
  );


  const modalListButton =
    byId(
      "modalCampusListButton"
    );


  modalListButton.addEventListener(
    "click",
    function () {

      closeCampusDetail();


      filterCampus.value =
        campus;


      populateFilters();


      filterCampus.value =
        campus;


      renderSubmissions();

    }
  );

}


// ============================================================
// CLOSE CAMPUS MODAL
// ============================================================

function closeCampusDetail() {

  campusModal.classList.add(
    "hidden"
  );

}


closeCampusModal.addEventListener(
  "click",
  closeCampusDetail
);


campusModalBackdrop.addEventListener(
  "click",
  closeCampusDetail
);


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHtml(
    value
  );

}


// ============================================================
// SHOW DASHBOARD
// ============================================================

async function showDashboard(
  user
) {

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


// ============================================================
// INITIALIZE
// ============================================================

async function initializeApp() {

  console.log(
    "Initializing dashboard..."
  );


  const result =
    await client.auth.getSession();


  if (
    result.error
  ) {

    console.error(
      "Session error:",
      result.error
    );

  }


  const session =
    result.data.session;


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
