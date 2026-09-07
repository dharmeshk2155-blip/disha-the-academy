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
import ExamCategories from "./pages/ExamCategories";
import MockTests from "./pages/MockTests";
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

          {/* TAKE A MOCK TEST - step 1: exam categories (LOGIN REQUIRED) */}
          <Route
            path="/take-mock-test"
            element={
              <ProtectedRoute>
                <ExamCategories />
              </ProtectedRoute>
            }
          />

          {/* TAKE A MOCK TEST - step 2: tests inside a category (LOGIN REQUIRED) */}
          <Route
            path="/take-mock-test/:category"
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