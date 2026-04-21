"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useModal } from "@/components/providers/ModalProvider";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

type HeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  };
  onMobileMenuToggle?: () => void;
  profileUrl?: string;
  settingsUrl?: string;
};

export function Header({ 
  user, 
  onMobileMenuToggle,
  profileUrl = "/dashboard/account",
  settingsUrl = "/dashboard/settings"
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    loading 
  } = useNotifications();

  const modal = useModal();

  const handleSignOut = async () => {
    const confirmed = await modal.confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      confirmText: "Sign Out",
      cancelText: "Stay Logged In",
      variant: "danger"
    });

    if (confirmed) {
      await signOut({ redirect: false });
      window.location.href = "/sign-in";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm italic">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={clsx(
                        "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                        !notification.read && "bg-primary-50/30"
                      )}
                    >
                      <p className={clsx(
                        "text-sm",
                        !notification.read ? "font-bold text-slate-900" : "font-medium text-slate-600"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                      </p>
                    </button>
                  ))
                )}
              </div>
              
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-primary-600" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800">
                {user.name || "User"}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user.role?.toLowerCase().replace("_", " ")}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="py-1">
                <Link 
                  href={profileUrl}
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link 
                  href={settingsUrl}
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
