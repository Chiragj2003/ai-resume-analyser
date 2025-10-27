import {Link} from "react-router";

const Navbar = () => {
    return (
        <div className="px-4 pt-4">
            <nav className="navbar">
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gradient">Resumind</span>
                </Link>
                <div className="flex items-center gap-3">
                    <Link to="/" className="secondary-button hidden sm:inline-flex">
                        Dashboard
                    </Link>
                    <Link to="/upload" className="primary-button">
                        Upload Resume
                    </Link>
                </div>
            </nav>
        </div>
    )
}
export default Navbar
