import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { LoadingSpinner } from "~/components/ui/loader";

const SearchBar = ({
  onSearch,
  isLoading,
}: {
  onSearch: (query: string) => void;
  isLoading: boolean;
}) => {
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    onSearch(search.trim());
  };

  return (
    <div className="my-4 flex w-full gap-2">
      <Input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <Button onClick={handleSearch} disabled={isLoading} className="w-24">
        {isLoading ? <LoadingSpinner /> : "Search"}
      </Button>
    </div>
  );
};

export default SearchBar;
