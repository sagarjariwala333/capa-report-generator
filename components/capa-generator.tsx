"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, AlertTriangle, CheckCircle, XCircle, Download, RefreshCw, FileText } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"

interface CapaResponse {
  message: string
  html_data?: string
}

export function CapaGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<CapaResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile && selectedFile.type === "image/png") {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    } else {
      setError("Please select a PNG image file only.")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
    },
    multiple: false,
  })

  const generateReport = async (imageFile?: File) => {
    const fileToUse = imageFile || file
    if (!fileToUse) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append("file", fileToUse)

      const response = await fetch("https://xhire.app.n8n.cloud/webhook/generate/capa", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CapaResponse = await response.json()
      
      // Extract HTML from markdown code blocks if present
      if (data.html_data && data.html_data.includes('```html')) {
        // Extract content between ```html and ```
        const htmlMatch = data.html_data.match(/```html\s*([\s\S]*?)\s*```/);
        if (htmlMatch && htmlMatch[1]) {
          data.html_data = htmlMatch[1].trim();
        }
      }
      
      setResult(data)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate CAPA report")
      setProgress(0)
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
    }
  }

  const tryExampleImage = async () => {
    try {
      // Fetch the example image from public folder
      const response = await fetch('/no-helmet.png')
      const blob = await response.blob()
      const file = new File([blob], 'no-helmet.png', { type: 'image/png' })
      
      // Call generateReport with the example image
      await generateReport(file)
    } catch (err) {
      setError('Failed to load example image')
    }
  }

  const downloadReport = () => {
    if (!result?.html_data) return

    const blob = new Blob([result.html_data], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `capa-report-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPdfReport = async () => {
    if (!result?.html_data) return

    setIsGeneratingPdf(true)

    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default

      // Create a temporary div with the HTML content
      const element = document.createElement("div")
      element.innerHTML = result.html_data

      // Configure PDF options
      const opt = {
        margin: 1,
        filename: `capa-report-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
      }

      // Generate and download PDF
      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error("PDF generation failed:", err)
      setError("Failed to generate PDF. Please try downloading HTML instead.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  const getStatusBadge = () => {
    if (!result) return null

    if (result.message === "Image Not Found") {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Image Not Found
        </Badge>
      )
    }
    if (result.message === "Non Industrial Image") {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Non-Industrial
        </Badge>
      )
    }
    if (result.html_data) {
      return (
        <Badge className="gap-1 bg-success text-success-foreground">
          <CheckCircle className="h-3 w-3" />
          Report Generated
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">CAPA Report Generator</h1>
        <p className="text-muted-foreground text-pretty">
          Upload industrial hazard images to automatically generate Corrective and Preventive Action reports
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Image Upload
            </CardTitle>
            <CardDescription>Upload a PNG image of an industrial hazard for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                file && "border-success bg-success/5",
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <FileImage className={cn("h-12 w-12", file ? "text-success" : "text-muted-foreground")} />
                {file ? (
                  <div>
                    <p className="font-medium text-success">File selected:</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Drop your PNG image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={() => generateReport()} disabled={!file || isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Generate CAPA Report
                  </>
                )}
              </Button>
              {file && (
                <Button variant="outline" onClick={reset}>
                  Reset
                </Button>
              )}
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing image...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Analysis Results
              </span>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>Generated CAPA report and analysis status</CardDescription>
          </CardHeader>
          <CardContent>
            {!result && !isProcessing && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Upload an image to generate a CAPA report</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <Alert
                  className={cn(
                    result.html_data
                      ? "border-success bg-success/5"
                      : result.message === "Image Not Found"
                        ? "border-destructive bg-destructive/5"
                        : "border-warning bg-warning/5",
                  )}
                >
                  <AlertDescription className="font-medium">{result.message}</AlertDescription>
                </Alert>

                {result.html_data && (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-muted/30 max-h-64 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: result.html_data }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={downloadReport} variant="outline" className="flex-1 bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Download HTML
                      </Button>
                      {/* <Button onClick={downloadPdfReport} disabled={isGeneratingPdf} className="flex-1">
                        {isGeneratingPdf ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Download PDF
                          </>
                        )}
                      </Button> */}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Example Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Try with Example</CardTitle>
          <CardDescription>
            See how the CAPA generator works with a sample industrial safety image
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src="/no-helmet.png"
                  alt="Example: Worker without helmet - Industrial safety hazard"
                  className="max-w-full h-auto rounded-lg border shadow-sm bg-muted/30"
                  style={{ maxHeight: '300px' }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="text-xs">
                    Safety Hazard
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Example: Construction worker without safety helmet
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">What you'll get:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Hazard identification and analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Corrective action recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Preventive measures
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Downloadable HTML/PDF report
                  </li>
                </ul>
              </div>
              <Button 
                onClick={tryExampleImage} 
                disabled={isProcessing}
                className="w-full"
                variant="secondary"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing Example...
                  </>
                ) : (
                  <>
                    <FileImage className="h-4 w-4 mr-2" />
                    Try Example Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">1. Upload Image</h3>
              <p className="text-sm text-muted-foreground">Upload a PNG image of an industrial hazard</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">2. AI Analysis</h3>
              <p className="text-sm text-muted-foreground">Our AI analyzes the image for safety hazards</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">3. Get Report</h3>
              <p className="text-sm text-muted-foreground">Download your comprehensive CAPA report</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
