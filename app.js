// ============================================================
// SUPABASE
// ============================================================

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// ============================================================
// HELPER
// ============================================================

function byId(id) {
  return document.getElementById(id);
}


// ============================================================
// DOM
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

const kpiDuplicate =
  byId("kpiDuplicate");


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


const selectAllVisible =
  byId("selectAllVisible");

const selectedCount =
  byId("selectedCount");

const exportSelectedButton =
  byId("exportSelectedButton");


// CAMPUS MODAL

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


// VIDEO MODAL

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

let currentProject =
  "all";

let selectedIds =
  new Set();

let currentUserId =
  null;

// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    loginError.textContent =
      "";


    loginButton.disabled =
      true;


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


      loginButton.disabled =
        false;


      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;
    }


    await showDashboard(
      result.data.user
    );


    loginButton.disabled =
      false;


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


    selectedIds.clear();

    currentUserId =
      null;


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


  const results =
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
        .order(
          "name",
          {
            ascending: true
          }
        ),


      client
        .from("review_status")
        .select(`
          submission_id,
          user_id,
          watched,
          watched_at
        `)
        .eq(
          "user_id",
          currentUserId
        )

    ]);


  const submissionsResult =
    results[0];


  const reviewsResult =
    results[1];


  if (
    submissionsResult.error
  ) {

    console.error(
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
      reviewsResult.error
    );


    alert(
      "ไม่สามารถโหลดสถานะการตรวจได้"
    );


    return;
  }


  const reviewMap =
    new Map();


  (
    reviewsResult.data || []
  ).forEach(
    function (review) {

      reviewMap.set(
        review.submission_id,
        review
      );

    }
  );


  allSubmissions =
    (
      submissionsResult.data || []
    ).map(
      function (row) {

        const review =
          reviewMap.get(
            row.id
          );


        return {

          ...row,

          review:
            review || {
              watched: false,
              watched_at: null
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
// PROJECT
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


        selectedIds.clear();


        resetFilters();


        populateFilters();


        renderDashboard();

      }
    );

  }
);


// ============================================================
// PROJECT ROWS
// ============================================================

