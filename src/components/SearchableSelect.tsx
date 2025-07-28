
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

  // Ultra-strict filtering to prevent any empty values
  const validOptions = options.filter(option => {
    // Check if option exists and is an object
    if (!option || typeof option !== 'object') return false;
    
    // Check if value exists, is a string, and is not empty after trimming
    if (!option.value || typeof option.value !== 'string' || option.value.trim() === '') {
      console.warn('SearchableSelect: Filtering out option with invalid value:', option);
      return false;
    }
    
    // Check if label exists, is a string, and is not empty after trimming
    if (!option.label || typeof option.label !== 'string' || option.label.trim() === '') {
      console.warn('SearchableSelect: Filtering out option with invalid label:', option);
      return false;
    }
    
    return true;
  });

  // Additional validation to ensure no empty values in the final options
  const safeOptions = validOptions.map(option => ({
    value: option.value.trim(),
    label: option.label.trim()
  })).filter(option => option.value.length > 0 && option.label.length > 0);

  const selectedValues = multiple && value ? value.split(',').filter(v => v && v.trim() !== '') : [];
  const selectedOptions = multiple 
    ? safeOptions.filter(option => selectedValues.includes(option.value))
    : [];

  const handleSelect = (currentValue: string) => {
    // Ultra-strict validation before processing
    if (!currentValue || typeof currentValue !== 'string' || currentValue.trim() === '') {
      console.warn('SearchableSelect: Attempting to select invalid value, ignoring:', currentValue);
      return;
    }

    const trimmedValue = currentValue.trim();
    if (trimmedValue === '') {
      console.warn('SearchableSelect: Value is empty after trimming, ignoring');
      return;
    }

    // Verify the value exists in our safe options
    const validOption = safeOptions.find(option => option.value === trimmedValue);
    if (!validOption) {
      console.warn('SearchableSelect: Value not found in valid options, ignoring:', trimmedValue);
      return;
    }

    if (multiple) {
      const newSelectedValues = selectedValues.includes(trimmedValue)
        ? selectedValues.filter(val => val !== trimmedValue)
        : [...selectedValues, trimmedValue];
      onValueChange(newSelectedValues.join(','));
    } else {
      onValueChange(trimmedValue === value ? "" : trimmedValue);
      setOpen(false);
    }
  };

  const removeSelection = (valueToRemove: string) => {
    if (multiple && valueToRemove && valueToRemove.trim() !== '') {
      const newSelectedValues = selectedValues.filter(val => val !== valueToRemove);
      onValueChange(newSelectedValues.join(','));
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
            {multiple ? (
              selectedOptions.length > 0 ? (
                `${selectedOptions.length} selected`
              ) : (
                placeholder
              )
            ) : (
              value
                ? safeOptions.find((option) => option.value === value)?.label
                : placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {safeOptions.map((option) => {
                  // Final safety check before rendering
                  if (!option || !option.value || option.value.trim() === '') {
                    console.warn('SearchableSelect: Skipping invalid option in render:', option);
                    return null;
                  }
                  
                  return (
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
                  );
                })}
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
