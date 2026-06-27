"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModeToggle = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
/**
 * VideoModeToggle Component
 *
 * Renders a toggle/radio button interface for users to select between "Audio Only" and "Video + Audio" recording modes.
 * This component should be displayed on the interview setup screen before the interview starts.
 *
 * Features:
 * - Radio button interface for clear mode selection
 * - Shows camera availability status
 * - Disables video mode if camera is unavailable or hardware not detected
 * - Keyboard accessible (arrow keys, Enter for selection)
 * - Triggers onModeChange callback when mode changes
 * - Disabled state support for when user cannot change mode
 *
 * Accessibility:
 * - Uses semantic `<fieldset>` and `<legend>` for grouping related radio buttons
 * - Proper ARIA labels and descriptions
 * - Full keyboard navigation support
 * - Visual feedback for focus and disabled states
 *
 * @component
 * @example
 * ```tsx
 * <VideoModeToggle
 *   defaultMode="video"
 *   onModeChange={(mode) => console.log('User selected:', mode)}
 *   isDisabled={false}
 *   hasCamera={true}
 * />
 * ```
 */
var VideoModeToggle = function (_a) {
    var defaultMode = _a.defaultMode, onModeChange = _a.onModeChange, isDisabled = _a.isDisabled, hasCamera = _a.hasCamera;
    var _b = (0, react_1.useState)(defaultMode), selectedMode = _b[0], setSelectedMode = _b[1];
    // Handle mode selection
    var handleModeChange = function (mode) {
        if (isDisabled)
            return;
        if (mode === "video" && !hasCamera)
            return; // Prevent selecting video if no camera
        setSelectedMode(mode);
        onModeChange(mode);
    };
    // Handle keyboard navigation (arrow keys)
    var handleKeyDown = function (e, mode) {
        if (isDisabled)
            return;
        // Arrow keys for navigation between radio buttons
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            if (mode === "audio") {
                if (hasCamera) {
                    handleModeChange("video");
                }
            }
        }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            if (mode === "video") {
                handleModeChange("audio");
            }
        }
        else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleModeChange(mode);
        }
    };
    var audioModeDisabled = isDisabled;
    var videoModeDisabled = isDisabled || !hasCamera;
    return ((0, jsx_runtime_1.jsxs)("fieldset", { style: {
            border: "none",
            padding: 0,
            margin: 0,
            marginBottom: "1.5rem",
        }, disabled: isDisabled, children: [(0, jsx_runtime_1.jsx)("legend", { style: {
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "1rem",
                    color: "var(--foreground)",
                }, children: "Recording Mode" }), (0, jsx_runtime_1.jsxs)("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                }, children: [(0, jsx_runtime_1.jsxs)("div", { role: "radio", tabIndex: audioModeDisabled ? -1 : 0, "aria-checked": selectedMode === "audio", "aria-disabled": audioModeDisabled, "aria-label": "Audio only mode", "aria-describedby": "audio-mode-description", onKeyDown: function (e) { return handleKeyDown(e, "audio"); }, onClick: function () { return handleModeChange("audio"); }, style: {
                            padding: "1rem",
                            background: selectedMode === "audio"
                                ? "rgba(99, 102, 241, 0.15)"
                                : "rgba(255, 255, 255, 0.05)",
                            border: selectedMode === "audio"
                                ? "2px solid #6366f1"
                                : "2px solid var(--border)",
                            borderRadius: "12px",
                            cursor: audioModeDisabled ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: audioModeDisabled ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            position: "relative",
                        }, onMouseEnter: function (e) {
                            if (!audioModeDisabled) {
                                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                                e.currentTarget.style.borderColor = "#818cf8";
                            }
                        }, onMouseLeave: function (e) {
                            if (!audioModeDisabled) {
                                e.currentTarget.style.background =
                                    selectedMode === "audio"
                                        ? "rgba(99, 102, 241, 0.15)"
                                        : "rgba(255, 255, 255, 0.05)";
                                e.currentTarget.style.borderColor =
                                    selectedMode === "audio" ? "#6366f1" : "var(--border)";
                            }
                        }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    border: "2px solid",
                                    borderColor: selectedMode === "audio" ? "#6366f1" : "#666",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    backgroundColor: selectedMode === "audio" ? "#6366f1" : "transparent",
                                }, children: selectedMode === "audio" && ((0, jsx_runtime_1.jsx)("div", { style: {
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "white",
                                    } })) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mic, { size: 18, style: { color: selectedMode === "audio" ? "#818cf8" : "var(--foreground-muted)" } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                    fontSize: "0.9rem",
                                                    fontWeight: 600,
                                                    color: selectedMode === "audio" ? "#818cf8" : "var(--foreground)",
                                                }, children: "Audio Only" }), (0, jsx_runtime_1.jsx)("div", { id: "audio-mode-description", style: {
                                                    fontSize: "0.7rem",
                                                    color: "var(--foreground-muted)",
                                                    marginTop: "0.2rem",
                                                }, children: "Microphone only" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { role: "radio", tabIndex: videoModeDisabled ? -1 : 0, "aria-checked": selectedMode === "video", "aria-disabled": videoModeDisabled, "aria-label": "Video and audio mode", "aria-describedby": "video-mode-description", onKeyDown: function (e) { return handleKeyDown(e, "video"); }, onClick: function () { return handleModeChange("video"); }, style: {
                            padding: "1rem",
                            background: selectedMode === "video"
                                ? "rgba(99, 102, 241, 0.15)"
                                : "rgba(255, 255, 255, 0.05)",
                            border: selectedMode === "video"
                                ? "2px solid #6366f1"
                                : "2px solid var(--border)",
                            borderRadius: "12px",
                            cursor: videoModeDisabled ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: videoModeDisabled ? 0.5 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            position: "relative",
                        }, onMouseEnter: function (e) {
                            if (!videoModeDisabled) {
                                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
                                e.currentTarget.style.borderColor = "#818cf8";
                            }
                        }, onMouseLeave: function (e) {
                            if (!videoModeDisabled) {
                                e.currentTarget.style.background =
                                    selectedMode === "video"
                                        ? "rgba(99, 102, 241, 0.15)"
                                        : "rgba(255, 255, 255, 0.05)";
                                e.currentTarget.style.borderColor =
                                    selectedMode === "video" ? "#6366f1" : "var(--border)";
                            }
                        }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                    width: "20px",
                                    height: "20px",
                                    borderRadius: "50%",
                                    border: "2px solid",
                                    borderColor: selectedMode === "video" ? "#6366f1" : "#666",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    backgroundColor: selectedMode === "video" ? "#6366f1" : "transparent",
                                }, children: selectedMode === "video" && ((0, jsx_runtime_1.jsx)("div", { style: {
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: "white",
                                    } })) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Camera, { size: 18, style: { color: selectedMode === "video" ? "#818cf8" : "var(--foreground-muted)" } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                                    fontSize: "0.9rem",
                                                    fontWeight: 600,
                                                    color: selectedMode === "video" ? "#818cf8" : "var(--foreground)",
                                                }, children: "Video + Audio" }), (0, jsx_runtime_1.jsx)("div", { id: "video-mode-description", style: {
                                                    fontSize: "0.7rem",
                                                    color: "var(--foreground-muted)",
                                                    marginTop: "0.2rem",
                                                }, children: "Webcam & microphone" })] })] })] })] }), !hasCamera && ((0, jsx_runtime_1.jsxs)("div", { role: "alert", style: {
                    padding: "0.75rem 1rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#fca5a5",
                    fontSize: "0.75rem",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontWeight: 600 }, children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)("span", { children: "Camera not detected. Video mode is unavailable. Please enable camera hardware or use audio-only mode." })] }))] }));
};
exports.VideoModeToggle = VideoModeToggle;
