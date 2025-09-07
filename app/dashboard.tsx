"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Send, Paperclip, Smile, Moon, Sun, Circle, Menu } from "lucide-react";

interface Message {
  sender: "Employee" | "Agent" | "Boss";
  text: string;
  timestamp: string; // ISO string
  type: "text" | "document";
  document?: string;
}

interface Employee {
  name: string;
  lastMessage: string;
  lastTimestamp: string;
  avatar: string;
  online: boolean;
}

const formatTimestamp = (iso: string) => {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

export default function WhatsAppDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [bossInstructions, setBossInstructions] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load employees
  useEffect(() => {
    fetch("http://localhost:9000/chats/all")
      .then((res) => res.json())
      .then((data) => {
        const mapped = (Array.isArray(data.employees) ? data.employees : []).map(
          (emp: string | { name: string; lastMessage?: string; lastTimestamp?: string; avatar?: string; online?: boolean; }) => {
            if (typeof emp === "string") {
              return {
                name: emp,
                lastMessage: "",
                lastTimestamp: "",
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(emp)}`,
                online: false,
              };
            } else {
              return {
                name: emp.name,
                lastMessage: emp.lastMessage || "",
                lastTimestamp: emp.lastTimestamp || "",
                avatar: emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`,
                online: emp.online ?? false,
              };
            }
          }
        );
        setEmployees(mapped);
      })
      .catch((err) => console.error("Error loading employees:", err));
  }, []);

  // Load messages when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetch(`http://localhost:9000/chats/${selectedEmployee}`)
        .then((res) => res.json())
        .then((data) => {
          const msgs: Message[] = (data.messages || []).map((m: { sender: string; text: string; timestamp: string; type?: string; document?: string; }) => ({
            sender: m.sender,
            text: m.text,
            timestamp: typeof m.timestamp === "string" ? m.timestamp : new Date().toISOString(),
            type: m.type || "text",
            document: m.document,
          }));
          setMessages(msgs);
          setBossInstructions(msgs.filter((m) => m.sender === "Boss"));
        })
        .catch((err) => console.error("Error loading chat:", err));
    }
  }, [selectedEmployee]);

  const search = (searchTerm || "").toLowerCase();
  const filteredEmployees = employees.filter((emp) =>
    emp?.name && typeof emp.name === "string"
      ? emp.name.toLowerCase().includes(search)
      : false
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedEmployee) return;

    const isoTimestamp = new Date().toISOString();
    const newMsg: Message = {
      sender: "Agent",
      text: newMessage,
      timestamp: isoTimestamp,
      type: "text",
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");

    fetch("http://localhost:9000/chats/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ employee: selectedEmployee, message: newMsg }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to send message");
      })
      .catch((err) => console.error(err));

    setEmployees((prev) =>
      prev.map((emp) =>
        emp.name === selectedEmployee
          ? { ...emp, lastMessage: newMessage, lastTimestamp: formatTimestamp(isoTimestamp) }
          : emp
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full overflow-x-hidden ${darkMode ? "dark" : ""}`}>
      {/* Mobile Topbar */}
      <div className="flex md:hidden items-center justify-between bg-white dark:bg-gray-900 px-2 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          className="p-2"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Chats</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
      {/* Sidebar */}
      <div
        className={`fixed md:static z-30 top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-80 md:min-w-[20rem]`}
      >
        {/* Sidebar Header */}
        <div className="hidden md:flex p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        {/* Search Bar */}
        <div className="p-2 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        {/* Employee List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.name}
              onClick={() => {
                setSelectedEmployee(employee.name);
                setSidebarOpen(false);
              }}
              className={`flex items-center p-2 md:p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                selectedEmployee === employee.name
                  ? "bg-green-50 dark:bg-green-900/20 border-r-2 border-r-green-500"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative mr-2 md:mr-3 flex-shrink-0">
                <Image
                  src={employee.avatar}
                  alt={employee.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover w-10 h-10 md:w-12 md:h-12"
                  priority
                />
                {employee.online && (
                  <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
                )}
              </div>
              {/* Employee Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">
                    {employee.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(employee.lastTimestamp)}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {employee.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 w-full max-w-full">
        {selectedEmployee ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center p-2 md:p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <Image
                src={
                  employees.find((e) => e.name === selectedEmployee)?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee)}`
                }
                alt={selectedEmployee}
                width={40}
                height={40}
                className="rounded-full object-cover w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3"
                priority
              />
              <div>
                <h2 className="font-semibold text-sm md:text-lg text-gray-900 dark:text-white">
                  {selectedEmployee}
                </h2>
                <p className="text-xs md:text-sm text-green-600 dark:text-green-400">
                  {employees.find((e) => e.name === selectedEmployee)?.online
                    ? "Online"
                    : "Last seen recently"}
                </p>
              </div>
            </div>
            {/* Boss Instructions (Pinned) */}
            {bossInstructions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 p-2 md:p-3">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 p-1 md:p-2 rounded-full mr-2 md:mr-3">
                    <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-xs md:text-base text-blue-900 dark:text-blue-100 mb-1">
                      Boss Instructions
                    </h4>
                    {bossInstructions.map((instruction, index) => (
                      <p key={index} className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
                        {instruction.text}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4">
              {messages
                .filter((m) => m.sender !== "Boss")
                .map((message, index) => (
                  <div
                    key={`${message.sender}-${message.timestamp}-${index}`}
                    className={`flex ${
                      message.sender === "Agent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-xs lg:max-w-md xl:max-w-lg px-2 py-1 md:px-4 md:py-2 rounded-lg shadow-sm ${
                        message.sender === "Agent"
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none"
                      }`}
                    >
                      {message.type === "document" && message.document ? (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs md:text-sm font-medium">{message.document}</span>
                        </div>
                      ) : (
                        <p className="text-xs md:text-sm">{message.text}</p>
                      )}
                      <div
                        className={`text-[10px] md:text-xs mt-1 ${
                          message.sender === "Agent"
                            ? "text-green-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {/* Message Input */}
            <div className="p-2 md:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1 md:space-x-2">
                <button className="p-1 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-2 py-1 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-xs md:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`p-1 md:p-2 rounded-full transition-colors ${
                    newMessage.trim()
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center w-full px-2">
              <div className="w-32 h-32 md:w-64 md:h-64 mx-auto mb-4 md:mb-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <div className="text-5xl md:text-8xl">💬</div>
              </div>
              <h2 className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp AI Dashboard
              </h2>
              <p className="text-xs md:text-base text-gray-600 dark:text-gray-400">
                Select an employee to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
