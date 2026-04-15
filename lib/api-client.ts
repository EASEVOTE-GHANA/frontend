import { getSession } from "next-auth/react";

/**
 * Client-side: routes through the local Next.js proxy at /api/proxy
 * to avoid CORS issues when the browser calls the Render backend directly.
 * Server-side requests (createServerApiClient) go directly to the backend.
 */
const API_BASE = "/api/proxy";

class ApiClient {
  private async request<T = any>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const session = await getSession();

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
        ...options?.headers,
      },
    });

    const data = await res.json().catch(() => ({ message: "Request failed" }));

    if (!res.ok) {
      // Global 401 handler for client-side
      if (res.status === 401 && typeof window !== "undefined") {
        window.location.href = "/sign-in?callbackUrl=" + window.location.pathname;
      }
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }

    return data;
  }

  /**
   * For multipart/form-data requests (e.g. POST /api/upload/image).
   * Does NOT set Content-Type — let the browser set it with the boundary.
   * @param path API path
   * @param formData FormData with 'image' and optional 'folder'
   */
  async uploadFormData<T = any>(path: string, formData: FormData): Promise<T> {
    const session = await getSession();

    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body: formData,
      headers: {
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    const data = await res.json().catch(() => ({ message: "Upload failed" }));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        window.location.href =
          "/sign-in?callbackUrl=" + window.location.pathname;
      }
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }

    return data;
  }

  /**
   * Specific helper for deleting images as it requires a JSON body.
   */
  async deleteImage(publicId: string): Promise<any> {
    return this.request("/upload/image", {
      method: "DELETE",
      body: JSON.stringify({ publicId }),
    });
  }

  get<T = any>(path: string) {
    return this.request<T>(path);
  }

  post<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(path: string, body?: any) {
    return this.request<T>(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient();

/**
 * Server-side API client for use in Server Components and API routes.
 * Uses a provided JWT token instead of client-side session.
 */
export function createServerApiClient(token?: string) {
  const RAW_SERVER_URL =
    process.env.API_URL || process.env.NEXTAUTH_URL || "http://localhost:5000";

  const SERVER_API_BASE = RAW_SERVER_URL.endsWith("/api")
    ? RAW_SERVER_URL
    : `${RAW_SERVER_URL}/api`;

  return {
    async request<T = any>(path: string, options?: RequestInit): Promise<T> {
      const res = await fetch(`${SERVER_API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
        cache: "no-store",
      });

      const data = await res
        .json()
        .catch(() => ({ message: "Request failed" }));

      if (!res.ok) {
        console.error(`\n❌ [Server API] Request failed: ${res.status} ${res.statusText}`);
        console.error(`   Endpoint: ${path}`);
        console.error(`   Response: ${JSON.stringify(data).substring(0, 200)}`);
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      return data;
    },

    get<T = any>(path: string) {
      return this.request<T>(path);
    },

    post<T = any>(path: string, body?: any) {
      return this.request<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    put<T = any>(path: string, body?: any) {
      return this.request<T>(path, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    patch<T = any>(path: string, body?: any) {
      return this.request<T>(path, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
      });
    },

    delete<T = any>(path: string) {
      return this.request<T>(path, { method: "DELETE" });
    },
  };
}
