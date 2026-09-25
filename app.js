const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


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

const recordCount =
  document.getElementById("recordCount");

const project1Count =
  document.getElementById("project1Count");

const project2Count =
  document.getElementById("project2Count");


/* ==========================================
   LOGIN
========================================== */

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

    await showDashboard(
      data.user
    );

    loginButton.disabled = false;
    loginButton.textContent =
      "เข้าสู่ระบบ";
  }
);


/* ==========================================
   LOGOUT
========================================== */

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


/* ==========================================
   DASHBOARD
========================================== */

async function showDashboard(user) {

  loginPage.classList.add(
    "hidden"
  );

  dashboardPage.classList.remove(
    "hidden"
  );

  userEmail.textContent =
    user.email || "";


  const {
    data,
    error
  } =
    await client
      .from("submissions")
      .select(
        "project_id,student_id"
      );


  if (error) {

    console.error(error);

    recordCount.textContent =
      "โหลดข้อมูลไม่สำเร็จ";

    return;
  }


  const project1 =
    data.filter(
      row =>
        row.project_id ===
        "campus-pride"
    );


  const project2 =
    data.filter(
      row =>
        row.project_id ===
        "my-life-mbu"
    );


  recordCount.textContent =
    `พบผู้ส่งผลงานทั้งหมด ${data.length} คน`;

  project1Count.textContent =
    project1.length;

  project2Count.textContent =
    project2.length;
}


/* ==========================================
   CHECK EXISTING SESSION
========================================== */

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
