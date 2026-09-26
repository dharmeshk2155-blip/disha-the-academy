import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  IndianRupee,
  Plus,
  Newspaper,
  PenLine,
  ArrowRight,
  TrendingUp,
  CircleCheck,
  Clock3,
} from "lucide-react";

import "./AdminLayout.css";

export default function AdminHome() {
  return (
    <div className="admin-dashboard">

      {/* =====================================
          WELCOME
      ====================================== */}

      <section className="admin-dashboard-welcome">

        <div>
          <span className="admin-dashboard-eyebrow">
            OVERVIEW
          </span>

          <h2>
            Welcome back, Admin
          </h2>

          <p>
            Manage Disha The Academy from one place.
          </p>
        </div>

        <Link
          to="/"
          target="_blank"
          className="admin-dashboard-site-button"
        >
          View Website
          <ArrowRight size={16} />
        </Link>

      </section>


      {/* =====================================
          STAT CARDS
      ====================================== */}

      <section className="admin-stats-grid">

        {/* USERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <Users size={21} />
            </div>

            <span className="admin-stat-badge">
              <TrendingUp size={12} />
              Users
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Users
            </span>

            <strong>
              —
            </strong>

            <small>
              Registered accounts
            </small>

          </div>

        </div>


        {/* NOTES */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <BookOpen size={21} />
            </div>

            <span className="admin-stat-badge">
              Content
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Notes
            </span>

            <strong>
              —
            </strong>

            <small>
              Published study notes
            </small>

          </div>

        </div>


        {/* TESTS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <ClipboardList size={21} />
            </div>

            <span className="admin-stat-badge">
              Exams
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Mock Tests
            </span>

            <strong>
              —
            </strong>

            <small>
              Available tests
            </small>

          </div>

        </div>


        {/* ORDERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <ShoppingBag size={21} />
            </div>

            <span className="admin-stat-badge">
              Sales
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Paid Orders
            </span>

            <strong>
              —
            </strong>

            <small>
              Successful purchases
            </small>

          </div>

        </div>


        {/* REVENUE */}

        <div className="admin-stat-card admin-stat-revenue">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <IndianRupee size={21} />
            </div>

            <span className="admin-stat-badge">
              Revenue
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Revenue
            </span>

            <strong>
              ₹—
            </strong>

            <small>
              From paid orders
            </small>

          </div>

        </div>

      </section>


      {/* =====================================
          DASHBOARD BODY
      ====================================== */}

      <section className="admin-dashboard-grid">

        {/* RECENT ORDERS */}

        <div className="admin-panel admin-recent-orders">

          <div className="admin-panel-header">

            <div>
              <h3>
                Recent Orders
              </h3>

              <p>
                Latest purchases from students
              </p>
            </div>

            <Link to="/admin/orders">
              View all
              <ArrowRight size={14} />
            </Link>

          </div>


          <div className="admin-empty-state">

            <div className="admin-empty-icon">
              <ShoppingBag size={25} />
            </div>

            <strong>
              Orders will appear here
            </strong>

            <p>
              Recent paid orders will be shown once
              dashboard data is connected.
            </p>

          </div>

        </div>


        {/* QUICK ACTIONS */}

        <div className="admin-panel admin-quick-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used controls
              </p>
            </div>

          </div>


          <div className="admin-quick-actions">

            <Link
              to="/admin/notes"
              className="admin-quick-action"
            >
              <span className="admin-quick-icon">
                <Plus size={18} />
              </span>

              <span>
                <strong>
                  Add Note
                </strong>

                <small>
                  Upload study material
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>


            <Link
              to="/admin/tests"
              className="admin-quick-action"
            >
              <span className="admin-quick-icon">
                <ClipboardList size={18} />
              </span>

              <span>
                <strong>
                  Create Test
                </strong>

                <small>
                  Add mock test
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>


            <Link
              to="/admin/current-affairs"
              className="admin-quick-action"
            >
              <span className="admin-quick-icon">
                <Newspaper size={18} />
              </span>

              <span>
                <strong>
                  Current Affairs
                </strong>

                <small>
                  Publish new update
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>


            <Link
              to="/admin/blog"
              className="admin-quick-action"
            >
              <span className="admin-quick-icon">
                <PenLine size={18} />
              </span>

              <span>
                <strong>
                  Write Blog
                </strong>

                <small>
                  Create new article
                </small>
              </span>

              <ArrowRight size={16} />
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================
          BOTTOM SECTION
      ====================================== */}

      <section className="admin-bottom-grid">

        {/* CONTENT MANAGEMENT */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                Content Management
              </h3>

              <p>
                Manage your learning platform
              </p>
            </div>

          </div>


          <div className="admin-content-links">

            <Link to="/admin/notes">

              <div className="admin-content-link-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <strong>
                  Notes
                </strong>

                <small>
                  Study material & PDFs
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>


            <Link to="/admin/tests">

              <div className="admin-content-link-icon">
                <ClipboardList size={19} />
              </div>

              <div>
                <strong>
                  Mock Tests
                </strong>

                <small>
                  Tests & questions
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>


            <Link to="/admin/current-affairs">

              <div className="admin-content-link-icon">
                <Newspaper size={19} />
              </div>

              <div>
                <strong>
                  Current Affairs
                </strong>

                <small>
                  Daily exam updates
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>

          </div>

        </div>


        {/* SYSTEM STATUS */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                System Status
              </h3>

              <p>
                Platform overview
              </p>
            </div>

          </div>


          <div className="admin-system-list">

            <div>
              <span>
                <CircleCheck size={17} />
                Website
              </span>

              <strong className="admin-system-online">
                Online
              </strong>
            </div>


            <div>
              <span>
                <CircleCheck size={17} />
                Admin Panel
              </span>

              <strong className="admin-system-online">
                Active
              </strong>
            </div>


            <div>
              <span>
                <Clock3 size={17} />
                Dashboard Data
              </span>

              <strong className="admin-system-pending">
                Connecting
              </strong>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}