import { useState, useEffect } from "react";
import { Sliders, CheckCircle2, Globe, Eye, Save } from "lucide-react";

export default function PreferencesTab() {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [defaultView, setDefaultView] = useState("perspective");
  const [autoSave, setAutoSave] = useState(true);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("user-pref-theme") || "system";
    const savedLanguage = localStorage.getItem("user-pref-lang") || "en";
    const savedView = localStorage.getItem("user-pref-view") || "perspective";
    const savedAutoSave = localStorage.getItem("user-pref-autosave") !== "false";

    setTheme(savedTheme);
    setLanguage(savedLanguage);
    setDefaultView(savedView);
    setAutoSave(savedAutoSave);
  }, []);

  const handleSave = () => {
    localStorage.setItem("user-pref-theme", theme);
    localStorage.setItem("user-pref-lang", language);
    localStorage.setItem("user-pref-view", defaultView);
    localStorage.setItem("user-pref-autosave", String(autoSave));

    // Dispatch an event to update global theme classes if needed
    window.dispatchEvent(new CustomEvent("preferences-updated", { detail: { theme } }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={18} className="text-[#534AB7]" />
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a1a]">Preferences</h2>
          <p className="text-sm text-[#888]">Customize your 3D viewer interface and localization settings</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">Preferences saved successfully!</p>
        </div>
      )}

      <div className="space-y-5 bg-white rounded-2xl border border-[#ede8e0] p-6">
        {/* Theme Settings */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Appearance Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
              { id: "system", label: "System Default" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`rounded-xl border p-3 text-sm font-medium transition-all ${
                  theme === t.id
                    ? "border-[#534AB7] bg-[#f5f0ff] text-[#534AB7]"
                    : "border-[#ede8e0] text-slate-600 hover:border-[#c4b5fd]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-[#f0ebe3]" />

        {/* Language Selection */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">Language</p>
              <p className="text-xs text-slate-400">Choose the language for the portal interface</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-[#ede8e0] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#534AB7] transition-colors"
          >
            <option value="en">English (US)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <hr className="border-[#f0ebe3]" />

        {/* Default 3D View Mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">Default Camera Perspective</p>
              <p className="text-xs text-slate-400">Startup camera projection projection mode</p>
            </div>
          </div>
          <select
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            className="rounded-xl border border-[#ede8e0] bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#534AB7] transition-colors"
          >
            <option value="perspective">Perspective projection</option>
            <option value="orthographic">Orthographic (2D Top/Sides)</option>
          </select>
        </div>

        <hr className="border-[#f0ebe3]" />

        {/* Auto Save Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">Auto-save Comments</p>
            <p className="text-xs text-slate-400">Save discussion comments automatically when typing</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#534AB7]"></div>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-[#534AB7] text-white text-sm px-6 py-2.5 rounded-xl font-medium hover:bg-[#4338ca] transition-colors"
      >
        <Save size={15} />
        Save Preferences
      </button>
    </div>
  );
}
