import { BLOG_POSTS } from "../data/staticContent";
import "./ExtraPages.css";

export default function Blog() {
  return (
    <div className="xp-page">
      <div className="xp-header">
        <h1>Study Tips & Updates</h1>
        <p>Guidance and strategies to help you prepare better.</p>
      </div>

      {BLOG_POSTS.map((post) => (
        <div key={post.id} className="xp-card">
          <h3>{post.title}</h3>
          <div className="xp-meta-row">
            <span>{post.date}</span>
          </div>
          <p>{post.excerpt}</p>
        </div>
      ))}
    </div>
  );
}