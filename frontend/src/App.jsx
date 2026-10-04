import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Account from "./pages/Account";
import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import Pricing from "./pages/Pricing";
import OrderSuccess from "./pages/OrderSuccess";
import ExamGroups from "./pages/ExamGroups";
import SubExams from "./pages/SubExams";
import MockTests from "./pages/MockTests";
import ExamPage from "./pages/ExamPage";
import AllTests from "./pages/AllTests";
import FreeTests from "./pages/FreeTests";
import FreeExamTests from "./pages/FreeExamTests";
import FreeTestAttempt from "./pages/FreeTestAttempt";
import Dashboard from "./pages/Dashboard";
import MyResults from "./pages/MyResults";
import Leaderboard from "./pages/Leaderboard";
import CurrentAffairs from "./pages/CurrentAffairs";
import CurrentAffairDetails from "./pages/CurrentAffairDetails";
import Blog from "./pages/Blog";
import BlogDetails from "./pages/BlogDetails";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";
import SearchResults from "./pages/SearchResults";
import TestAttempt from "./pages/TestAttempt";
import ProtectedRoute from "./pages/ProtectedRoute";
import About from "./pages/About";
import NoteCategory from "./pages/NoteCategory";
import NoteSubcategory from "./pages/NoteSubcategory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import MaintenanceGuard from "./pages/MaintenanceGuard";
import ReadNote from "./pages/ReadNote";

/* =========================
   ADMIN
========================= */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminFreeTests from "./pages/admin/AdminFreeTests";
import AdminFreeQuestions from "./pages/admin/AdminFreeQuestions";
import AdminTests from "./pages/admin/AdminTests";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminCurrentAffairs from "./pages/admin/AdminCurrentAffairs";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminContactSubmissions from "./pages/admin/AdminContactSubmissions";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminSettings from "./pages/admin/AdminSettings";
import "./App.css";

/*
  Popular Exams used to have its own copy of the pages. Both Home rows now
  use the main flow, so old /popular-exams/... addresses (bookmarks, old
  links) are sent to the same place in the main flow.
*/
function PopularExamsRedirect() {
  const { topSlug, subSlug } = useParams();

  return (
    <Navigate
      to={
        subSlug
          ? `/take-mock-test/${topSlug}/${subSlug}`
          : `/take-mock-test/${topSlug}`
      }
      replace
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            STANDALONE LEGAL PAGES
        ================================================== */}
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms"
          element={<TermsConditions />}
        />
        <Route
          path="/refund-policy"
          element={<RefundPolicy />}
        />

        {/* ==================================================
            PUBLIC WEBSITE
            Navbar + Footer + Public Layout
        ================================================== */}
       <Route element={<MaintenanceGuard />}>
  <Route element={<Layout />}>
          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* ==================================================
              NOTES
          ================================================== */}
          <Route
            path="/notes"
            element={<Notes />}
          />
          <Route
            path="/notes/:categorySlug"
            element={<NoteCategory />}
          />
          <Route
            path="/notes/:categorySlug/:subcategorySlug"
            element={<NoteSubcategory />}
          />
          <Route
            path="/note/:id"
            element={<NoteDetails />}
          />
          <Route
            path="/pricing"
            element={<Pricing />}
          />
          <Route
  path="/read-note/:id"
  element={<ReadNote />}
/>
<Route path="/free-tests" element={<FreeTests />} />
<Route
  path="/free-tests/:categoryId/:examId"
  element={<FreeExamTests />}
/>
<Route
  path="/free-tests/attempt/:testId"
  element={<FreeTestAttempt />}
