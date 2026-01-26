"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import styles from "./Chat.module.css"; // Import our styles

export default function Chat() {
  // STATE: This is the memory of our app
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello There! What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // REF: This helps us scroll to the bottom automatically
  const messagesEndRef = useRef(null);

  // EFFECT: Whenever 'messages' changes, scroll to bottom
  useEffect(
    function () {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
    [messages],
  );

  // FUNCTION: Send the message
  async function handleSend() {
    if (!input.trim()) return; // Don't send empty messages

    // 1. Add YOUR message to the list immediately
    const newHistory = [...messages, { role: "user", text: input }];
    setMessages(newHistory);
    setInput(""); // Clear the input box
    setLoading(true); // Show loading state

    try {
      // 2. Send the whole history to our Backend API
      const response = await axios.post("/api/chat", {
        message: input,
        history: messages, // We send past messages so it has context
      });

      // 3. Add the AI's response to the list
      setMessages([...newHistory, { role: "model", text: response.data.text }]);
    } catch (error) {
      if (error.response?.status === 429) {
        const errorMessage = "Too many requests. Please try again later.";
        setMessages([...newHistory, { role: "model", text: errorMessage }]);
      } else {
        console.error("Error:", error);
        const errorMessage = "Sorry, I encountered an error. Try again!";
        setMessages([...newHistory, { role: "model", text: errorMessage }]);
      }
    }

    setLoading(false); // Stop loading
  }

  // UI: What the user actually sees
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Jhay's AI Chat</h1>
      </div>

      {/* Chat Messages Area */}
      <div className={styles.chatBox}>
        {messages.map(function (msg, index) {
          return (
            <div
              key={index}
              className={`${styles.message} ${
                msg.role === "user" ? styles.userMsg : styles.botMsg
              }`}
            >
              {msg.text}
            </div>
          );
        })}

        {loading && (
          <div className={styles.message + " " + styles.botMsg}>
            Thinking...
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={input}
          onChange={function (e) {
            setInput(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Enter") handleSend();
          }} // Send on Enter key
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={loading}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
