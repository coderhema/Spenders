"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileText, FileSpreadsheet, Download } from "lucide-react"
import { getExpenses } from "@/utils/db"
import { formatExpensesAsCSV, downloadCSV, generateExpensesPDF } from "@/utils/export-utils"

interface DataExportProps {
  currentTheme: any
  currentCurrency: string
  dailyTotal: number
  weeklyTotal: number
  monthlyTotal: number
  categoryData: any[]
}

export default function DataExport({
  currentTheme,
  currentCurrency,
  dailyTotal,
  weeklyTotal,
  monthlyTotal,
  categoryData,
}: DataExportProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      const expenses = await getExpenses()
      const csv = formatExpensesAsCSV(expenses, currentCurrency)
      downloadCSV(csv, "spenders-expenses.csv")
      toast.success("CSV exported successfully")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.error("Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      const expenses = await getExpenses()
      generateExpensesPDF(expenses, currentCurrency, dailyTotal, weeklyTotal, monthlyTotal, categoryData, currentTheme)
      toast.success("PDF exported successfully")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className={`${currentTheme.card} rounded-[24px]`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg font-semibold ${currentTheme.text.primary}`}>Export Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileSpreadsheet className="h-12 w-12 mb-2 text-green-600" />
            <h3 className="font-medium mb-1">CSV Export</h3>
            <p className="text-sm text-gray-500 mb-4">
              Export your expense data as a CSV file for use in spreadsheet applications.
            </p>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className={`${currentTheme.button} text-white w-full`}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileText className="h-12 w-12 mb-2 text-blue-600" />
            <h3 className="font-medium mb-1">PDF Report</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generate a comprehensive PDF report with summaries and visualizations.
            </p>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`${currentTheme.button} text-white w-full`}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
