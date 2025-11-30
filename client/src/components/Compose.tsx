import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Compose() {
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handlePost = () => {
    if (!content.trim()) return;
    console.log("Posting:", content);
    navigate("/");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">New Post</h2>
        <button
          className="
            px-4 py-2 
            rounded-full 
            text-sm font-medium 
            text-black
            btn-ip-yellow
            hover:brightness-110
            active:brightness-95
            transition
            disabled:opacity-40
            disabled:cursor-not-allowed
            disabled:hover:brightness-100
            disabled:active:brightness-100
          "
          disabled={!content.trim()}
          onClick={handlePost}
        >
          Post
        </button>
      </div>
      <textarea
        className="
          w-full 
          min-h-40 
          rounded-xl 
          bg-black 
          border border-gray-700 
          p-3 
          text-sm 
          resize-none 
          focus:outline-none 
          focus:border-sky-500
        "
        placeholder="What's happening?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end"></div>
    </div>
  );
}
