import { useState, useEffect, use } from "react";
import "./App.css";
const API_URL = "http://localhost:8000/api/transaction/";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTransactions(data.results || data);
      } catch (e) {
        console.error("Falha ao buscar transações:", e);
        setError(
          `Não foi possível carregar dados. Você está com o servidor Django rodando?`
        );
      }
    }
    fetchTransactions();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Minhas Transações (React)</h1>

      {/* Mostra uma mensagem de erro, se houver */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="transaction-list">
        {transactions.length > 0 ? (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {/* 7. Fazemos um "loop" (map) sobre o estado das transações */}
            {transactions.map((t) => (
              <li
                key={t.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  borderRadius: "8px",
                  background: "#fff",
                }}
              >
                <strong>{t.date}</strong> | {t.category_name}
                <span
                  style={{
                    float: "right",
                    fontWeight: "bold",
                    color: t.type === "expense" ? "#dc3545" : "#198754",
                  }}
                >
                  {t.type === "expense" ? "-" : "+"} R$ {t.amount}
                </span>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "#555",
                    marginTop: "0.25rem",
                  }}
                >
                  {t.description}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !error && <p>Carregando transações...</p>
        )}
      </div>
    </div>
  );
}

export default App;
