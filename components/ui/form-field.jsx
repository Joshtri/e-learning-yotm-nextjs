"use client";

import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const FormField = forwardRef(
  (
    {
      label,
      type = "text",
      name,
      placeholder,
      required = false,
      options = [],
      error,
      disabled = false,
      className = "",
      min,
      max,
      step,
      rows = 3,
      control,
      register, // ✅ add support for register fallback
      rules,
      ...rest
    },
    ref
  ) => {
    const renderField = () => {
      // If no control is provided, use register
      if (!control && register) {
        const registered = register(name, rules);

        switch (type) {
          case "textarea":
            return (
              <Textarea
                id={name}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={className}
                rows={rows}
                {...registered}
              />
            );

          case "checkbox":
            return (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={name}
                  disabled={disabled}
                  className={className}
                  ref={ref}
                  {...registered}
                />
                <label
                  htmlFor={name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {placeholder}
                </label>
              </div>
            );

          default:
            return (
              <Input
                type={type}
                id={name}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={className}
                ref={ref}
                {...registered}
                min={min}
                max={max}
                step={step}
              />
            );
        }
      }

      // Else use controlled version
      if (!control) return null;

      return (
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => {
            switch (type) {
              case "birthdate":
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/50",
                          !field.value && "text-muted-foreground",
                          className
                        )}
                        disabled={disabled}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {field.value
                            ? format(new Date(field.value), "dd MMMM yyyy", {
                                locale: id,
                              })
                            : placeholder || "Pilih tanggal lahir"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border rounded-md shadow-md bg-white dark:bg-zinc-900"
                      side="bottom"
                      align="start"
                    >
                      <div className="flex">
                        <div className="border-r p-2 max-h-[300px] overflow-y-auto">
                          <h3 className="font-medium text-sm mb-2 px-2">
                            Tahun
                          </h3>
                          {years.map((year) => (
                            <div
                              key={year}
                              className={`px-3 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                                field.value &&
                                new Date(field.value).getFullYear() === year
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : ""
                              }`}
                              onClick={() => {
                                const currentDate = field.value
                                  ? new Date(field.value)
                                  : new Date();
                                const newDate = new Date(
                                  currentDate.setFullYear(year)
                                );
                                field.onChange(newDate.toISOString());
                              }}
                            >
                              {year}
                            </div>
                          ))}
                        </div>
                        <DayPicker
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) =>
                            field.onChange(date?.toISOString())
                          }
                          locale={id}
                          captionLayout="dropdown"
                          fromYear={currentYear - 100}
                          toYear={currentYear}
                          initialFocus
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                );

              case "date":
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !field.value && "text-muted-foreground"
                        } ${className}`}
                        disabled={disabled}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(new Date(field.value), "PPP", { locale: id })
                          : placeholder || "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        locale={id}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                );

              case "select":
                return (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className={className}>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );

              case "textarea":
                return (
                  <Textarea
                    id={name}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={className}
                    rows={rows}
                    {...field}
                    value={field.value ?? ""}
                  />
                );

              case "checkbox":
                return (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                      className={className}
                      ref={ref}
                    />
                    <label
                      htmlFor={name}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {placeholder}
                    </label>
                  </div>
                );

              default:
                return (
                  <Input
                    type={type}
                    id={name}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={className}
                    {...field}
                    value={field.value ?? ""}
                    ref={ref}
                    min={min}
                    max={max}
                    step={step}
                  />
                );
            }
          }}
        />
      );
    };

    return (
      <div className="space-y-2 mb-4">
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        {renderField()}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {rest.children}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export default FormField;
