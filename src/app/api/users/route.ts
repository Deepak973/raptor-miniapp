import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  const { searchParams } = new URL(request.url);
  const fids = searchParams.get("fids");
  const addresses = searchParams.get("addresses");

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Neynar API key is not configured. Please add NEYNAR_API_KEY to your environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const neynar = new NeynarAPIClient({ apiKey });

    // Fetch by FIDs
    if (fids) {
      const fidsArray = fids
        .split(",")
        .map((fid) => parseInt(fid.trim()))
        .filter((fid) => !isNaN(fid) && fid > 0);

      if (fidsArray.length === 0) {
        return NextResponse.json({ users: [] });
      }

      const { users } = await neynar.fetchBulkUsers({
        fids: fidsArray,
      });

      return NextResponse.json({ users: users || [] });
    }

    // Fetch by addresses
    if (addresses) {
      const addressesArray = addresses
        .split(",")
        .map((addr) => addr.trim().toLowerCase())
        .filter((addr) => addr && addr.startsWith("0x"));

      if (addressesArray.length === 0) {
        return NextResponse.json({ usersByAddress: {} });
      }

      // Use the bulk-by-address endpoint
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk-by-address/?addresses=${addressesArray.join(
          "%2C"
        )}`,
        {
          method: "GET",
          headers: {
            "x-api-key": apiKey,
            "x-neynar-experimental": "false",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users by address");
      }

      const data = await response.json();
      return NextResponse.json({ usersByAddress: data || {} });
    }

    return NextResponse.json(
      { error: "Either 'fids' or 'addresses' parameter is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      {
        error:
          "Failed to fetch users. Please check your Neynar API key and try again.",
      },
      { status: 500 }
    );
  }
}
