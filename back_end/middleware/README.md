# Description

An instance of ChalkitApi is provided to user scripts as `chalkit`. It can be used by scripts to interact with Chalk'it.

Aside from utility functions, it provides a set of methods to build the script's output. The output method can be used as an alternative to a return statement. If called multiple times the results will be combined as a JSON array or object.

As Chalk'it can only handle JSON data, any returned python object will be converted according to a set of heuristics. Lists, dicts, strings, and numbers will be directly mapped to their JSON equivalent; plots from known libraries will be converted to images (preferably SVG); etc. As a last resort, the object will be pickled and sent as binary data. If this fails, an error is raised.

The `as_*` methods can be used to force the results to use a specific conversion:

```python
dataframe = compute_my_data()
return [chalkit.as_json(dataframe), chalkit.as_python(dataframe)]
```

The `output_*` methods are just conveniences to return a converted value. `chalkit.output_json(dataframe)` is the same as `chalkit.output(chalkit.as_json(dataframe))`.

Details on the methods such as `as_data`, `as_image`, `as_json`, `as_python`, `base64_to_bytes`, `debug`, `output`, `output_data`, `output_image`, `output_json`, and `output_python` are described with parameters, return types, and examples of usage.

# Development

## Prerequisites

The useful scripts are run through hatch.

```shell
pip install hatch # or another tool of choice (conda...)
```

## Scripts

To be considered before every *commit*, or at least before a *push*.

### Formatting

Should be the strict minimum always used to avoid unnecessary format changes in the history.

```commandline
hatch run lint:fmt
```

### Tests

```commandline
hatch run test:run-coverage
```

### Linter

```commandline
hatch run lint:all
```

# Build

```shell
pip install build # or another tool of choice (conda...)
python -m build
```

The `whl` file is placed in `dist`.

