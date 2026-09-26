import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Account from "./pages/Account";
import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

import ExamGroups from "./pages/ExamGroups";
import SubExams from "./pages/SubExams";
import MockTests from "./pages/MockTests";

import PopularExamsSub from "./pages/PopularExamsSub";
import PopularExamsTests from "./pages/PopularExamsTests";

import Dashboard from "./pages/Dashboard";
import MyResults from "./pages/MyResults";
import Leaderboard from "./pages/Leaderboard";

import CurrentAffairs from "./pages/CurrentAffairs";
import Blog from "./pages/Blog";
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

/* =========================
   ADMIN
========================= */

import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminCurrentAffairs from "./pages/admin/AdminCurrentAffairs";
import AdminComingSoon from "./pages/admin/AdminComingSoon";

import "./App.css";

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
            Navbar / Footer / Public Layout
        ================================================== */}

        <Route element={<Layout />}>

          {/* HOME */}

          <Route
            path="/"
            element={<Home />}
          />


          {/* NOTES */}

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


          {/* AUTH */}

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


          {/* CHECKOUT */}

          <Route
            path="/checkout/:id"
            element={<Checkout />}
          />


          {/* ORDER SUCCESS */}

          <Route
            path="/order-success/:id"
            element={<OrderSuccess />}
          />


          {/* ABOUT */}

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


          {/* LEADERBOARD */}

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />


          {/* CURRENT AFFAIRS */}

          <Route
            path="/current-affairs"
            element={<CurrentAffairs />}
          />


          {/* BLOG */}

          <Route
            path="/blog"
            element={<Blog />}
          />


          {/* FAQ */}

          <Route
            path="/faq"
            element={<FAQ />}
          />


          {/* CONTACT */}

          <Route
            path="/contact"
            element={<ContactUs />}
          />


          {/* SEARCH */}

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
                <MockTests />
              </ProtectedRoute>
            }
          />


          {/* ACTUAL TEST ATTEMPT */}

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
            element={
              <ProtectedRoute>
                <PopularExamsSub />
              </ProtectedRoute>
            }
          />

          <Route
            path="/popular-exams/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <PopularExamsTests />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* ==================================================
            ADMIN PANEL
            IMPORTANT:
            PUBLIC <Layout /> KE BAHAR HAI
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


          {/* NOTES */}

          <Route
            path="notes"
            element={
              <AdminComingSoon section="Notes" />
            }
          />


          {/* TESTS */}

          <Route
            path="tests"
            element={
              <AdminComingSoon section="Tests / Mock Tests" />
            }
          />


          {/* CURRENT AFFAIRS */}

          <Route
            path="current-affairs"
            element={<AdminCurrentAffairs />}
          />


          {/* BLOG */}

          <Route
            path="blog"
            element={
              <AdminComingSoon section="Blog" />
            }
          />


          {/* FAQ */}

          <Route
            path="faq"
            element={
              <AdminComingSoon section="FAQ" />
            }
          />


          {/* USERS */}

          <Route
            path="users"
            element={
              <AdminComingSoon section="Users" />
            }
          />


          {/* ORDERS */}

          <Route
            path="orders"
            element={
              <AdminComingSoon section="Orders" />
            }
          />


          {/* CONTACT MESSAGES */}

          <Route
            path="contact-submissions"
            element={
              <AdminComingSoon section="Contact Messages" />
            }
          />


          {/* PAGES */}

          <Route
            path="about"
            element={
              <AdminComingSoon section="Pages" />
            }
          />


          {/* SETTINGS */}

          <Route
            path="settings"
            element={
              <AdminComingSoon section="Settings" />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;