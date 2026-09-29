import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  Lightbulb,
  Link2,
  MapPin,
  MoreVertical,
  Share2,
  Star,
  Tag,
  Target,
  Users,
  Zap,
} from "lucide-react";

import "./CurrentAffairDetails.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";


function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


function getReadingTime(article) {
  const text = `${article?.summary || ""} ${
    article?.content || ""
  }`;

  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return `${Math.max(
    1,
    Math.ceil(words / 200)
  )} min read`;
}


function getKeyPoints(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value)
    .split(/\n+/)
    .map((item) =>
      item
        .trim()
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
    )
    .filter(Boolean);
}


function getExamTags(article) {
  const source =
    article?.relevantFor ||
    article?.examTags ||
    article?.exams;

  if (Array.isArray(source)) {
    return source.filter(Boolean);
  }

  if (typeof source === "string") {
    const parsed = source
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsed.length) {
      return parsed;
    }
  }

  return [
    "UPSC",
    "PCS",
    "SSC",
    "Banking",
    "Defence",
  ];
}


export default function CurrentAffairDetails() {
  const { id } = useParams();

  const [article, setArticle] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saved, setSaved] =
    useState(false);

  const [copied, setCopied] =
    useState(false);


  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/api/current-affairs/${encodeURIComponent(
              id
            )}`
          );

        if (!response.ok) {
          throw new Error(
            "Article not found"
          );
        }

        const data =
          await response.json();

        const currentArticle =
          data?.article ||
          data?.data ||
          data;

        setArticle(currentArticle);
      } catch (err) {
        console.error(
          "Current affair error:",
          err
        );

        setError(
          err.message ||
            "Unable to load article"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [id]);


  const keyPoints = useMemo(
    () =>
      getKeyPoints(
        article?.keyPoints
      ),
    [article]
  );


  const examTags = useMemo(
    () => getExamTags(article),
    [article]
  );


  const publishedDate =
    formatDate(
      article?.date ||
        article?.createdAt
    );

  const readingTime =
    getReadingTime(article);


  const paragraphs =
    useMemo(() => {
      const value =
        article?.content ||
        article?.summary ||
        "";

      return String(value)
        .split(/\n+/)
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    }, [article]);


  async function shareArticle() {
    const url =
      window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            article?.title ||
            "Current Affairs",
          text:
            article?.summary ||
            "",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(
        url
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error(
        "Share error:",
        err
      );
    }
  }


  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error(err);
    }
  }
function openSocialShare(platform) {
  const pageUrl = encodeURIComponent(
    window.location.href
  );

  const title = encodeURIComponent(
    article?.title || "Current Affairs"
  );

  const links = {
    whatsapp:
      `https://wa.me/?text=${title}%20${pageUrl}`,

    telegram:
      `https://t.me/share/url?url=${pageUrl}&text=${title}`,

    twitter:
      `https://twitter.com/intent/tweet?text=${title}&url=${pageUrl}`,

    facebook:
      `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,

    linkedin:
      `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
  };

  const shareUrl =
    links[platform];

  if (!shareUrl) return;

  window.open(
    shareUrl,
    "_blank",
    "noopener,noreferrer,width=720,height=600"
  );
}

  if (loading) {
    return (
      <main className="ca-detail-page">
        <div className="ca-detail-state">

          <div className="ca-detail-loader" />

          <h2>
            Loading Current Affair...
          </h2>

          <p>
            Please wait while we
            prepare the article.
          </p>

        </div>
      </main>
    );
  }


  if (error || !article) {
    return (
      <main className="ca-detail-page">

        <div className="ca-detail-state">

          <div className="ca-state-icon">
            !
          </div>

          <h2>
            Article Not Available
          </h2>

          <p>
            {error ||
              "This article could not be found."}
          </p>

          <Link
            to="/current-affairs"
            className="ca-state-button"
          >
            <ArrowLeft size={17} />

            Back to Current Affairs
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main className="ca-detail-page">

      <div className="ca-detail-container">

        {/* =========================================
            TOP NAVIGATION
        ========================================= */}

        <div className="ca-detail-top">

          <Link
            to="/current-affairs"
            className="ca-back-link"
          >
            <ArrowLeft size={18} />

            Back to Current Affairs
          </Link>


          <div className="ca-breadcrumb">

            <Link to="/">
              Home
            </Link>

            <ChevronRight />

            <Link to="/current-affairs">
              Current Affairs
            </Link>

            <ChevronRight />

            <span>
              {article.title}
            </span>

          </div>

        </div>


        {/* =========================================
            TWO COLUMN PAGE
        ========================================= */}

        <div className="ca-detail-grid">

          {/* =======================================
              LEFT ARTICLE
          ======================================= */}

          <article className="ca-detail-article">

            {/* HEADER */}

            <header className="ca-detail-header">

              <div className="ca-header-top-row">

                <span className="ca-category-badge">
                  {article.category ||
                    "Current Affairs"}
                </span>


                <div className="ca-header-actions">

                  <button
                    type="button"
                    className={
                      saved
                        ? "saved"
                        : ""
                    }
                    onClick={() =>
                      setSaved(
                        !saved
                      )
                    }
                    aria-label="Save article"
                  >
                    <Bookmark />
                  </button>


                  <button
                    type="button"
                    onClick={
                      shareArticle
                    }
                    aria-label="Share article"
                  >
                    <Share2 />
                  </button>


                  <button
                    type="button"
                    aria-label="More options"
                  >
                    <MoreVertical />
                  </button>

                </div>

              </div>


              <h1>
                {article.title}
              </h1>


              <p className="ca-detail-summary">
                {article.summary}
              </p>


              <div className="ca-article-meta">

                {publishedDate && (
                  <span>
                    <CalendarDays />

                    {publishedDate}
                  </span>
                )}


                <span>
                  <Clock3 />

                  {readingTime}
                </span>


                <span className="ca-meta-divider" />


                <div className="ca-exam-tags">

                  <Tag />

                  {examTags.map(
                    (tag) => (
                      <span
                        key={tag}
                      >
                        {tag}
                      </span>
                    )
                  )}

                </div>

              </div>

            </header>


            {/* HERO IMAGE */}

            {article.imageUrl && (
              <div className="ca-detail-image">

                <img
                  src={article.imageUrl}
                  alt={article.title}
                />

              </div>
            )}


            {/* =====================================
                ARTICLE BODY
            ===================================== */}

            <div className="ca-article-main">

              <section className="ca-reading-section">

                <div className="ca-section-heading">

                  <div className="ca-heading-number">
                    01
                  </div>

                  <div>
                    <h2>
                      What You Need to Know
                    </h2>
                  </div>

                </div>


                <div className="ca-article-content">

                  {paragraphs.map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    )
                  )}

                </div>

              </section>


              {/* ===================================
                  KEY POINTS
              =================================== */}

              {keyPoints.length >
                0 && (
                <section className="ca-exam-points">

                  <div className="ca-exam-points-header">

                    <div className="ca-points-title">

                      <div className="ca-points-icon">
                        <Star />
                      </div>

                      <h2>
                        Key Points for Exams
                      </h2>

                    </div>

                    <span className="ca-must-revise">
                      Must Revise
                    </span>

                  </div>


                  <div className="ca-points-grid">

                    {keyPoints.map(
                      (
                        point,
                        index
                      ) => (
                        <div
                          className="ca-point"
                          key={index}
                        >

                          <span className="ca-point-number">
                            {index +
                              1}
                          </span>

                          <p>
                            {point}
                          </p>

                        </div>
                      )
                    )}

                  </div>

                </section>
              )}


              {/* ===================================
                  REVISION TIP
              =================================== */}

              <div className="ca-revision-note">

                <div className="ca-revision-icon">
                  <Lightbulb />
                </div>

                <strong>
                  Revision Tip
                </strong>


                <div className="ca-revision-divider" />


                <p>
                  Focus on important
                  names, dates, themes,
                  host country and key
                  data. These are
                  frequently asked in
                  competitive exams in
                  both Prelims and Mains.
                </p>

              </div>

            </div>

          </article>


          {/* =======================================
              RIGHT SIDEBAR
          ======================================= */}

          <aside className="ca-detail-sidebar">

            {/* QUICK FACTS */}

            <section className="ca-side-card ca-quick-facts">

              <div className="ca-side-heading">

                <div className="ca-side-heading-icon gold">
                  <Zap />
                </div>

                <h2>
                  Quick Facts
                </h2>

              </div>


              <div className="ca-quick-list">

                <div className="ca-quick-row">

                  <CalendarDays />

                  <span>
                    Date Observed
                  </span>

                  <strong>
                    {publishedDate ||
                      "Not available"}
                  </strong>

                </div>


                {article.theme && (
                  <div className="ca-quick-row">

                    <Target />

                    <span>
                      Theme
                    </span>

                    <strong>
                      {
                        article.theme
                      }
                    </strong>

                  </div>
                )}


                {article.hostCountry && (
                  <div className="ca-quick-row">

                    <MapPin />

                    <span>
                      Host Country
                    </span>

                    <strong>
                      {
                        article.hostCountry
                      }
                    </strong>

                  </div>
                )}


                <div className="ca-quick-row">

                  <Users />

                  <span>
                    Category
                  </span>

                  <strong>
                    {article.category ||
                      "Current Affairs"}
                  </strong>

                </div>

              </div>

            </section>


            {/* ARTICLE DETAILS */}

            <section className="ca-side-card">

              <div className="ca-side-heading">

                <div className="ca-side-heading-icon blue">
                  <FileText />
                </div>

                <h2>
                  Article Details
                </h2>

              </div>


              <div className="ca-details-list">

                <div>
                  <span>
                    Category
                  </span>

                  <strong className="ca-detail-category-pill">
                    {article.category ||
                      "Current Affairs"}
                  </strong>
                </div>


                <div>
                  <span>
                    Published On
                  </span>

                  <strong>
                    {publishedDate ||
                      "Not available"}
                  </strong>
                </div>


                <div>
                  <span>
                    Reading Time
                  </span>

                  <strong>
                    {readingTime}
                  </strong>
                </div>


                <div className="ca-relevant-row">

                  <span>
                    Relevant For
                  </span>

                  <div>
                    {examTags.map(
                      (tag) => (
                        <small
                          key={tag}
                        >
                          {tag}
                        </small>
                      )
                    )}
                  </div>

                </div>

              </div>

            </section>


            {/* EXAM RELEVANCE */}

          <section className="ca-exam-relevance">

  <div className="ca-exam-relevance-head">

    <div className="ca-relevance-title">

      <div className="ca-exam-icon">
        <GraduationCap />
      </div>

      <h2>
        Exam Relevance
      </h2>

    </div>

    <span className="ca-important-badge">
      Highly Important
    </span>

  </div>


  <div className="ca-relevance-list">

    <div className="ca-relevance-item">

      <span className="ca-relevance-check">
        <Check />
      </span>

      <p>
        <strong>Prelims:</strong>{" "}
        Date, theme, important facts
        and key data
      </p>

    </div>


    <div className="ca-relevance-item">

      <span className="ca-relevance-check">
        <Check />
      </span>

      <p>
        <strong>Mains:</strong>{" "}
        Background, significance,
        economy and broader impact
      </p>

    </div>


    <div className="ca-relevance-item">

      <span className="ca-relevance-check">
        <Check />
      </span>

      <p>
        Relevant for{" "}
        {examTags.join(", ")}{" "}
        exams
      </p>

    </div>

  </div>

