import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NoteDetails from "./pages/NoteDetails";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderSuccess from "./pages/OrderSuccess";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/notes" element={<Notes />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/note/:id" element={<NoteDetails />} />

        <Route path="/checkout/:id" element={<Checkout />}/>

        <Route path="/payment/:id" element={<Payment />} />

        <Route path="/order-success/:id" element={<OrderSuccess />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;