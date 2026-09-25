const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ======================================================
// ELEMENTS
// ======================================================

const loginPage =
  document.getElementById("loginPage");

const dashboardPage =
  document.getElementById("dashboardPage");

const loginForm =
  document.getElementById("loginForm");

const loginButton =
  document.getElementById("loginButton");

const loginError =
  document.getElementById("loginError");

const logoutButton =
  document.getElementById("logoutButton");

const userEmail =
  document.getElementById("userEmail");


const kpiTotal =
  document.getElementById("kpiTotal");

const kpiCampus =
  document.getElementById("kpiCampus");

const kpiFaculty =
  document.getElementById("kpiFaculty");

const kpiDuplicate =
  document.getElementById("kpiDuplicate");


const campusList =
  document.getElementById("campusList");

const submissionTableBody =
  document.getElementById("submissionTableBody");

const submissionCards =
  document.getElementById("submissionCards");

const resultCount =
  document.getElementById("resultCount");

const submissionTitle =
  document.getElementById("submissionTitle");


const filterYear =
  document.getElementById("filterYear");

const filterCampus =
  document.getElementById("filterCampus");

const filterFaculty =
  document.getElementById("filterFaculty");

const filterStatus =
  document.getElementById("filterStatus");

const searchInput =
  document.getElementById("searchInput");

const clearFilters =
  document.getElementById("clearFilters");


const campusModal =
  document.getElementById("campusModal");

const campusModalTitle =
  document.getElementById("campusModalTitle");

const campusModalContent =
  document.getElementById("campusModalContent");

const closeCampusModal =
  document.getElementById("closeCampusModal");


// ======================================================
// STATE
// ======================================================

let allSubmissions = [];

let currentProject = "all";


// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginError.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent =
      "กำลังเข้าสู่ระบบ...";

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;

    const {
      data,
      error
    } =
      await client.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      loginError.textContent =
        "Email หรือ Password ไม่ถูกต้อง";

      loginButton.disabled = false;
      loginButton.textContent =
        "เข้าสู่ระบบ";

      return;
    }

    await showDashboard(data.user);

    loginButton.disabled = false;
    loginButton.textContent =
      "เข้าสู่ระบบ";
  }
);


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
  "click",
  async () => {

    await client.auth.signOut();

    dashboardPage.classList.add(
      "hidden"
    );

    loginPage.classList.remove(
      "hidden"
    );

    loginForm.reset();
  }
);


// ======================================================
// LOAD DATA
// ======================================================

