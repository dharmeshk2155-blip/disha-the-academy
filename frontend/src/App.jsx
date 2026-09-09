import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";
import ExamGroups from "./pages/ExamGroups";
import ExamDetail from "./pages/ExamDetail";
import MockTests from "./pages/MockTests";
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
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Every route below renders inside Layout, which shows the
            sidebar Navbar exactly once. No page needs its own <Navbar />. */}
        <Route element={<Layout />}>

          {/* HOME */}
          <Route path="/" element={<Home />} />

          {/* NOTES */}
          <Route path="/notes" element={<Notes />} />

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* REGISTER */}
          <Route path="/register" element={<Register />} />

          {/* ACCOUNT */}
          <Route path="/account" element={<Account />} />

          {/* NOTE DETAILS */}
          <Route path="/note/:id" element={<NoteDetails />} />

          {/* CHECKOUT */}
          <Route path="/checkout/:id" element={<Checkout />} />

          {/* PAYMENT */}
          <Route path="/payment/:id" element={<Payment />} />

          {/* ORDER SUCCESS */}
          <Route path="/order-success/:id" element={<OrderSuccess />} />

          {/* DASHBOARD (LOGIN REQUIRED) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* MY RESULTS (LOGIN REQUIRED) */}
          <Route
            path="/my-results"
            element={
              <ProtectedRoute>
                <MyResults />
              </ProtectedRoute>
            }
          />

          {/* LEADERBOARD */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* CURRENT AFFAIRS */}
          <Route path="/current-affairs" element={<CurrentAffairs />} />

          {/* BLOG */}
          <Route path="/blog" element={<Blog />} />

          {/* FAQ */}
          <Route path="/faq" element={<FAQ />} />

          {/* CONTACT US */}
          <Route path="/contact" element={<ContactUs />} />

          {/* SEARCH */}
          <Route path="/search" element={<SearchResults />} />

          {/* TAKE A MOCK TEST - level 1: flat list of all exams (category step skipped) */}
          <Route
            path="/take-mock-test"
            element={
              <ProtectedRoute>
                <ExamGroups />
              </ProtectedRoute>
            }
          />

          {/* TAKE A MOCK TEST - level 2: exam detail page (sections) */}
          <Route
            path="/take-mock-test/:topSlug/:subSlug"
            element={
              <ProtectedRoute>
                <ExamDetail />
              </ProtectedRoute>
            }
          />

          {/* TAKE A MOCK TEST - level 3: actual mock tests within a section */}
          <Route
            path="/take-mock-test/:topSlug/:subSlug/:section"
            element={
              <ProtectedRoute>
                <MockTests />
              </ProtectedRoute>
            }
          />

          {/* MOCK TEST ATTEMPT - actual test taking page (LOGIN REQUIRED) */}
          <Route
            path="/mock-test/:testId"
            element={
              <ProtectedRoute>
                <TestAttempt />
              </ProtectedRoute>
            }
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;