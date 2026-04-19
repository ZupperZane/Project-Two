import { Link } from "react-router-dom";
import "../css/Navbar.css";

function NavbarComponent(){
    return(
        <div className="w-full flex flex-col items-center gap-10">

      <nav className="navbar">

        <div className="nav-links">
          <Link to="/Login" className="nav-button">Login</Link>
          <Link to="/Jobs" className="nav-button">Jobs</Link>
          <Link to="/Employers" className="nav-button">Employers</Link>
        </div>

        <div className="nav-search">
          <input type="text" placeholder="Search..." />
        </div>

      </nav>

    </div>
    )
}

export default NavbarComponent;