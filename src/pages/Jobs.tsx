import NavbarComponent from "../components/Navbar";
import DisplayAllJobs from "../components/DisplayAllJobs";
import "../css/Page.css";
import useAuth from "../hooks/useAuth";
import { Link } from "react-router-dom";

function Jobs(){
    const { role } = useAuth();
// Mongo Interaction Here
// Store Mongo as Array
// Call DisplayAllJobs with Mongo as Parameter
    return(
        <div className="page">
            <NavbarComponent/>
            {role === "employer" && (
                <div className="page-toolbar">
                    <Link to="/jobs/new" className="btn">Post Job</Link>
                </div>
            )}
            <DisplayAllJobs/>
        </div>
    )
}


export default Jobs;
