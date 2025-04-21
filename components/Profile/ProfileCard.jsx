"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ProfileCard({ user, onEdit, onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="w-full max-w-md mx-auto shadow-lg rounded-2xl p-6">
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={user?.image || "/default-avatar.png"}
              alt={user?.nama || "Avatar"}
            />
            <AvatarFallback>{user?.nama?.[0] || "?"}</AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold">{user?.nama || "Guest User"}</h2>
            <p className="text-sm text-gray-500">{user?.email || "No email"}</p>
          </div>

          <Separator className="my-4 w-full" />

          <div className="w-full text-sm space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">User ID:</span>
              <span className="text-right truncate">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <span className="text-right">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-right">{user?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Token Exp:</span>
              <span className="text-right">
                {user?.exp ? new Date(user.exp * 1000).toLocaleString() : "N/A"}
              </span>
            </div>
          </div>

          <Separator className="my-4 w-full" />

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onEdit}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.success("Logged out");
                onLogout?.();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
