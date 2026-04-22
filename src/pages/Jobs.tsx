import NavbarComponent from "../components/Navbar";
import DisplayAllJobs from "../components/DisplayAllJobs";

function Jobs() {
// Mongo Interaction Here
// Store Mongo as Array
// Call DisplayAllJobs with Mongo as Parameter
  return (
    <div>
      <NavbarComponent />
      <DisplayAllJobs />
    </div>
  );
}

export default Jobs;