async function loadSubmissions() {

  const {
    data,
    error
  } =
    await client
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
        video_url,
        duplicate_count,
        submitted_at
      `)
      .order("name", {
        ascending: true
      });


  if (error) {

    console.error(error);

    alert(
      "โหลดข้อมูลไม่สำเร็จ"
    );

    return;
  }


  allSubmissions =
    data || [];


  populateFilters();

  renderDashboard();
}


// ======================================================
// PROJECT FILTER
// ======================================================

document
  .querySelectorAll(".project-tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".project-tab")
          .forEach(tab =>
            tab.classList.remove("active")
          );

        button.classList.add(
          "active"
        );

        currentProject =
          button.dataset.project;

        resetFilters();

        renderDashboard();
      }
    );

  });


// ======================================================
// FILTER OPTIONS
// ======================================================

function populateFilters() {

  populateSelect(
    filterYear,
    uniqueValues(
      allSubmissions,
      "year_level"
    ),
    "ทุกชั้นปี"
  );

  populateSelect(
    filterCampus,
    uniqueValues(
      allSubmissions,
      "campus"
    ),
    "ทุกวิทยาเขต"
  );

  populateSelect(
    filterFaculty,
    uniqueValues(
      allSubmissions,
      "faculty"
    ),
    "ทุกคณะ"
  );
}


function uniqueValues(
  rows,
  field
) {

  return [
    ...new Set(
      rows
        .map(row => row[field])
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "th"
    )
  );
}


function populateSelect(
  element,
  values,
  firstLabel
) {

  element.innerHTML =
    `<option value="">${firstLabel}</option>`;

  values.forEach(value => {

    const option =
      document.createElement(
        "option"
      );

    option.value = value;
    option.textContent = value;

    element.appendChild(
      option
    );
  });
}


// ======================================================
// MAIN RENDER
// ======================================================

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


// ======================================================
// PROJECT ROWS
// ======================================================

function getProjectRows() {

  if (
    currentProject === "all"
  ) {
    return allSubmissions;
  }

  return allSubmissions.filter(
    row =>
      row.project_id ===
      currentProject
  );
}


// ======================================================
// KPI
// ======================================================

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

  const duplicateCount =
    rows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          (row.duplicate_count || 1) - 1,
          0
        ),
      0
    );

  kpiDuplicate.textContent =
    duplicateCount;
}


// ======================================================
// CAMPUS OVERVIEW
// ======================================================

function renderCampusOverview(
  rows
) {

  const grouped = {};


  rows.forEach(row => {

    const campus =
      row.campus ||
      "ไม่ระบุ";

    if (!grouped[campus]) {
      grouped[campus] = [];
    }

    grouped[campus].push(
      row
    );
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
      `<div class="empty-state">
        ไม่มีข้อมูล
      </div>`;

    return;
  }


  campuses.forEach(
    ([campus, campusRows]) => {

      const facultyCount =
        uniqueValues(
          campusRows,
          "faculty"
        ).length;


      const item =
        document.createElement(
          "div"
        );

      item.className =
        "campus-item";


      item.innerHTML = `
        <div class="campus-main">

          <div>

            <strong>
              ${escapeHtml(campus)}
            </strong>

            <span>
              ${campusRows.length} คน
              · ${facultyCount} คณะ
            </span>

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


      campusList.appendChild(
        item
      );
    }
  );


  document
    .querySelectorAll(
      ".campus-list-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          filterCampus.value =
            button.dataset.campus;

          renderSubmissions();

          document
            .querySelector(
              ".submissions-panel"
            )
            .scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

        }
      );

    });


  document
    .querySelectorAll(
      ".campus-detail-button"
    )
    .forEach(button => {

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


// ======================================================
// FILTERING
// ======================================================

function getFilteredRows() {

  let rows =
    getProjectRows();


  const year =
    filterYear.value;

  const campus =
    filterCampus.value;

  const faculty =
    filterFaculty.value;

  const search =
    searchInput
      .value
      .trim()
      .toLowerCase();


  if (year) {
    rows =
      rows.filter(
        row =>
          row.year_level === year
      );
  }


  if (campus) {
    rows =
      rows.filter(
        row =>
          row.campus === campus
      );
  }


  if (faculty) {
    rows =
      rows.filter(
        row =>
          row.faculty === faculty
      );
  }


  if (search) {

    rows =
      rows.filter(row => {

        const text = [
          row.name,
          row.student_id,
          row.campus,
          row.faculty,
          row.program
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(
          search
        );

      });
  }


  /*
    status filter จะเริ่มทำงาน
    ใน Step ถัดไป หลังเชื่อม review_status
  */


  return rows;
}


// ======================================================
// SUBMISSIONS
// ======================================================

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


  rows.forEach(row => {

    const duplicate =
      row.duplicate_count || 1;


    const tr =
      document.createElement(
        "tr"
      );


    tr.innerHTML = `
      <td>
        <strong>
          ${escapeHtml(row.name || "-")}
        </strong>
      </td>

      <td>
        ${escapeHtml(row.student_id || "-")}
      </td>

      <td>
        ${escapeHtml(row.campus || "-")}
      </td>

      <td>
        ${escapeHtml(row.faculty || "-")}
      </td>

      <td>
        ${escapeHtml(row.year_level || "-")}
      </td>

      <td>
        ${
          duplicate > 1
            ? `<span class="duplicate-badge">
                 ${duplicate} ครั้ง
               </span>`
            : "-"
        }
      </td>

      <td>
        ${
          row.video_url
            ? `
              <a
                class="video-link"
                href="${escapeAttribute(row.video_url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ดูผลงาน
              </a>
            `
            : "-"
        }
      </td>
    `;


    submissionTableBody.appendChild(
      tr
    );


    const card =
      document.createElement(
        "div"
      );

    card.className =
      "submission-card";


    card.innerHTML = `
      <div class="submission-card-name">
        ${escapeHtml(row.name || "-")}
      </div>

      <div class="submission-card-id">
        ${escapeHtml(row.student_id || "-")}
      </div>

      <div class="submission-card-meta">
        ${escapeHtml(row.campus || "-")}
      </div>

      <div class="submission-card-meta">
        ${escapeHtml(row.faculty || "-")}
        ·
        ${escapeHtml(row.year_level || "-")}
      </div>

      ${
        duplicate > 1
          ? `
            <div class="duplicate-badge mobile">
              ส่ง ${duplicate} ครั้ง
            </div>
          `
          : ""
      }

      ${
        row.video_url
          ? `
            <a
              class="video-link mobile-video-button"
              href="${escapeAttribute(row.video_url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ดูผลงาน
            </a>
          `
          : ""
      }
    `;


    submissionCards.appendChild(
      card
    );
  });


  if (!rows.length) {

    submissionTableBody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="empty-table"
        >
          ไม่พบข้อมูลตามตัวกรอง
        </td>
      </tr>
    `;

    submissionCards.innerHTML = `
      <div class="empty-state">
        ไม่พบข้อมูลตามตัวกรอง
      </div>
    `;
  }
}


// ======================================================
// CAMPUS DETAIL
// ======================================================

function showCampusDetail(
  campus
) {

  const rows =
    getProjectRows()
      .filter(
        row =>
          row.campus === campus
      );


  const facultyMap = {};


  rows.forEach(row => {

    const faculty =
      row.faculty ||
      "ไม่ระบุ";

    facultyMap[faculty] =
      (facultyMap[faculty] || 0) + 1;

  });


  const yearMap = {};


  rows.forEach(row => {

    const year =
      row.year_level ||
      "ไม่ระบุ";

    yearMap[year] =
      (yearMap[year] || 0) + 1;

  });


  campusModalTitle.textContent =
    campus;


  const faculties =
    Object.entries(facultyMap)
      .sort(
        (a, b) =>
          b[1] - a[1]
      );


  const years =
    Object.entries(yearMap)
      .sort();


  campusModalContent.innerHTML = `

    <div class="modal-stat-grid">

      <div class="modal-stat">
        <span>ผู้ส่งทั้งหมด</span>
        <strong>${rows.length}</strong>
      </div>

      <div class="modal-stat">
        <span>จำนวนคณะ</span>
        <strong>${faculties.length}</strong>
      </div>

      <div class="modal-stat">
        <span>จำนวนชั้นปี</span>
        <strong>${years.length}</strong>
      </div>

    </div>


    <div class="modal-section">

      <h4>
        แยกตามคณะ
      </h4>

      ${faculties
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

      ${years
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


  document
    .getElementById(
      "modalViewCampusList"
    )
    .addEventListener(
      "click",
      () => {

        filterCampus.value =
          campus;

        campusModal.classList.add(
          "hidden"
        );

        renderSubmissions();

        document
          .querySelector(
            ".submissions-panel"
          )
          .scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

      }
    );
}


// ======================================================
// FILTER EVENTS
// ======================================================

[
  filterYear,
  filterCampus,
  filterFaculty,
  filterStatus
].forEach(element => {

  element.addEventListener(
    "change",
    renderSubmissions
  );

});


searchInput.addEventListener(
  "input",
  renderSubmissions
);


clearFilters.addEventListener(
  "click",
  () => {

    resetFilters();

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


// ======================================================
// MODAL
// ======================================================

closeCampusModal.addEventListener(
  "click",
  () =>
    campusModal.classList.add(
      "hidden"
    )
);


campusModal.addEventListener(
  "click",
  event => {

    if (
      event.target.dataset
        .closeModal === "true"
    ) {

      campusModal.classList.add(
        "hidden"
      );
    }

  }
);


// ======================================================
// HELPERS
// ======================================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
  return escapeHtml(value);
}


// ======================================================
// SHOW DASHBOARD
// ======================================================

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

  await loadSubmissions();
}


// ======================================================
// INITIALIZE
// ======================================================

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
