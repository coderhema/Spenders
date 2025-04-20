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

// Format expenses data as CSV
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
    const amount = `${currentCurrency}${expense.amount.toFixed(2)}`
    const note = expense.note || ""

    // Escape notes that might contain commas
    const escapedNote = note.includes(",") ? `"${note}"` : note

    csv += `${date},${time},${category},${amount},${escapedNote}\n`
  })

  return csv
}

// Download data as CSV file
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

// Generate PDF report of expenses
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
  
  // Add standard font to ensure currency symbols display correctly
  // If you've added a custom font via the font converter as mentioned below, use:
  // doc.addFont('path/to/your/converted-font.js', 'YourFontName', 'normal');
  // doc.setFont('YourFontName');
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Define colors for consistent styling
  const primaryColor = getThemeColor(currentTheme.text.primary) || [20, 120, 80]
  
  // Document margins
  const margin = 15
  
  // Add header background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Add accent stripe
  doc.setFillColor(primaryColor[0] * 0.7, primaryColor[1] * 0.7, primaryColor[2] * 0.7)
  doc.rect(0, 40, pageWidth, 4, 'F')
  
  // Add title with larger text
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text("Expense Report", margin, 25)

  // Add "Spenders" text (instead of the gibberish Ø=U°)
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text("Spenders", pageWidth - margin, 25, { align: "right" })

  // Add date in header
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  const today = new Date()
  const formattedDate = today.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  doc.text(`Generated: ${formattedDate}`, margin, 35)
  
  let yPosition = 65
  
  // Add summary section
  doc.setFontSize(18)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Expense Summary", margin, yPosition)
  
  // Horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5)
  
  // Safe currency formatting - convert symbols to text codes if needed
  const safeFormatAmount = (amount: number): string => {
    // For standard PDF fonts, use currency code instead of symbol
    const currencyMap: {[key: string]: string} = {
      '£': 'GBP ',
      '¥': 'JPY ',
      '$': 'USD ',
      '€': 'EUR ',
      '₦': 'NGN ',
      // Add other currency mappings as needed
    };
    
    const currencyCode = currencyMap[currentCurrency] || `${currentCurrency} `;
    return `${currencyCode}${amount.toFixed(2)}`;
  }
  
  yPosition += 15
  
  // Summary table with adequate column widths
  autoTable(doc, {
    startY: yPosition,
    margin: { left: margin, right: margin },
    head: [["Period", "Total"]],
    body: [
      ["Daily", safeFormatAmount(dailyTotal)],
      ["Weekly", safeFormatAmount(weeklyTotal)],
      ["Monthly", safeFormatAmount(monthlyTotal)],
    ],
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 13,
      cellPadding: 8
    },
    styles: { 
      fontSize: 12,
      cellPadding: 6,
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: "left", cellWidth: 60 },
      1: { halign: "right", cellWidth: 100 }, // Wider for currency
    },
  })
  
  yPosition = doc.lastAutoTable.finalY + 30
  
  // Category breakdown section
  doc.setFontSize(18)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Category Breakdown", margin, yPosition)
  
  // Horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, yPosition + 5, pageWidth - margin, yPosition + 5)
  
  yPosition += 15

  // Prepare category data for table
  const categoryTableData = categoryData.map((category) => [
    category.name,
    safeFormatAmount(category.value),
    `${category.percentage.toFixed(1)}%`,
  ])

  // Category breakdown table with fixed column widths
  autoTable(doc, {
    startY: yPosition,
    margin: { left: margin, right: margin },
    head: [["Category", "Amount", "Percentage"]], // Fixed header text
    body: categoryTableData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 13,
      cellPadding: 8,
      minCellWidth: 60 // Prevent column header text wrapping
    },
    styles: { 
      fontSize: 12,
      cellPadding: 6,
      lineColor: [230, 230, 230],
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: "left", cellWidth: 80 },
      1: { halign: "right", cellWidth: 70 },
      2: { halign: "right", cellWidth: 70 }, // Wider to prevent "Percentage" breaking
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
  })

  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp)

  // Prepare expense data for table
  const expenseTableData = sortedExpenses
    .slice(0, 20)
    .map((expense) => [
      formatDate(expense.timestamp),
      new Date(expense.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      expense.category || "Other",
      safeFormatAmount(expense.amount),
      (expense.note || "").substring(0, 25) + ((expense.note || "").length > 25 ? "..." : ""),
    ])

  // Check if we need to start a new page for transactions
  let transactionsY = doc.lastAutoTable.finalY + 30
  if (transactionsY > pageHeight - 110) {
    doc.addPage()
    
    // Add header to new page
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 25, 'F')
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text("Expense Report", margin, 17)
    doc.text("Spenders", pageWidth - margin, 17, { align: "right" })
    
    transactionsY = 40
  }
  
  // Transactions section header
  doc.setFontSize(18)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text("Recent Transactions", margin, transactionsY)
  
  // Horizontal divider
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, transactionsY + 5, pageWidth - margin, transactionsY + 5)
  
  transactionsY += 15

  // Recent transactions table with improved column widths
  autoTable(doc, {
    startY: transactionsY,
    margin: { left: margin, right: margin },
    head: [["Date", "Time", "Category", "Amount", "Note"]],
    body: expenseTableData,
    theme: "grid",
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 13,
      cellPadding: 8,
      minCellWidth: 35 // Ensure minimum width for all header cells
    },
    styles: { 
      fontSize: 11,
      cellPadding: 6,
      lineColor: [230, 230, 230],
      overflow: 'ellipsize'
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 35, fontStyle: 'bold' }, // Wider date column
      1: { halign: "center", cellWidth: 35 }, // Wider time column
      2: { halign: "left", cellWidth: 50 }, // Wider category column
      3: { halign: "right", cellWidth: 60, fontStyle: 'bold' }, // Wider amount column for currency
      4: { halign: "left", cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    didDrawPage: function(data) {
      // Add header to each new page
      if (data.pageNumber > 1) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 25, 'F')
        
        doc.setFontSize(16)
        doc.setTextColor(255, 255, 255)
        doc.text("Expense Report", margin, 17)
        doc.text("Spenders", pageWidth - margin, 17, { align: "right" })
      }
    }
  })

  // Add styled footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Footer background
    doc.setFillColor(248, 248, 248)
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    
    // Footer text
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 7)
    
    // Right-aligned footer text
    doc.text("Spenders - Track Your Expenses", pageWidth - margin, pageHeight - 7, {
      align: "right",
    })
  }

  // Generate date-based filename with timestamp
  const timestamp = new Date().toISOString().substring(0, 10)
  doc.save(`spenders-report-${timestamp}.pdf`)
}

// Helper to extract RGB values from theme color strings
function getThemeColor(colorClass: string): number[] | null {
  // Default fallbacks for common theme colors
  if (colorClass.includes('green')) return [20, 120, 80]
  if (colorClass.includes('blue')) return [59, 130, 246]
  if (colorClass.includes('purple')) return [147, 51, 234]
  if (colorClass.includes('gray')) return [100, 116, 139]
  if (colorClass.includes('red')) return [220, 38, 38]
  if (colorClass.includes('orange')) return [249, 115, 22]
  
  // Default primary color if nothing matches
  return [20, 120, 80]
}
