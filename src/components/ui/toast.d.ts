
import * as React from "react"
import { cva } from "class-variance-authority"

// Define the toast variant types
export type ToastVariants = "default" | "destructive" | "success" | "warning" | "info"

export const toastVariants: ReturnType<typeof cva<{ variant: ToastVariants }>>

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariants
  onOpenChange?: (open: boolean) => void
}

export interface ToastActionElement {
  altText?: string
  children: React.ReactNode
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariants
  onOpenChange?: (open: boolean) => void
}
