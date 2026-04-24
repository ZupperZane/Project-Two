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
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                    <Link to="/jobs/new" className="btn btn-primary">Post Job</Link>
                </div>
            )}
            <DisplayAllJobs/>
        </div>
    )
}


export default Jobs;
