"use client";

import React from "react";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function NewChatDialog({ open, onOpenChange, onCreateChat }) {
  const [selectedTab, setSelectedTab] = React.useState("individual");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ["chat-available-users"],
    queryFn: async () => {
      const res = await axios.get("/api/chat/available-users");
      return res.data.data;
    },
    enabled: open,
  });

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    return users.filter(
      (user) =>
        user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleCreateChat = async () => {
    if (selectedTab === "individual" && selectedUser) {
      try {
        const res = await axios.post("/api/chat/rooms", {
          targetUserId: selectedUser.id,
        });
        const room = res.data?.data;
        if (room?.id) {
          onCreateChat(room);
        }
        onOpenChange(false);
      } catch (err) {
        console.error("Gagal membuat chat room", err);
      }
    }
  };

  React.useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chat Baru</DialogTitle>
          <DialogDescription>
            Pilih pengguna untuk memulai percakapan baru.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="individual">Individual</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="mt-4">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Cari pengguna..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>Tidak ada pengguna yang ditemukan.</CommandEmpty>
                <CommandGroup heading="Pengguna">
                  <ScrollArea className="h-72">
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => setSelectedUser(user)}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <div className="flex flex-1 items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.nama}
                            />
                            <AvatarFallback>
                              {user.nama.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">{user.nama}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.role}
                            </p>
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleCreateChat} disabled={!selectedUser}>
            Mulai Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
