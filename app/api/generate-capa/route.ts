import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        // Get the form data from the request
        const formData = await req.formData();

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
            return NextResponse.json(
                {
                    message: "n8n webhook error",
                    status: response.status,
                    error: response.data || response.statusText,
                },
                { status: response.status }
            );
        }

        // Return the successful response
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("Error connecting to n8n:", error);

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
