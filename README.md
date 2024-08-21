# Chalk'it

Welcome to Chalk'it. Chalk'it ambition is to allow technicians, scientists or engineers, not specialists in web technologies, to build their own web applications based on the Python code, JavaScript code or web-services they develop. Watch this 5 minutes video for a quick introduction: <https://www.youtube.com/watch?v=vY8I1XwKs9k> or this more detailed demo: <https://www.youtube.com/watch?v=4O2IfRogeCc>.

![live demo](./assets/home/live-demo.gif)

Currently, Chalk'it allows to export and share standalone HTML apps with Python and/or JavaScript code, thanks to Pyodide. Since version 0.5.0, Chalk'it is able to run standard Python code and host related dashboard as [Docker images](#deploy).

See the [demos gallery](https://ifpen.github.io/chalk-it/index.html#porfolio) and [templates gallery](https://ifpen.github.io/chalk-it/templates-gallery/) for examples with code.

For more details, you can browse the online [documentation](https://ifpen.github.io/chalk-it/hosted/doc/).

## Usage

### Install

```sh
pip install py-chalk-it
```

### Run

```sh
chalk-it
```

Chalk'it will be automatically launched in your web browser.

Your can also use the [online hosted version](https://ifpen.github.io/chalk-it/hosted/).

### Add needed Python (Pyodide) librairies

![live demo](./assets/home/pyodide-libs.gif)

### Add widgets by drag and drop

![drag and drop](./assets/home/dragdrop.gif)

### Use your favorite librairies

![drag and drop](./assets/home/python-plot.gif)

### Create interaction and orchestration dataflow

![drag and drop](./assets/home/dataflow.gif)

### Export and share in one click

![Export](./assets/home/export.gif)

### Deploy

Rename your dashboard file to `dashboard.xprjson` and deploy it using Docker.

Use this Dockerfile:

```Dockerfile
FROM python:3.11

# assume your application is named application.xprjson
COPY application.xprjson application.xprjson

# install py-chalk-it and gunicorn
RUN pip install py-chalk-it gunicorn

# this configuration is needed for your app to work, do not change it
ENTRYPOINT ["gunicorn", "chlkt.render:app", "run", "--bind", "0.0.0.0:80"]
```

Build the docker image:

```sh
docker build . -t application
```

Run it:

```sh
docker run -p 5000:80 application
```

Your dashboard will be displayed on port 5000.

## Roadmap

- 3 clicks dashboard cloud sharing
- Command line interface (project open, render ...)
- PyDeck support

## Contributing

If you are a developer, and wish to contribute, please read the [contribution rules](CONTRIBUTING.md).
 
