"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";

interface DatePickerProps {
  value?: Date | string;
  onChange: (date: Date | string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  required = false,
  className = ""
}: DatePickerProps) {
  const [calendarType, setCalendarType] = useState<"AD" | "BS">("AD");
  const [adDate, setAdDate] = useState<Date | undefined>();
  const [bsDate, setBsDate] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Initialize dates from value
  useEffect(() => {
    if (value) {
      if (typeof value === "string") {
        // Assume it's AD date string for now
        setAdDate(new Date(value));
      } else {
        setAdDate(value);
      }
    }
  }, [value]);

  const handleAdDateChange = (date: Date | undefined) => {
    setAdDate(date);
    if (date) {
      onChange(date);
    }
    setIsOpen(false);
  };

  const handleBsDateChange = (date: string) => {
    setBsDate(date);
    // Convert BS to AD date for internal storage
    // For now, we'll store the BS string and handle conversion later
    onChange(date);
  };

  const displayValue = calendarType === "AD"
    ? (adDate ? format(adDate, "PPP") : "")
    : bsDate;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label>
          {label} {required && "*"}
        </Label>
      )}

      <div className="flex gap-2">
        <Select value={calendarType} onValueChange={(value: "AD" | "BS") => setCalendarType(value)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AD">AD</SelectItem>
            <SelectItem value="BS">BS</SelectItem>
          </SelectContent>
        </Select>

        {calendarType === "AD" ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`flex-1 justify-start text-left font-normal ${!adDate && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {adDate ? format(adDate, "PPP") : placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={adDate}
                onSelect={handleAdDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex-1">
            <div className="relative">
              <NepaliDatePicker
                inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                className=""
                value={bsDate}
                onChange={(value: string) => handleBsDateChange(value)}
                options={{ calenderLocale: "ne", valueLocale: "en" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}