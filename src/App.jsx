import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [pyodideInstance, setPyodideInstance] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [result, setResult] = useState('');
  const [pythonCode, setPythonCode] = useState('import bms\n\nfrom bms.signals.functions import Sinus\nfrom bms.blocks.continuous import ODE\n\nK = 1\nQ = 0.3\nw0 = 3\n\n# e=bms.Step(\'e\',4.)\ne = Sinus(\'e\', 4., 5)\ns = bms.Variable(\'s\', [0])\n\nblock = ODE(e, s, [1], [1, 2*Q/w0, 1/w0**2])\nds = bms.DynamicSystem(5, 200, [block])\n\nprint("BMS simulation completed successfully!")\n\n# Return a value so it appears in the results\n"Simulation ran with parameters: K={}, Q={}, w0={}".format(K, Q, w0)');
  const [loadingMessage, setLoadingMessage] = useState('Loading Pyodide (this may take a moment)...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    async function loadPyodide() {
      try {
        // Load pyodide.js script
        const pyodideScript = document.createElement('script');
        pyodideScript.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        pyodideScript.async = true;
        document.body.appendChild(pyodideScript);

        pyodideScript.onload = async () => {
          try {
            // Initialize Pyodide
            setLoadingMessage('Initializing Pyodide...');
            setLoadingProgress(10);
            const pyodide = await window.loadPyodide();
            console.log("Pyodide initialized");
            setLoadingProgress(20);

            // Known Pyodide standard packages
            const standardPackages = ['numpy', 'scipy', 'matplotlib'];

            // Load standard packages
            setLoadingMessage('Loading core packages...');
            await pyodide.loadPackage(standardPackages);
            setLoadingProgress(40);
            console.log("Standard packages loaded");

            // Setup micropip
            setLoadingMessage('Setting up micropip...');
            await pyodide.loadPackage('micropip');
            setLoadingProgress(50);

            // Install all packages via micropip with error handling
            const allPackages = [
              'dill', 'packaging', 'pyparsing', 'python-dateutil', 'six',
              'networkx', 'pillow', 'cycler', 'fonttools', 'kiwisolver', 'bms'
            ];

            setLoadingMessage('Installing packages via micropip...');

            // Install all packages with keep_going=True to handle errors gracefully
            await pyodide.runPythonAsync(`
              import micropip
              import asyncio

              async def install_packages():
                  packages = ${JSON.stringify(allPackages)}
                  for pkg in packages:
                      try:
                          print(f"Installing {pkg}...")
                          await micropip.install(pkg)
                          print(f"Successfully installed {pkg}")
                      except Exception as e:
                          print(f"Could not install {pkg}: {str(e)}")

              await install_packages()
            `);

            setLoadingProgress(90);
            console.log("All packages attempted installation");

            // Verify BMS is available
            setLoadingMessage('Verifying BMS installation...');
            try {
              await pyodide.runPythonAsync(`
                import bms
                print("BMS version:", getattr(bms, "__version__", "unknown"))
              `);
              console.log("BMS import successful");
            } catch (error) {
              console.error("Error importing BMS:", error);
              setLoadingMessage(`Error importing BMS: ${error.message}`);
              // Continue anyway as we'll show the error in the UI
            }

            setLoadingProgress(100);
            setPyodideInstance(pyodide);
            setPyodideLoading(false);
            console.log("Pyodide environment ready");
          } catch (error) {
            console.error("Error during Pyodide setup:", error);
            setLoadingMessage(`Error: ${error.message}`);
          }
        };
      } catch (error) {
        console.error("Error loading Pyodide script:", error);
        setLoadingMessage(`Error: ${error.message}`);
        setPyodideLoading(false);
      }
    }

    loadPyodide();
  }, []);

  const runPythonCode = async () => {
    if (!pyodideInstance) return;

    try {
      // Set up stdout and stderr capture
      await pyodideInstance.runPythonAsync(`
        import io
        import sys
        
        # Create StringIO objects to capture output
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        # Save the original stdout and stderr
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        # Redirect stdout and stderr
        sys.stdout = stdout_capture
        sys.stderr = stderr_capture
      `);

      // Run the Python code
      const returnValue = await pyodideInstance.runPythonAsync(pythonCode);

      // Get the captured stdout and stderr
      const stdout = await pyodideInstance.runPythonAsync('stdout_capture.getvalue()');
      const stderr = await pyodideInstance.runPythonAsync('stderr_capture.getvalue()');

      // Restore the original stdout and stderr
      await pyodideInstance.runPythonAsync(`
        sys.stdout = original_stdout
        sys.stderr = original_stderr
      `);

      // Format the result
      let resultText = '';

      // Add stdout if not empty
      if (stdout.trim()) {
        resultText += `Output:\n${stdout}\n`;
      }

      // Add stderr if not empty
      if (stderr.trim()) {
        resultText += `Errors:\n${stderr}\n`;
      }

      // Add return value if it exists and is not None
      if (returnValue !== undefined) {
        resultText += `Return value:\n${returnValue}`;
      }

      setResult(resultText || "Code executed successfully (no output)");
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h1>Python in the Browser with Pyodide</h1>

      {pyodideLoading ? (
        <div className="loading-container">
          <p>{loadingMessage}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
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