function getProjectRows() {

  if (
    currentProject ===
    "all"
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
// UNIQUE
// ============================================================

function getUniqueValues(
  rows,
  field
) {

  return [
    ...new Set(
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
              String(value)
                .trim() !== ""
            );

          }
        )
    )
  ]
    .sort(
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
// SELECT OPTIONS
// ============================================================

function populateSelect(
  element,
  values,
  firstLabel
) {

  const oldValue =
    element.value;


  element.innerHTML =
    "";


  const first =
    document.createElement(
      "option"
    );


  first.value =
    "";


  first.textContent =
    firstLabel;


  element.appendChild(
    first
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
      oldValue
    )
  ) {

    element.value =
      oldValue;

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


  let facultyRows =
    rows;


  if (
    filterCampus.value
  ) {

    facultyRows =
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
      facultyRows,
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
    row.review.watched
  ) {

    return "watched";

  }


  return "unwatched";

}


function getStatusBadge(row) {

  if (
    getStatus(row) ===
    "watched"
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


// ============================================================
// DASHBOARD
// ============================================================

function renderDashboard() {

  const rows =
    getProjectRows();


  renderKPIs(
    rows
  );


  renderCampusOverview(
    rows
  );


  renderSubmissions();


  updateSelectionUI();

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


  kpiWatched.textContent =
    watched;


  kpiUnwatched.textContent =
    rows.length -
    watched;


  const duplicates =
    rows.reduce(
      function (
        total,
        row
      ) {

        const count =
          Number(
            row.duplicate_count ||
            1
          );


        return (
          total +
          Math.max(
            count - 1,
            0
          )
        );

      },
      0
    );


  kpiDuplicate.textContent =
    duplicates;

}


// ============================================================
// CAMPUS
// ============================================================

function renderCampusOverview(
  rows
) {

  const groups =
    {};


  rows.forEach(
    function (row) {

      const campus =
        row.campus ||
        "ไม่ระบุ";


      if (
        !groups[campus]
      ) {

        groups[campus] =
          [];

      }


      groups[campus]
        .push(row);

    }
  );


  const campuses =
    Object.entries(
      groups
    )
      .sort(
        function (a, b) {

          return (
            b[1].length -
            a[1].length
          );

        }
      );


  campusList.innerHTML =
    "";


  campuses.forEach(
    function (entry) {

      const campus =
        entry[0];


      const rows =
        entry[1];


      const watched =
        rows.filter(
          function (row) {

            return (
              row.review &&
              row.review.watched
            );

          }
        ).length;


      const facultyCount =
        getUniqueValues(
          rows,
          "faculty"
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
              ${rows.length} คน
            </span>

            <span>
              ${facultyCount} คณะ
            </span>

          </div>


          <div class="campus-status">
            ดูแล้ว ${watched}/${rows.length}
          </div>

        </div>


        <div class="campus-buttons">

          <button
            type="button"
            class="mini-button campus-list-button"
            data-campus="${escapeAttribute(campus)}"
          >
            ดูรายชื่อ
          </button>


          <button
            type="button"
            class="mini-button secondary campus-detail-button"
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

  document
    .querySelectorAll(
      ".campus-list-button"
    )
    .forEach(
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


  document
    .querySelectorAll(
      ".campus-detail-button"
    )
    .forEach(
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
// FILTERED
// ============================================================

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


  if (
    year
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.year_level ===
            year
          );

        }
      );

  }


  if (
    campus
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.campus ===
            campus
          );

        }
      );

  }


  if (
    faculty
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            row.faculty ===
            faculty
          );

        }
      );

  }


  if (
    status
  ) {

    rows =
      rows.filter(
        function (row) {

          return (
            getStatus(row) ===
            status
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

          const text =
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


          return text.includes(
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
          colspan="8"
          class="empty-table"
        >
          ไม่พบข้อมูล
        </td>
      </tr>
      `;


    updateSelectionUI();


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


  attachRowEvents();


  updateSelectAllState();


  updateSelectionUI();

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


  if (
    row.review &&
    row.review.watched
  ) {

    tr.classList.add(
      "watched-row"
    );

  }


  const checked =
    selectedIds.has(
      row.id
    );


  tr.innerHTML =
    `
    <td>

      <input
        type="checkbox"
        class="row-checkbox"
        data-id="${row.id}"
        ${checked ? "checked" : ""}
      >

    </td>


    <td>

      <div class="submission-name">
        ${escapeHtml(
          row.name || "-"
        )}
      </div>

      ${
        row.duplicate_count > 1
          ? `
          <div class="duplicate-note">
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
      ${getStatusBadge(row)}
    </td>


    <td>

      ${
        row.video_url
          ? `
          <button
            type="button"
            class="video-button open-video-button"
            data-id="${row.id}"
          >
            ▶ ดูผลงาน
          </button>
          `
          : `
          <span class="no-video">
            ไม่มีลิงก์
          </span>
          `
      }

    </td>
    `;


  submissionTableBody
    .appendChild(
      tr
    );

}


// ============================================================
// MOBILE
// ============================================================

function renderMobileCard(row) {

  const card =
    document.createElement(
      "div"
    );


  card.className =
    "submission-card";


  if (
    row.review &&
    row.review.watched
  ) {

    card.classList.add(
      "watched-card"
    );

  }


  const checked =
    selectedIds.has(
      row.id
    );


  card.innerHTML =
    `
    <div class="mobile-top">

      <input
        type="checkbox"
        class="row-checkbox"
        data-id="${row.id}"
        ${checked ? "checked" : ""}
      >

      ${getStatusBadge(row)}

    </div>


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

      <span>
        ${
          row.duplicate_count > 1
            ? `ส่ง ${row.duplicate_count} ครั้ง`
            : ""
        }
      </span>


      ${
        row.video_url
          ? `
          <button
            type="button"
            class="video-button open-video-button"
            data-id="${row.id}"
          >
            ▶ ดูผลงาน
          </button>
          `
          : ""
      }

    </div>
    `;


  submissionCards
    .appendChild(
      card
    );

}


// ============================================================
// ROW EVENTS
// ============================================================

function attachRowEvents() {

  document
    .querySelectorAll(
      ".row-checkbox"
    )
    .forEach(
      function (checkbox) {

        checkbox.addEventListener(
          "change",
          function () {

            const id =
              checkbox.dataset.id;


            if (
              checkbox.checked
            ) {

              selectedIds.add(
                id
              );

            } else {

              selectedIds.delete(
                id
              );

            }


            syncSameCheckboxes(
              id,
              checkbox.checked
            );


            updateSelectAllState();


            updateSelectionUI();

          }
        );

      }
    );


  document
    .querySelectorAll(
      ".open-video-button"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            const row =
              allSubmissions.find(
                function (item) {

                  return (
                    item.id ===
                    button.dataset.id
                  );

                }
              );


            if (row) {

              openVideoModal(
                row
              );

            }

          }
        );

      }
    );

}


// ============================================================
// CHECKBOX
// ============================================================

function syncSameCheckboxes(
  id,
  checked
) {

  document
    .querySelectorAll(
      '.row-checkbox[data-id="' +
      id +
      '"]'
    )
    .forEach(
      function (box) {

        box.checked =
          checked;

      }
    );

}


selectAllVisible.addEventListener(
  "change",
  function () {

    const rows =
      getFilteredRows();


    rows.forEach(
      function (row) {

        if (
          selectAllVisible.checked
        ) {

          selectedIds.add(
            row.id
          );

        } else {

          selectedIds.delete(
            row.id
          );

        }

      }
    );


    renderSubmissions();

  }
);


function updateSelectAllState() {

  const rows =
    getFilteredRows();


  if (
    rows.length === 0
  ) {

    selectAllVisible.checked =
      false;


    selectAllVisible.indeterminate =
      false;


    return;
  }


  const selectedVisible =
    rows.filter(
      function (row) {

        return selectedIds.has(
          row.id
        );

      }
    ).length;


  selectAllVisible.checked =
    (
      selectedVisible ===
      rows.length
    );


  selectAllVisible.indeterminate =
    (
      selectedVisible > 0 &&
      selectedVisible <
      rows.length
    );

}


function updateSelectionUI() {

  selectedCount.textContent =
    selectedIds.size;


  exportSelectedButton.disabled =
    (
      selectedIds.size ===
      0
    );

}


// ============================================================
// EXPORT
// ============================================================

exportSelectedButton.addEventListener(
  "click",
  function () {

    const rows =
      allSubmissions.filter(
        function (row) {

          return selectedIds.has(
            row.id
          );

        }
      );


    if (
      rows.length === 0
    ) {

      return;
    }


    const csvRows =
      [

        [
          "โครงการ",
          "รหัสนักศึกษา",
          "ชื่อ-สกุล",
          "วิทยาเขต/วิทยาลัย",
          "คณะ",
          "หลักสูตร",
          "ชั้นปี",
          "เบอร์ติดต่อ",
          "Email",
          "สถานะการดู",
          "ลิงก์ผลงาน"
        ],


        ...rows.map(
          function (row) {

            return [

              row.project_name ||
              "",

              row.student_id ||
              "",

              row.name ||
              "",

              row.campus ||
              "",

              row.faculty ||
              "",

              row.program ||
              "",

              row.year_level ||
              "",

              row.phone ||
              "",

              row.email ||
              "",

              getStatus(row) ===
              "watched"
                ? "ดูแล้ว"
                : "ยังไม่ดู",

              row.video_url ||
              ""

            ];

          }
        )

      ];


    const csv =
      csvRows
        .map(
          function (row) {

            return row
              .map(
                csvEscape
              )
              .join(",");

          }
        )
        .join(
          "\r\n"
        );


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
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      "MBU_Problem_Followup_" +
      getDateString() +
      ".csv";


    document.body
      .appendChild(
        link
      );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );

  }
);


function csvEscape(value) {

  const text =
    String(
      value ?? ""
    );


  return (
    '"' +
    text.replaceAll(
      '"',
      '""'
    ) +
    '"'
  );

}


function getDateString() {

  const now =
    new Date();


  return (
    now.getFullYear() +
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    ) +
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    )
  );

}


