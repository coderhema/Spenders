"use client"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatDate } from "./date-utils"

interface Expense {
  timestamp: number
  category: string
  amount: number
  note?: string
}

interface CategoryDataItem {
  name: string
  value: number
  percentage: number
}

/**
 * Format expenses data as CSV with proper date in the filename
 */
export function formatExpensesAsCSV(expenses: Expense[], currentCurrency: string): string {
  const today = new Date().toISOString().split('T')[0]
  let csv = `Spenders Expense Report - ${today}\n`
  csv += "Date,Time,Category,Amount,Note\n"

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp)

  // Add each expense as a row
  sortedExpenses.forEach((expense) => {
    const date = formatDate(expense.timestamp)
    const time = new Date(expense.timestamp).toLocaleTimeString()
    const category = expense.category || "Other"
    const amount = `${getCurrencySymbol(currentCurrency)}${expense.amount.toFixed(2)}`
    const note = expense.note || ""

    // Escape notes that might contain commas
    const escapedNote = note.includes(",") ? `"${note}"` : note

    csv += `${date},${time},${category},${amount},${escapedNote}\n`
  })

  return csv
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: string, filename: string): void {
  // Add current date to filename
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD format
  const filenameWithDate = `${filename.split('.')[0]}-${dateStr}.csv`
  
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filenameWithDate)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generate PDF report of expenses
 */
