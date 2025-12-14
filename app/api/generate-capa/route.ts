import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        // Get the form data from the request
        const formData = await req.formData();

        // Log incoming request
        logger.info('Incoming CAPA generation request', {
            requestId,
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            formDataKeys: Array.from(formData.keys()),
        });

        // Forward the request to n8n using axios
        const response = await axios.post(
            "https://n8n-82ff.onrender.com/webhook/generate/capa",
            formData,
            {
                headers: {
                    // Let axios automatically set Content-Type for FormData
                    // It will be set to 'multipart/form-data' with the correct boundary
                },
                // Automatically handle response based on content-type
                responseType: "json",
                // Don't throw on non-2xx status codes
                validateStatus: () => true,
            }
        );

        // Check if the request was successful
        if (response.status >= 400) {
            logger.error('n8n webhook returned error status', {
                requestId,
                status: response.status,
                statusText: response.statusText,
                responseData: response.data,
            });

            return NextResponse.json(
                {
                    message: "n8n webhook error",
                    status: response.status,
                    error: response.data || response.statusText,
                },
                { status: response.status }
            );
        }

        // Log successful response
        logger.info('CAPA generation successful', {
            requestId,
            status: response.status,
            responseDataKeys: Object.keys(response.data || {}),
        });

        // Return the successful response
        return NextResponse.json(response.data);
    } catch (error: any) {
        logger.error('Error in CAPA generation endpoint', {
            requestId,
            error: error.message,
            stack: error.stack,
            isAxiosError: axios.isAxiosError(error),
            responseStatus: error.response?.status,
            responseData: error.response?.data,
        });

        // Handle axios-specific errors
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    message: "Network error while connecting to n8n",
                    error: error.message,
                    details: error.response?.data,
                },
                { status: error.response?.status || 500 }
            );
        }

        // Handle other errors
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: error?.message ?? "Unknown error",
            },
            { status: 500 }
        );
    }
}
