import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Message = {
  id: string;
  text: string;
  createdAt: string;
};

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadMessages() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/messages");
      const data = await readJsonSafely(response);

      if (response.status === 304) {
        return;
      }

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Failed to load messages.";
        throw new Error(message);
      }

      setMessages(Array.isArray(data) ? (data as Message[]) : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unknown error."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await readJsonSafely(response);

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Failed to send message.";
        throw new Error(message);
      }

      if (!data || typeof data !== "object") {
        throw new Error("Server returned an invalid response.");
      }

      setDraft("");
      setMessages((current) => [data as Message, ...current].slice(0, 20));
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unknown error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-auto w-full flex flex-col items-center gap-8 py-8 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-2">MongoDB Demo</h1>
        <p className="mb-4 opacity-80">
          This list is served by Express and stored in MongoDB.
        </p>

        <form className="flex gap-2 mb-4" onSubmit={handleSubmit}>
          <input
            className="input input-bordered flex-1"
            type="text"
            placeholder="Write a message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !draft.trim()}
          >
            {submitting ? "Sending..." : "Send"}
          </button>
        </form>

        <button className="btn btn-outline btn-sm mb-4" onClick={loadMessages}>
          Refresh
        </button>

        {loading ? <p>Loading messages...</p> : null}
        {error ? <p className="text-red-500 mb-4">{error}</p> : null}

        {!loading && messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul className="w-full text-left space-y-2">
            {messages.map((message) => (
              <li key={message.id} className="border rounded p-3">
                <p>{message.text}</p>
                <p className="text-xs opacity-70">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-center w-full h-25 max-w-2xl">
        <Link
          to="/messages"
          className="btn btn-primary text-2xl font-bold w-3/4 h-full"
        >
            Messages
        </Link>
      </div>
    </div>
  );
}

export default Home;
