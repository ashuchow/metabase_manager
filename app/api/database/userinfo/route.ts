// app/api/metabaseInstance/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createMetabaseInstance,
  getAllMetabaseInstances,
  getMetabaseInstanceById,
  updateMetabaseInstance,
  deleteMetabaseInstance
} from "./utils";

export async function GET(req: NextRequest) {
  try {
    const { id } = Object.fromEntries(req.nextUrl.searchParams.entries());
    if (id) {
      const res = await getMetabaseInstanceById(parseInt(id, 10));
      return NextResponse.json(res);
    } else {
      const res = await getAllMetabaseInstances();
      return NextResponse.json(res);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}

export async function POST(req: NextRequest) {
  const { host, email, password, databaseId, collectionId } = await req.json();
  try {
    const res = await createMetabaseInstance(host, email, password, databaseId, collectionId);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}

export async function PATCH(req: NextRequest) {
  const { id, host, email, password, databaseId, collectionId } = await req.json();
  try {
    const res = await updateMetabaseInstance(id, host, email, password, databaseId, collectionId);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    const res = await deleteMetabaseInstance(id);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}