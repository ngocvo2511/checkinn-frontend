import { NextRequest, NextResponse } from "next/server";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8081";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${USER_SERVICE_URL}/api/loyalty-points/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Không thể lấy điểm tích lũy: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    return NextResponse.json(
      { error: "Không thể lấy điểm tích lũy" },
      { status: 500 }
    );
  }
}