export function generateExpensesPDF(
  expenses: Expense[],
  currentCurrency: string,
  dailyTotal: number,
  weeklyTotal: number,
  monthlyTotal: number,
  categoryData: CategoryDataItem[],
  currentTheme: any,
): void {
  // Create new PDF document
  const doc = new jsPDF()
  
  // Use helvetica font for consistency
  doc.setFont("helvetica")
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Get theme colors based on current theme
  const primaryColor = getThemeColor(currentTheme.text.primary) || [20, 120, 80]
  
  // Document margins
  const margin = 15
  
  // Currency formatting function - handles different currency symbols
  const formatAmount = (amount: number): string => {
    return `${getCurrencySymbol(currentCurrency)} ${amount.toFixed(2)}`
  }
  
  // ===== HEADER SECTION =====
  
  // Create header with brand color
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  // Add title
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text("Expense Report", margin, 22)

  // Add Spenders text (no more Ø=U° gibberish)
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text("Spenders", pageWidth - margin, 22, { align: "right" })

  // Add date in header
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  const today = new Date()
  doc.text(`Generated: ${formatDate(today.getTime())}`, margin, 30)
  
  // ===== SUMMARY SECTION =====
  
  let yPosition = 50
  
  // Add summary section heading
  doc.setFontSize(16)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Expense Summary", margin, yPosition)
  
  // Add horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3)
  
  // Add space before table
  yPosition += 10
  
  // Create summary table
  autoTable(doc, {
    startY: yPosition,
    margin: { left: margin, right: margin },
    head: [["Period", "Total Amount"]],
    body: [
      ["Daily", formatAmount(dailyTotal)],
      ["Weekly", formatAmount(weeklyTotal)],
      ["Monthly", formatAmount(monthlyTotal)],
    ],
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 12,
      cellPadding: 7
    },
    styles: { 
      fontSize: 11,
      cellPadding: 5,
      lineColor: [220, 220, 220]
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: "left", cellWidth: 40 },
      1: { halign: "right", cellWidth: 60 },
    },
  })
  
  // ===== CATEGORY SECTION =====
  
  // Calculate position for next section (properly spaced)
  yPosition = doc.lastAutoTable.finalY + 20
  
  // Add category section heading
  doc.setFontSize(16)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Category Breakdown", margin, yPosition)
  
  // Add horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3)
  
  // Add space before table
  yPosition += 10

  // Prepare category data
  const categoryTableData = categoryData.map((category) => [
    category.name,
    formatAmount(category.value),
    `${category.percentage.toFixed(1)}%`,
  ])

  // Create category table with proper column widths
  autoTable(doc, {
    startY: yPosition,
    margin: { left: margin, right: margin },
    head: [["Category", "Amount", "Percentage"]],
    body: categoryTableData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 12,
      cellPadding: 7,
      minCellWidth: 40
    },
    styles: { 
      fontSize: 11,
      cellPadding: 5,
      lineColor: [220, 220, 220],
      overflow: 'ellipsize'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: "left", cellWidth: 65 },
      1: { halign: "right", cellWidth: 60 },
      2: { halign: "right", cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
  })
  
  // ===== TRANSACTIONS SECTION =====
  
  // Calculate position for next section (properly spaced)
  yPosition = doc.lastAutoTable.finalY + 20
  
  // Check if we need a page break
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    
    // Add header to new page
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 20, 'F')
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text("Expense Report", margin, 15)
    doc.text("Spenders", pageWidth - margin, 15, { align: "right" })
    
    yPosition = 30
  }
  
  // Add transactions section heading
  doc.setFontSize(16)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Recent Transactions", margin, yPosition)
  
  // Add horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3)
  
  // Add space before table
  yPosition += 10

  // Sort and prepare expense data
  const sortedExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp)
  const expenseTableData = sortedExpenses
    .slice(0, 20)
    .map((expense) => [
      formatDate(expense.timestamp),
      new Date(expense.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      expense.category || "Other",
      formatAmount(expense.amount),
      (expense.note || "").substring(0, 25) + ((expense.note || "").length > 25 ? "..." : ""),
    ])

  // Create transactions table with proper column widths
  autoTable(doc, {
    startY: yPosition,
    margin: { left: margin, right: margin },
    head: [["Date", "Time", "Category", "Amount", "Note"]],
    body: expenseTableData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 12,
      cellPadding: 7,
      minCellWidth: 30
    },
    styles: { 
      fontSize: 10,
      cellPadding: 5,
      lineColor: [220, 220, 220],
      overflow: 'ellipsize'
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 30, fontStyle: 'bold' },
      1: { halign: "center", cellWidth: 28 },
      2: { halign: "left", cellWidth: 40 },
      3: { halign: "right", cellWidth: 35, fontStyle: 'bold' },
      4: { halign: "left", cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    didDrawPage: function(data) {
      // Add header to additional pages
      if (data.pageNumber > 1) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 20, 'F')
        
        doc.setFontSize(16)
        doc.setTextColor(255, 255, 255)
        doc.text("Expense Report", margin, 15)
        doc.text("Spenders", pageWidth - margin, 15, { align: "right" })
      }
    }
  })

  // ===== FOOTER SECTION =====
  
  // Add footer to all pages
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Footer background
    doc.setFillColor(245, 245, 245)
    doc.rect(0, pageHeight - 18, pageWidth, 18, 'F')
    
    // Footer text
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 7)
    
    // Right-aligned footer text
    doc.text("Spenders - Track Your Expenses", pageWidth - margin, pageHeight - 7, {
      align: "right",
    })
  }

  // Generate date-based filename
  const timestamp = new Date().toISOString().substring(0, 10)
  doc.save(`spenders-report-${timestamp}.pdf`)
}

/**
 * Get the proper currency symbol for display
 */
function getCurrencySymbol(currencyCode: string): string {
  // Map for currency symbols
  const currencyMap: {[key: string]: string} = {
    "$": "$",
    "USD": "$",
    "£": "£",
    "GBP": "£",
    "€": "€",
    "EUR": "€",
    "¥": "¥",
    "JPY": "¥",
    "₦": "NGN", // Use currency code for Naira to avoid display issues
    "NGN": "NGN",
  };
  
  // Return mapped currency symbol or the original if not found
  return currencyMap[currencyCode] || currencyCode;
}

/**
 * Get theme color from CSS classes
 */
function getThemeColor(colorClass: string): number[] | null {
  if (colorClass.includes('green')) return [20, 120, 80]
  if (colorClass.includes('blue')) return [59, 130, 246]
  if (colorClass.includes('purple')) return [147, 51, 234]
  if (colorClass.includes('gray')) return [100, 116, 139]
  if (colorClass.includes('red')) return [220, 38, 38]
  if (colorClass.includes('orange')) return [249, 115, 22]
  
  return [20, 120, 80]
}
