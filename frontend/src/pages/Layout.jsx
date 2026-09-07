import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

// This wraps every route. Navbar renders exactly once, here,
// so no individual page needs to import or render <Navbar /> itself.
export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}