import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SearchBar.css";

type SearchType = "Job" | "Employer";
type Size = "compact" | "hero";

export default function SearchBar({ size = "compact" }: { size?: Size }) {
  const [text, setText] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("Job");
  const navigate = useNavigate();
  const isHero = size === "hero";

  const handleSearch = () => {
    const q = text.trim();
    if (!q) return;
    navigate(`/search?type=${searchType === "Job" ? "jobs" : "employers"}&q=${encodeURIComponent(q)}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className={`search-wrap ${isHero ? "hero" : "compact"}`}>

      <div className="search-toggle">
        {(["Job", "Employer"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSearchType(type)}
            className={`search-toggle-btn ${searchType === type ? "active" : ""}`}
            type="button"
          >
            {type}s
          </button>
        ))}
      </div>

      <div className="search-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Search ${searchType}s...`}
          className="search-input"
        />
        <button
          onClick={handleSearch}
          className="search-btn"
          type="button"
        >
          Search
        </button>
      </div>

    </div>
  );
}