</section>


            {/* SHARE */}
<section className="ca-side-card ca-share-card">

  <div className="ca-side-heading">

    <div className="ca-side-heading-icon pale-blue">
      <Share2 />
    </div>

    <h2>
      Share This Article
    </h2>

  </div>


  <div className="ca-social-row">

    <button
      type="button"
      className="social-whatsapp"
      aria-label="Share on WhatsApp"
      title="WhatsApp"
      onClick={() =>
        openSocialShare(
          "whatsapp"
        )
      }
    >
      <FaWhatsapp />
    </button>


    <button
      type="button"
      className="social-telegram"
      aria-label="Share on Telegram"
      title="Telegram"
      onClick={() =>
        openSocialShare(
          "telegram"
        )
      }
    >
      <FaTelegramPlane />
    </button>


    <button
      type="button"
      className="social-twitter"
      aria-label="Share on X"
      title="X"
      onClick={() =>
        openSocialShare(
          "twitter"
        )
      }
    >
      <FaXTwitter />
    </button>


    <button
      type="button"
      className="social-facebook"
      aria-label="Share on Facebook"
      title="Facebook"
      onClick={() =>
        openSocialShare(
          "facebook"
        )
      }
    >
      <FaFacebookF />
    </button>


    <button
      type="button"
      className="social-linkedin"
      aria-label="Share on LinkedIn"
      title="LinkedIn"
      onClick={() =>
        openSocialShare(
          "linkedin"
        )
      }
    >
      <FaLinkedinIn />
    </button>


    <button
      type="button"
      className="social-link"
      aria-label="Copy article link"
      title="Copy Link"
      onClick={copyLink}
    >
      {copied ? (
        <Check />
      ) : (
        <Link2 />
      )}
    </button>

  </div>


  {copied && (
    <span className="ca-copied-message">
      Link copied successfully
    </span>
  )}

</section>


            {/* MORE CURRENT AFFAIRS */}

            <Link
              to="/current-affairs"
              className="ca-next-card"
            >

              <div className="ca-next-arrow">
                <ArrowLeft />
              </div>

              <div>
                <span>
                  Next Article
                </span>

                <strong>
                  More Current Affairs
                </strong>
              </div>

              <ChevronRight />

            </Link>

          </aside>

        </div>

      </div>

    </main>
  );
}