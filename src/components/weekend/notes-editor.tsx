"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { saveNotes } from "@/lib/actions";
import { useDebouncedCallback } from "@/lib/hooks/use-debounce";
import { Textarea } from "@/components/ui/textarea";
import Markdown from "react-markdown";

type NotesEditorProps = {
  weekendId: number;
  initialNotes: string | null;
};

export function NotesEditor({ weekendId, initialNotes }: NotesEditorProps) {
  const [value, setValue] = useState(initialNotes ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup saved-status timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const save = useCallback(
    async (text: string) => {
      setSaveStatus("saving");
      await saveNotes(weekendId, text);
      setSaveStatus("saved");
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    },
    [weekendId]
  );

  const debouncedSave = useDebouncedCallback(save, 1000);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    setSaveStatus("idle");
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
    debouncedSave(newValue);
  }

  return (
    <section className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
        <span className="text-xs text-muted-foreground">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Reflections, links, learnings... (markdown supported)"
        rows={6}
        className="resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Supports markdown formatting
      </p>

      {/* Live markdown preview */}
      {value.trim().length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Preview
          </p>
          <Markdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mt-3 mb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mt-2 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mt-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mt-2 space-y-1">{children}</ol>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-primary underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground mt-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {value}
          </Markdown>
        </div>
      )}
    </section>
  );
}
