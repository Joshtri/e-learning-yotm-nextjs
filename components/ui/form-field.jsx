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
