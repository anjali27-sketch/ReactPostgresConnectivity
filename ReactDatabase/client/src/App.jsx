import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/message")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to backend");
        }

        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setError("Unable to load the database message.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      fontFamily: "Arial",
      textAlign: "center",
      marginTop: "100px"
    }}>
      <h1>React + PostgreSQL Demo</h1>

      {loading && <p>Connecting...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <h2>{message}</h2>
      )}
    </div>
  );
}

export default App;