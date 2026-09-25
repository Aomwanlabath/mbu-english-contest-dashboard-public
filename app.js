<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>MBU English Contest Dashboard</title>

  <link
    rel="stylesheet"
    href="style.css?v=20260926-2"
  >
</head>

<body>

  <!-- =========================
       LOGIN
  ========================== -->

  <section id="loginPage" class="login-page">

    <div class="login-card">

      <div class="logo-circle">MBU</div>

      <h1>English Contest Dashboard</h1>

      <p class="login-description">
        ระบบติดตามผลงานโครงการประกวดคลิปภาษาอังกฤษ
      </p>

      <form id="loginForm">

        <label>Email</label>

        <input
          id="email"
          type="email"
          placeholder="name@example.com"
          autocomplete="email"
          required
        >

        <label>Password</label>

        <input
          id="password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        >

        <button
          type="submit"
          id="loginButton"
        >
          เข้าสู่ระบบ
        </button>

        <div
          id="loginError"
          class="error-message"
        ></div>

      </form>

    </div>

  </section>


  <!-- =========================
       DASHBOARD
  ========================== -->

  <section
    id="dashboardPage"
    class="dashboard-page hidden"
  >

    <header class="topbar">

      <div>

        <div class="eyebrow">
          MBU ENGLISH CONTEST
        </div>

        <h2>
          Executive Dashboard
        </h2>

      </div>

      <div class="topbar-right">

        <span id="userEmail"></span>

        <button
          id="logoutButton"
          class="secondary-button"
        >
          ออกจากระบบ
        </button>

      </div>

    </header>


    <main class="dashboard-shell">

      <!-- =========================
           PROJECT SWITCHER
      ========================== -->

      <section class="project-switcher">

        <button
          class="project-tab active"
          data-project="all"
        >
          ทั้งหมด
        </button>

        <button
          class="project-tab"
          data-project="campus-pride"
        >
          Project 01
        </button>

        <button
          class="project-tab"
          data-project="my-life-mbu"
        >
          Project 02
        </button>

      </section>


      <!-- =========================
           KPI
      ========================== -->

      <section class="kpi-grid">

        <div class="kpi-card">
          <span>ผู้ส่งผลงาน</span>
          <strong id="kpiTotal">0</strong>
        </div>

        <div class="kpi-card">
          <span>วิทยาเขต / วิทยาลัย</span>
          <strong id="kpiCampus">0</strong>
        </div>

        <div class="kpi-card">
          <span>คณะ</span>
          <strong id="kpiFaculty">0</strong>
        </div>

        <div class="kpi-card success">
          <span>ดูแล้ว</span>
          <strong id="kpiWatched">0</strong>
        </div>

        <div class="kpi-card pending">
          <span>ยังไม่ดู</span>
          <strong id="kpiUnwatched">0</strong>
        </div>

        <div class="kpi-card problem">
          <span>มีปัญหา</span>
          <strong id="kpiProblem">0</strong>
        </div>

      </section>


      <!-- =========================
           MAIN
      ========================== -->

      <section class="main-grid">

        <!-- CAMPUS -->

        <div class="panel campus-panel">

          <div class="panel-header">

            <div class="panel-kicker">
              OVERVIEW
            </div>

            <h3>
              ผู้ส่งผลงานแยกตามวิทยาเขต / วิทยาลัย
            </h3>

          </div>

          <div
            id="campusList"
            class="campus-list"
          ></div>

        </div>


        <!-- SUBMISSION -->

        <div class="panel submissions-panel">

          <div class="panel-header submissions-header">

            <div>

              <div class="panel-kicker">
                SUBMISSIONS
              </div>

              <h3 id="submissionTitle">
                รายชื่อผู้ส่งผลงานทั้งหมด
              </h3>

            </div>

            <div
              id="resultCount"
              class="result-count"
            >
              0 รายการ
            </div>

          </div>


          <!-- FILTER -->

          <div class="filter-bar">

            <select id="filterYear">
              <option value="">
                ทุกชั้นปี
              </option>
            </select>

            <select id="filterCampus">
              <option value="">
                ทุกวิทยาเขต
              </option>
            </select>

            <select id="filterFaculty">
              <option value="">
                ทุกคณะ
              </option>
            </select>

            <select id="filterStatus">

              <option value="">
                ทุกสถานะ
              </option>

              <option value="unwatched">
                ยังไม่ดู
              </option>

              <option value="watched">
                ดูแล้ว
              </option>

              <option value="problem">
                มีปัญหา
              </option>

            </select>

            <input
              id="searchInput"
              type="search"
              placeholder="ค้นหาชื่อ / รหัสนักศึกษา..."
            >

            <button
              id="clearFilters"
              class="secondary-button"
            >
              ล้างตัวกรอง
            </button>

          </div>


          <!-- BULK -->

          <div class="bulk-toolbar">

            <div>
              เลือกแล้ว
              <strong id="selectedCount">
                0
              </strong>
              รายการ
            </div>

            <button
              id="exportSelectedButton"
              class="export-button"
              disabled
            >
              Export รายการที่เลือก
            </button>

          </div>


          <!-- TABLE -->

          <div class="table-wrap">

            <table>

              <thead>

                <tr>

                  <th class="checkbox-column">
                    <input
                      id="selectAllVisible"
                      type="checkbox"
                    >
                  </th>

                  <th>ชื่อ</th>

                  <th>รหัสนักศึกษา</th>

                  <th>วิทยาเขต</th>

                  <th>คณะ</th>

                  <th>ชั้นปี</th>

                  <th>สถานะ</th>

                  <th>ผลงาน</th>

                </tr>

              </thead>

              <tbody
                id="submissionTableBody"
              ></tbody>

            </table>

          </div>


          <!-- MOBILE -->

          <div
            id="submissionCards"
            class="submission-cards"
          ></div>

        </div>

      </section>

    </main>

  </section>


  <!-- =========================
       CAMPUS DETAIL MODAL
  ========================== -->

  <div
    id="campusModal"
    class="modal hidden"
  >

    <div
      class="modal-backdrop"
      data-close-campus-modal="true"
    ></div>

    <div class="modal-card">

      <div class="modal-header">

        <div>

          <div class="panel-kicker">
            CAMPUS DETAIL
          </div>

          <h3 id="campusModalTitle">
            รายละเอียดวิทยาเขต
          </h3>

        </div>

        <button
          id="closeCampusModal"
          class="icon-button"
        >
          ×
        </button>

      </div>

      <div
        id="campusModalContent"
        class="modal-content"
      ></div>

    </div>

  </div>


  <!-- =========================
       REVIEW MODAL
  ========================== -->

  <div
    id="reviewModal"
    class="modal hidden"
  >

    <div
      class="modal-backdrop"
      data-close-review-modal="true"
    ></div>

    <div class="review-modal-card">

      <div class="modal-header">

        <div>

          <div class="panel-kicker">
            VIDEO REVIEW
          </div>

          <h3 id="reviewModalName">
            ผลงาน
          </h3>

          <div
            id="reviewModalMeta"
            class="review-modal-meta"
          ></div>

        </div>

        <button
          id="closeReviewModal"
          class="icon-button"
        >
          ×
        </button>

      </div>


      <div class="review-layout">

        <!-- VIDEO -->

        <div class="video-area">

          <iframe
            id="videoFrame"
            title="Video submission"
            allow="autoplay; fullscreen"
            allowfullscreen
          ></iframe>

          <a
            id="openOriginalVideo"
            class="secondary-button original-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            เปิดลิงก์ต้นฉบับ
          </a>

        </div>


        <!-- REVIEW -->

        <div class="review-sidebar">

          <div class="review-status-box">

            <div class="status-label">
              สถานะการตรวจ
            </div>

            <div
              id="currentReviewStatus"
            ></div>

          </div>


          <label class="problem-check">

            <input
              id="hasProblem"
              type="checkbox"
            >

            ผลงานนี้มีปัญหา

          </label>


          <label>
            ประเภทปัญหา
          </label>

          <select id="problemType">

            <option value="">
              เลือกประเภทปัญหา
            </option>

            <option value="เปิดลิงก์ไม่ได้">
              เปิดลิงก์ไม่ได้
            </option>

            <option value="ไม่มีสิทธิ์เข้าถึง">
              ไม่มีสิทธิ์เข้าถึง
            </option>

            <option value="ส่งไฟล์ผิด">
              ส่งไฟล์ผิด
            </option>

            <option value="ข้อมูลไม่ครบ">
              ข้อมูลไม่ครบ
            </option>

            <option value="ไฟล์มีปัญหา">
              ไฟล์มีปัญหา
            </option>

            <option value="อื่นๆ">
              อื่นๆ
            </option>

          </select>


          <label>
            หมายเหตุ
          </label>

          <textarea
            id="reviewNote"
            rows="6"
            placeholder="ระบุรายละเอียดสำหรับใช้ประสานงาน..."
          ></textarea>


          <button
            id="saveReviewButton"
            class="primary-button full-width"
          >
            บันทึก
          </button>

          <div
            id="reviewSaveMessage"
            class="save-message"
          ></div>

        </div>

      </div>

    </div>

  </div>


  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <script src="config.js?v=20260926-2"></script>
  <script src="app.js?v=20260926-2"></script>

</body>
</html>
