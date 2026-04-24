import NavbarComponent from "../components/Navbar";
import DisplayAllCompanies from "../components/DisplayAlllCompanies";
import "../css/Page.css";

function Employers() {
  return (
    <div className="page">
      <NavbarComponent />
      <DisplayAllCompanies />
    </div>
  );
}

export default Employers;
