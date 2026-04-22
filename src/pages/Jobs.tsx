import { Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import DisplayAllJobs from "../components/DisplayAllJobs";


function Jobs(){
// Mongo Interaction Here
// Store Mongo as Array
// Call DisplayAllJobs with Mongo as Parameter
    return(
<div>
           <NavbarComponent/>

           <DisplayAllJobs/>
           
        <Link to="/JobID" className="btn btn-primary text-2xl font-bold w-3/4 h-full">
            Jobs
        </Link>

</div>
    )
}


export default Jobs;
