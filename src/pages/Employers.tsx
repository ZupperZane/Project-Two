import NavbarComponent from "../components/Navbar";
import DisplayAllCompanies from "../components/DisplayAlllCompanies";

function Employers() {
 // Mongo Interaction Here
 // Store Mongo as Array
 // Call DisplayAllCompanies with Mongo as Parameter


  return (
    <div>
      <NavbarComponent />
      <DisplayAllCompanies />
    </div>
  );
}

export default Employers;