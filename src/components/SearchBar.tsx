import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: isHero ? 16 : 8,
    }}>

      {/* Toggle pill */}
      <div style={{
        display: "flex",
        background: "rgba(0,0,0,0.10)",
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}>
        {(["Job", "Employer"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSearchType(type)}
            style={{
              padding: isHero ? "6px 22px" : "4px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: isHero ? "0.92rem" : "0.78rem",
              transition: "all 0.18s",
              background: searchType === type ? "rgba(255,255,255,0.88)" : "transparent",
              color: "var(--text-1)",
              opacity: searchType === type ? 1 : 0.5,
              boxShadow: searchType === type ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {type}s
          </button>
        ))}
      </div>

      {/* Search input + button */}
      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Search ${searchType}s...`}
          style={{
            padding: isHero ? "11px 22px" : "6px 14px",
            borderRadius: "999px 0 0 999px",
            border: "1.5px solid rgba(255,255,255,0.28)",
            borderRight: "none",
            background: "rgba(255,255,255,0.18)",
            color: "var(--text-1)",
            fontSize: isHero ? "1rem" : "0.82rem",
            outline: "none",
            width: isHero ? 340 : 170,
            backdropFilter: "blur(4px)",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: isHero ? "11px 22px" : "6px 16px",
            borderRadius: "0 999px 999px 0",
            border: "1.5px solid rgba(255,255,255,0.28)",
            background: "var(--button-heavy)",
            color: "var(--text-2)",
            fontWeight: 700,
            fontSize: isHero ? "0.95rem" : "0.82rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Search
        </button>
      </div>

    </div>
  );
}
