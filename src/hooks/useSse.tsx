import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

// Env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVICE_CHANNEL = import.meta.env.VITE_API_SERVICE_CHANNEL;

const ACCESS_TOKEN_KEY = "accessToken";

interface SseEnvelope {
  serviceChannel?: string;
  [key: string]: unknown;
}

export function useSse(
  eventName: string,
  onMessage: (data: SseEnvelope) => void,
  enabled: boolean,
  onError?: (err: unknown) => void
) {
  const callbackRef = useRef(onMessage);
  const errorCallbackRef = useRef(onError);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  /*
    Both callbacks are held in refs so that callers passing inline arrow
    functions do not re-trigger the effect on every render — that would
    tear down and re-open the SSE connection continuously.
  */
  useEffect(() => {
    errorCallbackRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!eventName || !enabled) return;

    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const controller = new AbortController();

    const finalUrl = `${API_BASE_URL}/events`;

    fetchEventSource(finalUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
      openWhenHidden: true,

      async onopen(response) {
        if (!response.ok) {
          throw new Error(`SSE failed with status ${response.status}`);
        }

        console.log("SSE Connection Opened");
      },

      onmessage(event) {
        if (event.event !== eventName) return;

        try {
          const data = JSON.parse(event.data) as SseEnvelope;
          if (data.serviceChannel !== SERVICE_CHANNEL) return;
          callbackRef.current(data);
        } catch (err) {
          console.error("Failed to parse SSE data:", err);
        }
      },

      onerror(err) {
        console.error("SSE Error:", err);
        errorCallbackRef.current?.(err);

        throw err;
      },
    }).catch((err: unknown) => {
      /*
        onerror rethrows to stop fetch-event-source from retrying, which
        rejects this promise. Without a handler that surfaces as an
        unhandled rejection; aborting on unmount lands here too.
      */
      if (controller.signal.aborted) return;

      console.error("SSE Connection Closed With Error:", err);
    });

    return () => {
      controller.abort();
      console.log("SSE Connection Closed");
    };
  }, [eventName, enabled]);
}
