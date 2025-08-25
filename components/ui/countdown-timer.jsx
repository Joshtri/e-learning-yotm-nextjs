"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

export function CountdownTimer({
  totalMinutes,
  onTimeUp,
  isActive = true,
  showWarningAt = 5, // minutes
  title = "Waktu Tersisa",
}) {
  // Validate and limit the time (max 24 hours = 1440 minutes)
  const validatedMinutes = Math.min(Math.max(totalMinutes || 0, 0), 1440);
  const [timeLeft, setTimeLeft] = useState(validatedMinutes * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;

        // Check if warning threshold reached
        if (newTime <= showWarningAt * 60 && newTime > 0) {
          setIsWarning(true);
        }

        // Time's up
        if (newTime <= 0) {
          onTimeUp && onTimeUp();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onTimeUp, showWarningAt]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgressColor = () => {
    if (timeLeft <= 0) return "bg-red-500";
    if (isWarning) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = () => {
    if (timeLeft <= 0) return "text-red-600";
    if (isWarning) return "text-yellow-600";
    return "text-green-600";
  };

  const progressPercentage = Math.max(
    0,
    (timeLeft / (validatedMinutes * 60)) * 100
  );

  return (
    <Card
      className={`sticky top-4 z-10 ${
        isWarning ? "border-yellow-400 shadow-lg" : ""
      } ${timeLeft <= 0 ? "border-red-400" : ""}`}
    >
      <CardContent className="p-4">
        {totalMinutes > 1440 && (
          <div className="mb-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Waktu terlalu panjang (lebih dari 24 jam), dibatasi maksimal 24
            jam
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isWarning || timeLeft <= 0 ? "bg-yellow-100" : "bg-green-100"
            }`}
          >
            {timeLeft <= 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Clock className={`h-5 w-5 ${getTextColor()}`} />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{title}</span>
              <span className={`text-lg font-bold ${getTextColor()}`}>
                {timeLeft <= 0 ? "WAKTU HABIS!" : formatTime(timeLeft)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {isWarning && timeLeft > 0 && (
              <p className="text-xs text-yellow-600 mt-1 animate-pulse">
                ⚠️ Waktu hampir habis!
              </p>
            )}

            {timeLeft <= 0 && (
              <p className="text-xs text-red-600 mt-1 font-semibold">
                🚨 Waktu pengerjaan telah berakhir
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
