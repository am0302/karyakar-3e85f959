
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  multiple?: boolean;
}

export const SearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  multiple = false,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);

  const selectedValues = multiple && value ? value.split(',').filter(Boolean) : [];
  const selectedOptions = multiple 
    ? options.filter(option => selectedValues.includes(option.value))
    : [];

  const handleSelect = (currentValue: string) => {
    if (multiple) {
      const newSelectedValues = selectedValues.includes(currentValue)
        ? selectedValues.filter(val => val !== currentValue)
        : [...selectedValues, currentValue];
      onValueChange(newSelectedValues.join(','));
    } else {
      // For single select, if clicking the same value, clear it by passing empty string
      // But we need to handle the display logic properly
      if (currentValue === value) {
        onValueChange('');
      } else {
        onValueChange(currentValue);
      }
      setOpen(false);
    }
  };

  const removeSelection = (valueToRemove: string) => {
    if (multiple) {
      const newSelectedValues = selectedValues.filter(val => val !== valueToRemove);
      onValueChange(newSelectedValues.join(','));
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      return selectedOptions.length > 0 ? `${selectedOptions.length} selected` : placeholder;
    } else {
      // Handle empty string or placeholder values properly
      if (!value || value === '' || value === 'placeholder') {
        return placeholder;
      }
      const selectedOption = options.find((option) => option.value === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {getDisplayValue()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (multiple ? selectedValues.includes(option.value) : value === option.value) 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {multiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="secondary" className="text-xs">
              {option.label}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => removeSelection(option.value)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
