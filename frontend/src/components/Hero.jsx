import heroImage from "../assets/hero-image.png";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-content">
        <h4>Disha The Academy is Under Maintenance</h4>
        <h4>⚠️ Please do not purchase or make any payments during this maintenance period.</h4>
        <img
  src={heroImage}
  alt="Disha The Academy"
  className="hero-image"
/>
        <h1>
          Right Guidence <span>Brighter Tomorrow</span>
        </h1>

        <p>
          Quality study material, PDF notes and mock tests
          for competitive exam preparation.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn">
            Explore Notes
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate("/take-mock-test")}
          >
            Take a Mock Test
          </button>
        </div>

      </div>
    </section>
  );
}

export default Hero;