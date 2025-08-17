import React from "react";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

const InputWithLabel: React.FC<{
  label: string;
  value: string;
  isDisabled?: boolean;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}> = ({ label, value, setValue, isDisabled }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={label}>{label}</Label>
      <Input
        type={label}
        id={label}
        placeholder={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full lg:w-96"
        disabled={isDisabled}
      />
    </div>
  );
};

export default InputWithLabel;
