import "./App.css";

function App() {
  return (
    <>
      <button
        onClick={async () => {
          const message = "Test message from UI";
          const res = await fetch("http://localhost:3000/api/test-job", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          });
          const data = await res.json();
          console.log("Job enqueued:", data);

          // Optionally poll for results
          setTimeout(async () => {
            const resultRes = await fetch(
              "http://localhost:3000/api/test-results",
            );
            const results = await resultRes.json();
            console.log("Results from DB:", results);
          }, 2000);
        }}
        className="bg-red-500 text-white p-2 m-8 cursor-pointer hover:bg-red-700"
      >
        Test Full Flow
      </button>
    </>
  );
}

export default App;
