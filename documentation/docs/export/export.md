# Application export

An Chalk'it project may be:

- previewed in full-page view
- exported to a standalone html page on the local disk. Running this page from disk have many limitations, due to security restrictions of the browser. Pyodide workers are disabled. Some fonts are also blocked. Use this mode for JavaScript-only dashboards, for local tests.
- deployed as Docker images. See [Docker deployment](#docker-deployment) section for more information.

## Security considerations

When a HTML page is generated with Chalk'it, either exported, public or private, the xprjson content is inlined into the HTML page code, and might include sensitive information such as passwords, API keys, authorization information...

Safely handling secrets is currenly outside Chalk'it scope.

## Docker deployment

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