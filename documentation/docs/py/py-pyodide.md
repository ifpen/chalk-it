

## Pyodide in few works

Pyodide is a package that allows  to use the Python programming language within a web browser, by running it in web-assembly. It is designed to be used as a scientific computing platform, and includes many libraries and tools commonly used in scientific and numerical computing, such as NumPy and Matplotlib. Pyodide allows to use these libraries and tools directly from your JavaScript code, without the need to write any Python code yourself or set up a separate Python environment on your machine. Instead, you can just include Pyodide in your web page, and then use its API to access the Python libraries and run Python code within the context of your web page.

Chalk'it has the ability to run your Python code with Pyodide and make it interoperate with JavaScript.

## Supported librairies

Chalk'it supports the two ways of importing Pyodide librairies :

- Pre-built packages (loaded with pyodide.loadPackage) : <https://pyodide.org/en/stable/usage/packages-in-pyodide.html>
- Micropip packages (tested with Chalk'it)


## Drawbacks of using Pyodide

There are a few potential drawbacks to using Pyodide:

- Pyodide is not a full implementation of Python, and it may not support all Python libraries and features. Some Python libraries that rely on C extensions or require access to the operating system may not be compatible with Pyodide.

- Pyodide is designed to run within the browser, so it may not have the same level of performance as a native Python installation.

- Pyodide is still a relatively new project, and it may not be as mature or well-documented as other Python environments.

- Pyodide requires a recent version of a web browser that supports WebAssembly, so it may not work on older or less mainstream browsers.

- Because Pyodide runs within the browser, it may be subject to the same security and privacy concerns as other web-based technologies. You should be careful about running untrusted code within Pyodide, and consider the potential risks of exposing your data or code to the wider internet.
