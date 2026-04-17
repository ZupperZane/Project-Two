import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="h-auto w-full flex flex-col items-center gap-14 margin-auto">

    {/*Messages*/}
    <div className="flex items-center justify-center w-full h-25">
        <Link to="/messages" className="btn btn-primary text-2xl font-bold w-3/4 h-full">
            Messages
        </Link>
    </div>

    </div>
  );
}

export default Home;