// ============================================================
// VIDEO MODAL
// ============================================================

async function openVideoModal(
  row
) {

  reviewModalName.textContent =
    row.name ||
    "ผลงาน";


  reviewModalMeta.textContent =
    [
      row.project_name,
      row.campus,
      row.faculty,
      row.year_level
    ]
      .filter(Boolean)
      .join(
        " · "
      );


  reviewVideoFrame.src =
    convertToPreviewUrl(
      row.video_url
    );


  reviewOriginalLink.href =
    row.video_url ||
    "#";


  reviewCurrentStatus.innerHTML =
    getStatusBadge(
      row
    );


  reviewModal.classList.remove(
    "hidden"
  );


  if (
    !row.review ||
    !row.review.watched
  ) {

    await markAsWatched(
      row
    );

  }

}


// ============================================================
// MARK WATCHED
// ============================================================

async function markAsWatched(
  row
) {

  const now =
    new Date()
      .toISOString();


  const result =
    await client
      .from(
        "review_status"
      )
      .upsert(
        {
      
          submission_id:
            row.id,
      
          user_id:
            currentUserId,
      
          watched:
            true,
      
          watched_at:
            now,
      
          updated_at:
            now
      
        },
        {
          onConflict:
            "submission_id,user_id"
        }
      );


  if (
    result.error
  ) {

    console.error(
      "Mark watched error:",
      result.error
    );


    return;
  }


  row.review = {

    ...row.review,

    watched:
      true,

    watched_at:
      now

  };


  reviewCurrentStatus.innerHTML =
    getStatusBadge(
      row
    );


  renderDashboard();

}


