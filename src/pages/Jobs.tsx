import NavbarComponent from "../components/Navbar";
import DisplayAllJobs from "../components/DisplayAllJobs";
import "../css/Page.css";

function Jobs(){
// Mongo Interaction Here
// Store Mongo as Array
// Call DisplayAllJobs with Mongo as Parameter
    return(
        <div className="page">
            <NavbarComponent/>
            <DisplayAllJobs/>
        </div>
    )
}


export default Jobs;
