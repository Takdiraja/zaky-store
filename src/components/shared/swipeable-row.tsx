"use client";

import { useRef, useState, type ReactNode } from "react";
import { Edit3, MoreVertical, Trash2 } from "lucide-react";

interface Props {
  id: string;
  isSwiped: boolean;
  onSwipedChange: (id: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}

const ACTION_W = 160;

/**
 * Android-style swipe-to-reveal row with Edit/Delete actions.
 * - Touch / pointer drag reveals the actions on any device.
 * - On md+ screens a kebab menu offers the same actions (desktop fallback),
 *   so mouse-only users are never locked out.
 */
export default function SwipeableRow({
  id,
  isSwiped,
  onSwipedChange,
  onEdit,
  onDelete,
  children,
}: Props) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only left-click / touch; ignore if the kebab was the target.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    setDragging(true);
    if (isSwiped) setDragX(-ACTION_W);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (isSwiped) {
      if (dx > 0) {
        setDragX(Math.min(dx - ACTION_W, 0));
      } else {
        setDragX(Math.max(dx, -ACTION_W));
      }
    } else if (dx < 0) {
      setDragX(Math.max(dx, -ACTION_W));
    }
  };

  const handlePointerEnd = () => {
    startX.current = null;
    setDragging(false);
    if (dragX < -ACTION_W / 2) {
      setDragX(-ACTION_W);
      onSwipedChange(id);
    } else {
      setDragX(0);
      onSwipedChange(null);
    }
  };

  const offset = dragging ? dragX : isSwiped ? -ACTION_W : 0;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Actions behind the row (revealed by swipe) */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={onEdit}
          className="flex w-20 flex-col items-center justify-center gap-0.5 bg-secondary text-xs font-bold text-white"
          aria-label="Edit"
        >
          <Edit3 className="size-5" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex w-20 flex-col items-center justify-center gap-0.5 bg-danger text-xs font-bold text-white"
          aria-label="Hapus"
        >
          <Trash2 className="size-5" />
          Hapus
        </button>
      </div>

      {/* Foreground row */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && dragging) handlePointerEnd();
        }}
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 0.2s ease" }}
        className="relative touch-pan-y cursor-pointer select-none bg-card border border-border-standard p-4 shadow-card transition-transform"
      >
        {children}

        {/* Desktop fallback: kebab menu with the same actions */}
        <div className="absolute right-2 top-2 hidden md:block">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Aksi"
            aria-expanded={menuOpen}
            className="flex size-10 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <>
              <button
                aria-label="Tutup menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 z-50 w-36 overflow-hidden rounded-md border border-border-standard bg-card shadow-dialog">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="flex h-12 w-full items-center gap-2 px-4 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                  <Edit3 className="size-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex h-12 w-full items-center gap-2 px-4 text-body-sm font-medium text-danger transition-colors hover:bg-danger/5"
                >
                  <Trash2 className="size-4" />
                  Hapus
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