// ============================================================
// DRIVE PREVIEW
// ============================================================

function convertToPreviewUrl(
  url
) {

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


// ============================================================
// CLOSE VIDEO
// ============================================================

function closeVideoModal() {

  reviewModal.classList.add(
    "hidden"
  );


  reviewVideoFrame.src =
    "";

}


closeReviewModal.addEventListener(
  "click",
  closeVideoModal
);


reviewModalBackdrop.addEventListener(
  "click",
  closeVideoModal
);


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
            row.campus ===
            campus
          );

        }
      );


  const facultyMap =
    {};


  const yearMap =
    {};


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


  campusModalTitle.textContent =
    campus;


  const faculties =
    Object.entries(
      facultyMap
    )
      .sort(
        function (a, b) {

          return (
            b[1] -
            a[1]
          );

        }
      );


  const years =
    Object.entries(
      yearMap
    )
      .sort();


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
          ยังไม่ดู
        </div>

        <div class="modal-stat-value">
          ${rows.length - watched}
        </div>

      </div>


    </div>



    <div class="detail-section">

      <h3>
        แยกตามคณะ
      </h3>

      ${
        faculties
          .map(
            function (
              entry
            ) {

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

      ${
        years
          .map(
            function (
              entry
            ) {

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


  byId(
    "modalCampusListButton"
  )
    .addEventListener(
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
// CAMPUS CLOSE
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
// RESET FILTER
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
// ESCAPE
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

 currentUserId =
 user.id;

  loginPage.classList.add(
    "hidden"
  );


  dashboardPage.classList.remove(
    "hidden"
  );


  userEmail.textContent =
    user.email ||
    "";


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
    await client.auth
      .getSession();


  if (
    result.error
  ) {

    console.error(
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
