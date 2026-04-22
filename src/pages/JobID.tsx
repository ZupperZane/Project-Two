//Individual Job Display Page
// Use components for Display/Mongo Interaction
import SingleJobPage from "../components/DisplayJobByID";
import NavbarComponent from "../components/Navbar";

function JobID(){
// Mongo Interaction Here
// Store Mongo as Array
    return(
        <div>
            <NavbarComponent/>
             <SingleJobPage/>
        </div>
    )
}

export default JobID;
