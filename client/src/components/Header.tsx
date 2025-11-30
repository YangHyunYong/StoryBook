import { FaUser } from "react-icons/fa";
import { IoChevronBack } from "react-icons/io5";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";

interface HeaderProps {
  profile?: UserProfile | null;
}

export function Header({ profile }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isUserPage = location.pathname.startsWith("/user");
  const isComposePage = location.pathname.startsWith("/compose");
  const isPostDetailPage = location.pathname.startsWith("/post");

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800">
      <div className="flex items-center justify-between px-4 h-[53px] w-full mx-auto">
        {isUserPage || isComposePage || isPostDetailPage ? (
          <button
            onClick={() => navigate("/")}
            className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0"
          >
            <IoChevronBack className="w-4 h-4" />
          </button>
        ) : (
          <Link
            to="/user"
            className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.nickname}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <FaUser className="w-4 h-4" />
            )}
          </Link>
        )}
        <h3 className="text-white">Story X DSRV</h3>
        <div className="w-7 h-7" />
      </div>
    </header>
  );
}
