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

// --- Interfaces for n8n JSON Response ---

interface HazardDetails {
  hazardId: string
  title: string
  description: string
  location: string
  category: string
  severity: string
  likelihood: string
  riskRating: string
  immediateAction: string
  reportDate: string
}

interface CorrectiveActions {
  action: string[]
  responsiblePerson: string
  timeline: string
}

interface PreventiveActions {
  action: string[]
  responsiblePerson: string[]
  timeline: Record<string, string>
}

interface AdditionalInformation {
  rootCauseAnalysis: string
  riskAssessment: string
  complianceReferences: string
}

interface DetectedHazard {
  hazardType: string
  confidenceScore: number
  boundingBox: {
    x_min: number
    y_min: number
    x_max: number
    y_max: number
  }
}

interface ImageAnalysis {
  overallEnvironment: string
  detectedHazards: DetectedHazard[]
}

interface CapaData {
  hazardDetails: HazardDetails
  correctiveActions: CorrectiveActions
  preventiveActions: PreventiveActions
  additionalInformation: AdditionalInformation
  imageAnalysis: ImageAnalysis
}

interface ApiCapaResponse {
  message: string
  html_data: CapaData
}

interface CapaResponse {
  message: string
  html_data?: string // Keeping this as string for the frontend state to hold the generated HTML
}

// --- Helper: Generate HTML string from structured data ---

const generateHtmlReport = (data: CapaData): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">CAPA Report</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">${data.hazardDetails.title}</p>
        </div>
        <div style="text-align: right;">
           <span style="display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
            ${data.hazardDetails.riskRating.split(' ')[0]} Risk
          </span>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: #f9fafb; padding: 20px; border-radius: 8px;">
        <div>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Report Date</p>
          <p style="margin: 0; font-weight: 500;">${data.hazardDetails.reportDate}</p>
        </div>
         <div>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Hazard ID</p>
          <p style="margin: 0; font-family: monospace; font-weight: 500;">${data.hazardDetails.hazardId}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Location</p>
          <p style="margin: 0; font-weight: 500;">${data.hazardDetails.location}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Category</p>
          <p style="margin: 0; font-weight: 500;">${data.hazardDetails.category}</p>
        </div>
      </div>

      <!-- Section 1: Hazard Details -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #111827; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px;">1. Hazard Description</h2>
        <p style="line-height: 1.6; margin-bottom: 15px;">${data.hazardDetails.description}</p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Immediate Action:</strong> ${data.hazardDetails.immediateAction}</p>
        </div>
      </div>

      <!-- Section 2: Root Cause -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #111827; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px;">2. Root Cause Analysis</h2>
        <p style="white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${data.additionalInformation.rootCauseAnalysis}</p>
      </div>

      <!-- Section 3: Corrective Actions -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #111827; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px;">3. Corrective Actions</h2>
        <ul style="padding-left: 20px; line-height: 1.6; margin-bottom: 15px;">
           ${data.correctiveActions.action.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
        </ul>
        <div style="display: flex; gap: 20px; font-size: 14px;">
           <span style="color: #4b5563;"><strong>Responsible:</strong> ${data.correctiveActions.responsiblePerson}</span>
           <span style="color: #4b5563;"><strong>Timeline:</strong> ${data.correctiveActions.timeline}</span>
        </div>
      </div>

      <!-- Section 4: Preventive Actions -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #111827; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px;">4. Preventive Actions</h2>
        <ul style="padding-left: 20px; line-height: 1.6; margin-bottom: 15px;">
           ${data.preventiveActions.action.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
        </ul>
      </div>

      <!-- Section 5: Compliance -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #111827; font-size: 18px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px;">5. Compliance & Risks</h2>
        <div style="font-size: 14px;">
           <p style="margin-bottom: 10px;"><strong>Risk Assessment:</strong></p>
           <p style="white-space: pre-wrap; margin-bottom: 20px; color: #4b5563; line-height: 1.5;">${data.additionalInformation.riskAssessment}</p>
           
           <p style="margin-bottom: 10px;"><strong>Compliance References:</strong></p>
           <p style="white-space: pre-wrap; color: #4b5563; line-height: 1.5;">${data.additionalInformation.complianceReferences}</p>
        </div>
      </div>

      <!-- Footer -->
       <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
         <p style="color: #9ca3af; font-size: 12px;">Generated by AI CAPA Generator • ${new Date().toLocaleDateString()}</p>
       </div>
    </div>
  `;
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

      const response = await fetch("https://n8n-82ff.onrender.com/webhook/generate/capa", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()

      // Determine if it is a structured response or old format
      let htmlContent: string;
      let message = rawData.message;

      // Type guard or simple check for the new structure
      if (typeof rawData.html_data === 'object' && rawData.html_data !== null) {
        // New format
        const structuredData = rawData as ApiCapaResponse;
        htmlContent = generateHtmlReport(structuredData.html_data);
      } else if (typeof rawData.html_data === 'string') {
        // Old format or different structure
        htmlContent = rawData.html_data;
        // Extract HTML from markdown code blocks if present
        if (htmlContent.includes('```html')) {
          const htmlMatch = htmlContent.match(/```html\s*([\s\S]*?)\s*```/);
          if (htmlMatch && htmlMatch[1]) {
            htmlContent = htmlMatch[1].trim();
          }
        }
      } else {
        // Fallback or error case?
        // If html_data is missing, it might be an error or just a message
        htmlContent = "";
      }

      setResult({
        message: message,
        html_data: htmlContent
      })
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
      // Use the styled HTML
      element.innerHTML = result.html_data

      // Configure PDF options
      const opt = {
        margin: [0.5, 0.5], // Top, Left, Bottom, Right margin in inches
        filename: `capa-report-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
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
                      <Button onClick={downloadPdfReport} disabled={isGeneratingPdf} className="flex-1">
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
                      </Button>
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
