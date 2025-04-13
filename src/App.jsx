import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [pyodideInstance, setPyodideInstance] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [result, setResult] = useState('');
  const [pythonCode, setPythonCode] = useState('import numpy as np\n\narr = np.array([1, 2, 3])\nresult = f"NumPy array: {arr}\\nSum: {np.sum(arr)}"\nresult');

  useEffect(() => {
    async function loadPyodide() {
      try {
        // Load pyodide.js script
        const pyodideScript = document.createElement('script');
        pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        pyodideScript.async = true;
        document.body.appendChild(pyodideScript);

        pyodideScript.onload = async () => {
          // Initialize Pyodide
          const pyodide = await window.loadPyodide();

          // Load numpy package
          await pyodide.loadPackage('numpy');
          console.log("NumPy loaded successfully");

          setPyodideInstance(pyodide);
          setPyodideLoading(false);
          console.log("Pyodide loaded successfully");
        };
      } catch (error) {
        console.error("Error loading Pyodide:", error);
        setPyodideLoading(false);
      }
    }

    loadPyodide();
  }, []);

  const runPythonCode = async () => {
    if (!pyodideInstance) return;

    try {
      // Run the Python code and get the result
      const output = await pyodideInstance.runPythonAsync(pythonCode);
      setResult(output);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h1>Python in the Browser with Pyodide</h1>

      {pyodideLoading ? (
        <p>Loading Pyodide (this may take a moment)...</p>
      ) : (
        <div className="python-container">
          <h2>Python Code</h2>
          <textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            rows={10}
            cols={50}
          />
          <button onClick={runPythonCode}>Run Python Code</button>

          <h2>Result</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  )
}

export default App