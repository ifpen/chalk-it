# Front-end contributor guide

## File naming rules

1-Use all lowercase filenames. There are some operating systems that are not case sensitive for filenames and using all lowercase prevents inadvertently using two files that differ only in case that might not work on some operating systems.

2-Don't use spaces in the filename. While this technically can be made to work there are lots of reasons why spaces in filenames can lead to problems.

3-A dash is OK for a word separator. If you want to use some sort of separator for multiple words instead of a space or camelcase as in various-scripts.js, a dash is a safe and useful and commonly used separator.

4-Think about using version numbers in your filenames. When you want to upgrade your scripts, plan for the effects of browser or CDN caching. The simplest way to use long term caching (for speed and efficiency), but immediate and safe upgrades when you upgrade a JS file is to include a version number in the deployed filename or path (like jQuery does with jquery-1.6.2.js) and then you bump/change that version number whenever you upgrade/change the file. This will guarantee that no page that requests the newer version is ever served the older version from a cache.

## Variable naming rules

1-Variable and function names written as camelCase

2-Global variables written in UPPERCASE (We don't, but it's quite common)

3-Constants (like PI) written in UPPERCASE

## Architectural principles

1-"Single source of truth" principal. No information redefinition

2-For established information declaration, use JSON (not code).

3-Establish modularity everywhere. At editor, at runtime. Only load used modules

## Code style

### JavaScript

- Currently, use K&R style indentation for if else

## Assets

See [Assets contributing guide](./source/assets/readme.md)
