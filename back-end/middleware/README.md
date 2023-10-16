# Description



# Documentation


# Développement

## Prérequis

Les scripts utiles passent par hatch.

```shell
pip install hatch # ou autre outil au choix (conda...)
```

## Scripts

À considérer avant tout *commit*, ou du moins avant un *push*.

### Mise en forme

Devrait être le strict minimum à toujours utiliser pour éviter les changements de forme superflus dans l'historique.

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
pip install build # ou autre outil au choix (conda...)
python -m build
```

Le fichier `whl` est placé dans `dist`.