```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./pages/Layout";

import Home from "./pages/Home";
import Notes from "./pages/Notes";
import NoteCategory from "./pages/NoteCategory";
import NoteSubcategory from "./pages/NoteSubcategory";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";

import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
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
import About from "./pages/About";
import SearchResults from "./pages/SearchResults";

import TestAttempt from "./pages/TestAttempt";
import ProtectedRoute from "./pages/ProtectedRoute";

import Footer from "./components/Footer";

// ADMIN
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminCurrentAffairs from "./pages/admin/AdminCurrentAffairs";
import AdminComingSoon from "./pages/admin/AdminComingSoon";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            MAIN WEBSITE
            ================================================= */}

        <Route
          element={
            <>
              <Layout />
              <Footer />
            </>
          }
        >

          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* ================= NOTES ================= */}

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

          {/* ================= LOGIN / ACCOUNT ================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/account"
            element={<Account />}
          />

          {/* ================= CHECKOUT ================= */}

          <Route
            path="/checkout/:id"
            element={<Checkout />}
          />

          <Route
            path="/payment/:id"
            element={<Payment />}
          />

          <Route
            path="/order-success/:id"
            element={<OrderSuccess />}
          />

          {/* ================= ABOUT ================= */}

          <Route
            path="/about"
            element={<About />}
          />

          {/* ================= DASHBOARD ================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= MY RESULTS ================= */}

          <Route
            path="/my-results"
            element={
              <ProtectedRoute>
                <MyResults />
              </ProtectedRoute>
            }
          />

          {/* ================= LEADERBOARD ================= */}

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          {/* ================= CURRENT AFFAIRS ================= */}

          <Route
            path="/current-affairs"
            element={<CurrentAffairs />}
          />

          {/* ================= BLOG ================= */}

          <Route
            path="/blog"
            element={<Blog />}
          />

          {/* ================= FAQ ================= */}

          <Route
            path="/faq"
            element={<FAQ />}
          />

          {/* ================= CONTACT ================= */}

          <Route
            path="/contact"
            element={<ContactUs />}
          />

          {/* ================= SEARCH ================= */}

          <Route
            path="/search"
            element={<SearchResults />}
          />

          {/* =================================================
              TAKE A MOCK TEST
              ================================================= */}

          {/* Level 1 - Exam Groups */}

          <Route
            path="/take-mock-test"
            element={
              <ProtectedRoute>
                <ExamGroups />
              </ProtectedRoute>
            }
          />

          {/* Level 2 - Sub Exams */}

          <Route
            path="/take-mock-test/:topSlug"
            element={
              <ProtectedRoute>
                <SubExams />
              </ProtectedRoute>
            }
          />

          {/* Level 3 - Mock Tests */}

          <Route
            path="/take-mock-test/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <MockTests />
              </ProtectedRoute>
            }
          />

          {/* Actual Test Attempt */}

          <Route
            path="/mock-test/:testId"
            element={
              <ProtectedRoute>
                <TestAttempt />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              POPULAR EXAMS
              ================================================= */}

          {/* Popular Exam -> Sub Exam */}

          <Route
            path="/popular-exams/:topSlug"
            element={
              <ProtectedRoute>
                <PopularExamsSub />
              </ProtectedRoute>
            }
          />

          {/* Popular Exam -> Tests */}

          <Route
            path="/popular-exams/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <PopularExamsTests />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* =================================================
            ADMIN PANEL
            ================================================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* Admin Home */}

          <Route
            index
            element={<AdminHome />}
          />

          {/* Current Affairs */}

          <Route
            path="current-affairs"
            element={<AdminCurrentAffairs />}
          />

          {/* Blog */}

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

          {/* Contact Messages */}

          <Route
            path="contact-submissions"
            element={
              <AdminComingSoon section="Contact Us Messages" />
            }
          />

          {/* About */}

          <Route
            path="about"
            element={
              <AdminComingSoon section="About Page" />
            }
          />

          {/* Notes */}

          <Route
            path="notes"
            element={
              <AdminComingSoon section="Notes" />
            }
          />

          {/* Tests */}

          <Route
            path="tests"
            element={
              <AdminComingSoon section="Tests / Mock Tests" />
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
```
```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./pages/Layout";

import Home from "./pages/Home";
import Notes from "./pages/Notes";
import NoteCategory from "./pages/NoteCategory";
import NoteSubcategory from "./pages/NoteSubcategory";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";

import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
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
import About from "./pages/About";
import SearchResults from "./pages/SearchResults";

import TestAttempt from "./pages/TestAttempt";
import ProtectedRoute from "./pages/ProtectedRoute";

// ADMIN
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminCurrentAffairs from "./pages/admin/AdminCurrentAffairs";
import AdminComingSoon from "./pages/admin/AdminComingSoon";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            MAIN WEBSITE
            ================================================= */}

        <Route element={<Layout />}>

          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* ================= NOTES ================= */}

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

          {/* ================= LOGIN / ACCOUNT ================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/account"
            element={<Account />}
          />

          {/* ================= CHECKOUT ================= */}

          <Route
            path="/checkout/:id"
            element={<Checkout />}
          />

          <Route
            path="/payment/:id"
            element={<Payment />}
          />

          <Route
            path="/order-success/:id"
            element={<OrderSuccess />}
          />

          {/* ================= ABOUT ================= */}

          <Route
            path="/about"
            element={<About />}
          />

          {/* ================= DASHBOARD ================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= MY RESULTS ================= */}

          <Route
            path="/my-results"
            element={
              <ProtectedRoute>
                <MyResults />
              </ProtectedRoute>
            }
          />

          {/* ================= LEADERBOARD ================= */}

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          {/* ================= CURRENT AFFAIRS ================= */}

          <Route
            path="/current-affairs"
            element={<CurrentAffairs />}
          />

          {/* ================= BLOG ================= */}

          <Route
            path="/blog"
            element={<Blog />}
          />

          {/* ================= FAQ ================= */}

          <Route
            path="/faq"
            element={<FAQ />}
          />

          {/* ================= CONTACT ================= */}

          <Route
            path="/contact"
            element={<ContactUs />}
          />

          {/* ================= SEARCH ================= */}

          <Route
            path="/search"
            element={<SearchResults />}
          />

          {/* =================================================
              TAKE A MOCK TEST
              ================================================= */}

          {/* Level 1 - Exam Groups */}

          <Route
            path="/take-mock-test"
            element={
              <ProtectedRoute>
                <ExamGroups />
              </ProtectedRoute>
            }
          />

          {/* Level 2 - Sub Exams */}

          <Route
            path="/take-mock-test/:topSlug"
            element={
              <ProtectedRoute>
                <SubExams />
              </ProtectedRoute>
            }
          />

          {/* Level 3 - Mock Tests */}

          <Route
            path="/take-mock-test/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <MockTests />
              </ProtectedRoute>
            }
          />

          {/* Actual Test Attempt */}

          <Route
            path="/mock-test/:testId"
            element={
              <ProtectedRoute>
                <TestAttempt />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              POPULAR EXAMS
              ================================================= */}

          {/* Popular Exam -> Sub Exam */}

          <Route
            path="/popular-exams/:topSlug"
            element={
              <ProtectedRoute>
                <PopularExamsSub />
              </ProtectedRoute>
            }
          />

          {/* Popular Exam -> Tests */}

          <Route
            path="/popular-exams/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <PopularExamsTests />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* =================================================
            ADMIN PANEL
            ================================================= */}

        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* Admin Home */}

          <Route
            index
            element={<AdminHome />}
          />

          {/* Current Affairs */}

          <Route
            path="current-affairs"
            element={<AdminCurrentAffairs />}
          />

          {/* Blog */}

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

          {/* Contact Messages */}

          <Route
            path="contact-submissions"
            element={
              <AdminComingSoon section="Contact Us Messages" />
            }
          />

          {/* About */}

          <Route
            path="about"
            element={
              <AdminComingSoon section="About Page" />
            }
          />

          {/* Notes */}

          <Route
            path="notes"
            element={
              <AdminComingSoon section="Notes" />
            }
          />

          {/* Tests */}

          <Route
            path="tests"
            element={
              <AdminComingSoon section="Tests / Mock Tests" />
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
```
