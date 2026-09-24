```jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// This wraps every main website route.
// Navbar renders once at the top.
// Footer renders once at the bottom.
// Individual pages do not need to import Navbar or Footer.
export default function Layout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
```
