//All Companies Display Page
// Use components for Display/Mongo Interaction
import { Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";

function Employers(){
// Mongo Interaction Here
// Store Mongo as Array
// Call DisplayAllCompanies with Mongo as Parameter
    return(
        <div>
            <NavbarComponent/>
            Placeholder Employers Component
        <Link to="/Employer" className="btn btn-primary text-2xl font-bold w-3/4 h-full">
            Employer
        </Link>
        </div>
    )
}

export default Employers;