/>

          {/* ==================================================
              AUTH
          ================================================== */}
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/register"
            element={<Register />}
          />
          <Route
            path="/account"
            element={<Account />}
          />

          {/* ==================================================
              CHECKOUT
          ================================================== */}
          <Route
            path="/checkout/:id"
            element={<Checkout />}
          />

          {/* ==================================================
              ORDER SUCCESS
          ================================================== */}
          <Route
            path="/order-success/:id"
            element={<OrderSuccess />}
          />

          {/* ==================================================
              ABOUT
          ================================================== */}
          <Route
            path="/about"
            element={<About />}
          />

          {/* ==================================================
              USER DASHBOARD
          ================================================== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* MY RESULTS */}
          <Route
            path="/my-results"
            element={
              <ProtectedRoute>
                <MyResults />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              LEADERBOARD
          ================================================== */}
          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          {/* ==================================================
              CURRENT AFFAIRS
          ================================================== */}
          <Route
            path="/current-affairs"
            element={<CurrentAffairs />}
          />
          <Route
            path="/current-affairs/:id"
            element={<CurrentAffairDetails />}
          />

          {/* ==================================================
              BLOG
          ================================================== */}
          <Route
            path="/blog"
            element={<Blog />}
          />
          <Route
            path="/blog/:id"
            element={<BlogDetails />}
          />

          {/* ==================================================
              FAQ
          ================================================== */}
          <Route
            path="/faq"
            element={<FAQ />}
          />

          {/* ==================================================
              CONTACT
          ================================================== */}
          <Route
            path="/contact"
            element={<ContactUs />}
          />

          {/* ==================================================
              SEARCH
          ================================================== */}
          <Route
            path="/search"
            element={<SearchResults />}
          />

          {/* ==================================================
              TAKE A MOCK TEST
          ================================================== */}
          <Route
            path="/take-mock-test"
            element={
              <ProtectedRoute>
                <ExamGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/take-mock-test/:topSlug"
            element={
              <ProtectedRoute>
                <SubExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/take-mock-test/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />

          {/* Test list: one exam + one test type */}
          <Route
            path="/take-mock-test/:topSlug/:subSlug/:typeSlug"
            element={
              <ProtectedRoute>
                <MockTests />
              </ProtectedRoute>
            }
          />

          {/* Quick access: all / recently added tests + search + filters */}
          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <AllTests />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              ACTUAL TEST ATTEMPT
          ================================================== */}
          <Route
            path="/mock-test/:testId"
            element={
              <ProtectedRoute>
                <TestAttempt />
              </ProtectedRoute>
            }
          />

          {/* ==================================================
              POPULAR EXAMS
              Independent from Take a Mock Test
          ================================================== */}
          <Route
            path="/popular-exams/:topSlug"
            element={<PopularExamsRedirect />}
          />
          <Route
            path="/popular-exams/:topSlug/:subSlug"
            element={<PopularExamsRedirect />}
          />
        </Route>
        </Route>

        {/* ==================================================
            ADMIN PANEL
            Public Layout ke bahar
        ================================================== */}
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          {/* ADMIN DASHBOARD */}
          <Route
            index
            element={<AdminHome />}
          />

          {/* ==================================================
              NOTES
          ================================================== */}
        <Route
  path="notes"
  element={<AdminNotes />}
/>

          {/* ==================================================
              TESTS
          ================================================== */}
          <Route
            path="tests"
            element={<AdminTests />}
          />
          <Route
            path="tests/:testId/questions"
            element={<AdminQuestions />}
          />

          {/* ==================================================
              FREE TESTS
          ================================================== */}
          <Route
            path="free-tests"
            element={<AdminFreeTests />}
          />
          <Route
            path="free-tests/:testId/questions"
            element={<AdminFreeQuestions />}
          />

          {/* ==================================================
              CURRENT AFFAIRS
          ================================================== */}
          <Route
            path="current-affairs"
            element={<AdminCurrentAffairs />}
          />

          {/* ==================================================
              BLOG
          ================================================== */}
          <Route
            path="blog"
            element={<AdminBlog />}
          />

          {/* ==================================================
              FAQ
          ================================================== */}
          <Route
            path="faq"
            element={<AdminFAQ />}
          />

          {/* ==================================================
              USERS
          ================================================== */}
          <Route
            path="users"
            element={<AdminUsers />}
          />

          {/* ==================================================
              ORDERS
          ================================================== */}
          <Route
            path="orders"
            element={<AdminOrders />}
          />

          {/* ==================================================
              CONTACT MESSAGES
          ================================================== */}
          <Route
            path="contact-submissions"
            element={<AdminContactSubmissions />}
          />

          {/* ==================================================
              PAGES
          ================================================== */}
<Route path="about" element={<AdminAbout />} />

          {/* ==================================================
              SETTINGS
          ================================================== */}
         <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;