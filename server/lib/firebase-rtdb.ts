const RTDB_URL = "https://apexmindreads-default-rtdb.firebaseio.com";

/**
 * High-performance, zero-hang REST API wrapper for Firebase Realtime Database.
 * Avoids WebSocket connection freezes and 504 Gateway Timeouts in serverless environments.
 */
export async function rtdbPut(path: string, data: any, token?: string): Promise<any> {
  const cleanPath = path.replace(/^\//, "").replace(/\.json$/, "");
  const authQuery = token ? `?auth=${encodeURIComponent(token)}` : "";
  const url = `${RTDB_URL}/${cleanPath}.json${authQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`RTDB PUT ${cleanPath} warning (${res.status}):`, errText);
      if (res.status === 401 && token) {
        return await rtdbPut(cleanPath, data);
      }
    }
    return await res.json().catch(() => null);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`RTDB PUT ${cleanPath} error:`, err?.message || err);
    throw err;
  }
}

export async function rtdbPatch(path: string, data: any, token?: string): Promise<any> {
  const cleanPath = path.replace(/^\//, "").replace(/\.json$/, "");
  const authQuery = token ? `?auth=${encodeURIComponent(token)}` : "";
  const url = `${RTDB_URL}/${cleanPath}.json${authQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`RTDB PATCH ${cleanPath} warning (${res.status}):`, errText);
      if (res.status === 401 && token) {
        return await rtdbPatch(cleanPath, data);
      }
    }
    return await res.json().catch(() => null);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`RTDB PATCH ${cleanPath} error:`, err?.message || err);
    throw err;
  }
}

export async function rtdbGet(path: string, token?: string): Promise<any> {
  const cleanPath = path.replace(/^\//, "").replace(/\.json$/, "");
  const authQuery = token ? `?auth=${encodeURIComponent(token)}` : "";
  const url = `${RTDB_URL}/${cleanPath}.json${authQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`RTDB GET ${cleanPath} warning (${res.status}):`, errText);
      if (res.status === 401 && token) {
        return await rtdbGet(cleanPath);
      }
      return null;
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`RTDB GET ${cleanPath} error:`, err?.message || err);
    return null;
  }
}

export async function rtdbDelete(path: string, token?: string): Promise<void> {
  const cleanPath = path.replace(/^\//, "").replace(/\.json$/, "");
  const authQuery = token ? `?auth=${encodeURIComponent(token)}` : "";
  const url = `${RTDB_URL}/${cleanPath}.json${authQuery}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(url, { method: "DELETE", signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error(`RTDB DELETE ${cleanPath} error:`, err?.message || err);
  }
}
