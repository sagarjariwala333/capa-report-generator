/**
 * Generic Report Generator Utility
 * Converts any JSON/object structure to HTML and handles PDF generation
 */

// Type guard to check if value is an array
const isArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
};

// Type guard to check if value is an object (but not null or array)
const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Type guard to check if value is a primitive
const isPrimitive = (value: unknown): value is string | number | boolean => {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
};

// Safe array accessor - ensures value is an array
export const ensureArray = <T = unknown>(value: unknown): T[] => {
    if (isArray(value)) return value as T[];
    if (value === null || value === undefined) return [];
    return [value as T];
};

// Safe string accessor
export const ensureString = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
};

// Format key names for display (camelCase to Title Case)
const formatKeyName = (key: string): string => {
    // Handle special cases
    const specialCases: Record<string, string> = {
        'html_data': 'HTML Data',
        'hazardId': 'Hazard ID',
        'reportDate': 'Report Date',
        'riskRating': 'Risk Rating',
        'rootCauseAnalysis': 'Root Cause Analysis',
        'riskAssessment': 'Risk Assessment',
        'complianceReferences': 'Compliance References',
        'imageAnalysis': 'Image Analysis',
        'detectedHazards': 'Detected Hazards',
        'overallEnvironment': 'Overall Environment',
        'confidenceScore': 'Confidence Score',
        'boundingBox': 'Bounding Box',
        'hazardType': 'Hazard Type',
        'potentialHarm': 'Potential Harm',
        'riskLevel': 'Risk Level',
        'responsiblePerson': 'Responsible Person',
        'immediateAction': 'Immediate Action',
    };

    if (specialCases[key]) return specialCases[key];

    // Convert camelCase to Title Case
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

// Determine if a key should be highlighted
const isHighlightKey = (key: string): boolean => {
    const highlightKeys = [
        'title', 'description', 'hazard', 'action', 'risk', 'severity',
        'category', 'location', 'immediateAction', 'riskRating'
    ];
    return highlightKeys.some(k => key.toLowerCase().includes(k.toLowerCase()));
};

// Generate HTML for a primitive value
const renderPrimitive = (value: string | number | boolean, key?: string): string => {
    const displayValue = ensureString(value);
    const isHighlight = key && isHighlightKey(key);

    if (isHighlight) {
        return `<p style="margin: 0; font-weight: 600; color: #111827; line-height: 1.6;">${displayValue}</p>`;
    }

    return `<p style="margin: 0; color: #4b5563; line-height: 1.6;">${displayValue}</p>`;
};

// Generate HTML for an array
const renderArray = (arr: unknown[], key?: string, depth: number = 0): string => {
    if (arr.length === 0) {
        return `<p style="margin: 0; color: #9ca3af; font-style: italic;">No data available</p>`;
    }

    // Check if array contains primitives
    if (arr.every(item => isPrimitive(item))) {
        return `
      <ul style="padding-left: 20px; margin: 8px 0; line-height: 1.8;">
        ${arr.map(item => `<li style="margin-bottom: 6px; color: #4b5563;">${ensureString(item)}</li>`).join('')}
      </ul>
    `;
    }

    // Array of objects - render as cards
    return `
    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
      ${arr.map((item, index) => {
        if (isObject(item)) {
            return `
            <div style="padding: 15px; background-color: ${depth === 0 ? '#f9fafb' : '#ffffff'}; border: 1px solid #e5e7eb; border-radius: 6px;">
              <div style="margin-bottom: 8px; font-weight: 600; color: #6b7280; font-size: 13px;">Item ${index + 1}</div>
              ${renderObject(item, depth + 1)}
            </div>
          `;
        }
        return `<div style="padding: 10px; background-color: #f9fafb; border-radius: 4px;">${renderPrimitive(ensureString(item))}</div>`;
    }).join('')}
    </div>
  `;
};

// Generate HTML for an object
const renderObject = (obj: Record<string, unknown>, depth: number = 0): string => {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
        return `<p style="margin: 0; color: #9ca3af; font-style: italic;">No data available</p>`;
    }

    return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${entries.map(([key, value]) => {
        // Skip certain keys
        if (key === 'message' || key === 'html_data') return '';

        const label = formatKeyName(key);

        if (isPrimitive(value)) {
            return `
            <div>
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">${label}</p>
              ${renderPrimitive(value, key)}
            </div>
          `;
        }

        if (isArray(value)) {
            return `
            <div>
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 15px; font-weight: 600;">${label}</p>
              ${renderArray(ensureArray(value), key, depth)}
            </div>
          `;
        }

        if (isObject(value)) {
            return `
            <div>
              <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 700; border-left: 4px solid #3b82f6; padding-left: 12px;">${label}</h3>
              ${renderObject(value, depth + 1)}
            </div>
          `;
        }

        return '';
    }).filter(Boolean).join('')}
    </div>
  `;
};

/**
 * Generate a complete HTML report from any JSON/object data
 */
export const generateHtmlFromData = (data: unknown, title: string = 'Report'): string => {
    // Extract title from data if available
    let reportTitle = title;
    let reportSubtitle = '';

    if (isObject(data)) {
        if (typeof data.title === 'string') reportTitle = data.title;
        if (typeof data.hazardDetails === 'object' && data.hazardDetails !== null) {
            const hazardDetails = data.hazardDetails as Record<string, unknown>;
            if (typeof hazardDetails.title === 'string') reportSubtitle = hazardDetails.title;
        }
    }

    const bodyContent = isObject(data)
        ? renderObject(data)
        : isArray(data)
            ? renderArray(ensureArray(data))
            : renderPrimitive(ensureString(data));

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; max-width: 900px; margin: 0 auto; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${reportTitle}</h1>
        ${reportSubtitle ? `<p style="color: #6b7280; font-size: 16px; margin: 0;">${reportSubtitle}</p>` : ''}
      </div>

      <!-- Content -->
      ${bodyContent}

      <!-- Footer -->
      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">Generated by AI Report Generator • ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;
};

/**
 * Generate PDF from HTML content using html2pdf
 */
export const generatePdfFromHtml = async (
    htmlContent: string,
    filename: string = 'report.pdf'
): Promise<void> => {
    try {
        // Dynamically import html2pdf to avoid SSR issues
        const html2pdf = (await import('html2pdf.js')).default;

        // Create a temporary div with the HTML content
        const element = document.createElement('div');
        const wrapper = document.createElement('div');
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.color = '#000000';
        wrapper.innerHTML = htmlContent;
        element.appendChild(wrapper);

        // Configure PDF options
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
        };

        // Generate and download PDF
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw new Error('Failed to generate PDF. Please try downloading HTML instead.');
    }
};
