import { Link } from "react-router-dom";
import { useState } from "react";
import "../css/Navbar.css";
import "../css/index.css"

function NavbarComponent(){
const [text,setText] = useState("");
const [searchtype,setSearchtype] = useState<"Employer"|"Job">("Job");
    return(
        <div className="w-full flex flex-col items-center gap-10">

      <nav className="navbar">

        <div className="nav-links">
          <Link to="/login" className="nav-button">Login</Link>
          <Link to="/jobs" className="nav-button">Jobs</Link>
          <Link to="/employers" className="nav-button">Employers</Link>
        </div>

        <div
          style={{
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/**May later be a drop down for functionality sake this will work */}
          <div>
            {(["Job", "Employer"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchtype(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Search ${searchtype}s...`}
          />

          <button>
            Search
          </button>
        </div>

      </nav>

    </div>
    )
}

export default NavbarComponent;
