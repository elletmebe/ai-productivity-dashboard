import React from "react";
import { createRoot } from "react-dom/client";
// tokens.css 是本设计系统的唯一样式契约（含 primitive/semantic token、
// 全局控件兜底与动效工具类）。字节级复制自 infone/tokens.css，禁止本地改值。
import "./styles/tokens.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
