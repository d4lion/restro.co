import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { LinearProgress } from "@/components/ui/LinearProgress";
import { SleekSpinner } from "@/components/ui/SleekSpinner";

describe("ConfirmationModal and Sleek Loaders", () => {
  it("renders confirmation modal with message and triggers confirm action", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmationModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Confirmar Acción Crítica"
        message="¿Estás seguro de continuar con esta operación?"
        confirmText="Continuar"
        cancelText="Descartar"
        variant="danger"
      />
    );

    expect(screen.getByText("Confirmar Acción Crítica")).toBeInTheDocument();
    expect(screen.getByText("¿Estás seguro de continuar con esta operación?")).toBeInTheDocument();

    const confirmButton = screen.getByText("Continuar");
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    const cancelButton = screen.getByText("Descartar");
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders LinearProgress with indeterminate and determinate states", () => {
    const { container, rerender } = render(<LinearProgress indeterminate />);
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();

    rerender(<LinearProgress indeterminate={false} value={75} variant="teal" />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute("aria-valuenow", "75");
  });

  it("renders SleekSpinner with customizable sizes and colors", () => {
    const { container } = render(<SleekSpinner size="sm" color="primary" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
