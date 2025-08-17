import { ChevronLeft } from "lucide-react";
import React from "react";

const BackButton = () => {
  return (
    <div
      className="mt-4 flex w-fit items-center gap-2 rounded-md p-2 hover:cursor-pointer hover:bg-neutral-400/40"
      onClick={() => window.history.back()}
    >
      <ChevronLeft />
      <p>Back</p>
    </div>
  );
};

export default BackButton;
